"""
Controlled Experimental Framework for Fair Model Comparison
===========================================================
Course: ES 335 - Machine Learning (IIT Gandhinagar)
Project: Signature Memorization vs. Unseen Attack Generalization in Network Intrusion Detection

Helper library used by the notebooks. Nothing here runs on import: every
experiment is executed from `notebooks/`, which are the single source of truth.
All settings come from `config.yaml`.

Protocol guarantees:
1. Official KDDTrain+ / KDDTest+ split. Tuning folds come only from KDDTrain+.
2. Novelty-aware CV ("leave attack types out"): each fold holds out a group of training
   attack TYPES plus a random share of normal rows; the objective is the ROC-AUC of the
   held-out attack types vs the held-out normals. This mimics detecting unseen attacks
   without touching KDDTest+.
3. Identical preprocessor for every model (OneHotEncoder + StandardScaler, 122 features),
   refit inside every fold and, for the final model, on KDDTrain+ only.
4. Identical Optuna TPE budget for every model. The final model is refit with the FULL
   parameter set of the best trial (tuned + fixed, incl. random_state).
5. One evaluation on KDDTest+ per model and seed: at the fixed 0.5 threshold, threshold-free
   (ROC-AUC / PR-AUC), at FPR budgets read off the test ROC curve, and at deployable
   thresholds calibrated on out-of-fold training normals.
"""

from __future__ import annotations

import json
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Sequence

import joblib
import numpy as np
import optuna
import pandas as pd
from joblib import Parallel, delayed
from scipy.stats import chi2
from sklearn.metrics import (
    accuracy_score, average_precision_score, confusion_matrix, f1_score,
    precision_score, recall_score, roc_auc_score,
)
from sklearn.pipeline import Pipeline

from src.config import load_config
from src.data_loader import PROJECT_ROOT, load_nsl_kdd
from src.preprocessing import create_preprocessor, split_features_target

optuna.logging.set_verbosity(optuna.logging.WARNING)

CFG: dict = load_config()
SEED: int = int(CFG["seed"])
SEEDS: List[int] = [int(s) for s in CFG["seeds"]]
N_TRIALS: int = int(CFG["tuning"]["n_trials"])
N_SPLITS: int = int(CFG["cv"]["n_splits"])
THRESHOLD: float = float(CFG["evaluation"]["decision_threshold"])
FPR_BUDGETS: List[float] = [float(b) for b in CFG["evaluation"]["fpr_budgets"]]
MATCHED_FPR: float = float(CFG["evaluation"]["matched_fpr_for_tests"])
N_BOOTSTRAPS: int = int(CFG["evaluation"]["bootstrap_iterations"])
ALPHA: float = float(CFG["evaluation"]["alpha"])
CLASS_WEIGHT = CFG["models"]["class_weight"]

_P = {k: PROJECT_ROOT / v for k, v in CFG["paths"].items()}
MODELS_DIR: Path = _P["models"]
SCALARS_DIR: Path = _P["scalars"]
METRICS_DIR: Path = _P["metrics"]
PRED_DIR: Path = _P["predictions"]
TUNING_DIR: Path = _P["tuning"]
TABLES_DIR: Path = _P["tables"]
FIGURES_DIR: Path = _P["figures"]
SPLITS_DIR: Path = _P["splits"]
EDA_DIR: Path = _P["eda"]

ATTACK_CATEGORIES = ["DoS", "Probe", "R2L", "U2R"]


def ensure_dirs(*dirs: Path) -> None:
    for d in dirs:
        Path(d).mkdir(parents=True, exist_ok=True)


def file_key(model_name: str) -> str:
    """'Logistic Regression' -> 'logistic_regression' (artifact file stem)."""
    return model_name.lower().replace(" ", "_")


def budget_key(b: float) -> str:
    return f"fpr_{b * 100:g}pct"


# ---------------------------------------------------------------------------
# Data and novelty folds
# ---------------------------------------------------------------------------
@dataclass
class Dataset:
    train_df: pd.DataFrame
    test_df: pd.DataFrame
    X_train: pd.DataFrame
    y_train: pd.Series
    X_test: pd.DataFrame
    y_test: pd.Series
    seen_attacks: List[str]
    unseen_attacks: List[str]


def load_dataset() -> Dataset:
    """Load the official split and derive the seen / unseen attack lists."""
    train_df, test_df = load_nsl_kdd(PROJECT_ROOT / CFG["paths"]["train"],
                                     PROJECT_ROOT / CFG["paths"]["test"])
    X_train, y_train = split_features_target(train_df, target_col="is_intrusion")
    X_test, y_test = split_features_target(test_df, target_col="is_intrusion")
    train_attacks = set(train_df.loc[train_df["is_intrusion"] == 1, "label"])
    test_attacks = set(test_df.loc[test_df["is_intrusion"] == 1, "label"])
    unseen = sorted(test_attacks - train_attacks)
    seen = sorted(test_attacks & train_attacks)
    assert len(unseen) == 17, f"Expected 17 unseen attacks, found {len(unseen)}"
    return Dataset(train_df, test_df, X_train, y_train, X_test, y_test, seen, unseen)


def attack_type_groups(train_df: pd.DataFrame, n_splits: int = N_SPLITS) -> Dict[str, int]:
    """Deterministic attack type -> fold assignment.

    Types are sorted by training row count (descending) and dealt round-robin, so every
    fold holds out one of the large types and a mix of small ones.
    """
    counts = train_df.loc[train_df["is_intrusion"] == 1, "label"].value_counts()
    order = sorted(counts.index, key=lambda t: (-counts[t], t))
    return {t: i % n_splits for i, t in enumerate(order)}


def novelty_folds(train_df: pd.DataFrame, seed: int = SEED, n_splits: int = N_SPLITS):
    """Leave-attack-types-out folds over all of KDDTrain+ (row positions).

    Fold k validates on the attack types assigned to k plus a random 1/n_splits of the
    normal rows, and trains on everything else. Every row is held out exactly once.
    """
    groups = attack_type_groups(train_df, n_splits)
    labels = train_df["label"].to_numpy()
    is_attack = train_df["is_intrusion"].to_numpy() == 1
    fold_of = np.full(len(train_df), -1)
    fold_of[is_attack] = [groups[t] for t in labels[is_attack]]
    normal_pos = np.flatnonzero(~is_attack)
    rng = np.random.default_rng(seed)
    fold_of[rng.permutation(normal_pos)] = np.arange(len(normal_pos)) % n_splits
    assert (fold_of >= 0).all()
    folds = [(np.flatnonzero(fold_of != k), np.flatnonzero(fold_of == k)) for k in range(n_splits)]
    return folds, groups


def save_fold_assignment(train_df: pd.DataFrame, seed: int = SEED) -> Dict[str, Path]:
    ensure_dirs(SPLITS_DIR)
    folds, groups = novelty_folds(train_df, seed)
    by_fold = {k: sorted(t for t, f in groups.items() if f == k) for k in range(N_SPLITS)}
    p1 = SPLITS_DIR / "attack_type_folds.json"
    p1.write_text(json.dumps({"scheme": "leave_attack_type_out", "n_splits": N_SPLITS,
                              "attack_types_per_fold": by_fold}, indent=2))
    fold_of = np.empty(len(train_df), dtype=int)
    for k, (_, va) in enumerate(folds):
        fold_of[va] = k
    p2 = SPLITS_DIR / f"fold_of_row_seed{seed}.npy"
    np.save(p2, fold_of)
    return {"attack_type_folds": p1, "fold_of_row": p2}


# ---------------------------------------------------------------------------
# Operating points and threshold-free metrics
# ---------------------------------------------------------------------------
def threshold_for_fpr(normal_scores: np.ndarray, budget: float) -> float:
    """Smallest threshold t such that the share of normals with score > t is <= budget."""
    s = np.sort(np.asarray(normal_scores, dtype=float))
    cand = np.unique(s)
    fpr = (len(s) - np.searchsorted(s, cand, side="right")) / len(s)
    ok = np.flatnonzero(fpr <= budget)
    return float(cand[ok[0]]) if len(ok) else float(cand[-1])


def operating_point(y_true, y_prob, is_unseen, threshold: float) -> dict:
    y_true, y_prob, is_unseen = map(np.asarray, (y_true, y_prob, is_unseen))
    pred = y_prob > threshold
    att = y_true == 1
    seen, uns = att & ~is_unseen, att & is_unseen
    return {"threshold": float(threshold),
            "fpr": float(pred[~att].mean()),
            "attack_recall": float(pred[att].mean()),
            "seen_recall": float(pred[seen].mean()) if seen.any() else 0.0,
            "unseen_recall": float(pred[uns].mean()) if uns.any() else 0.0}


def threshold_free(y_true, y_prob, is_unseen) -> dict:
    y_true, y_prob, is_unseen = map(np.asarray, (y_true, y_prob, is_unseen))
    norm = y_true == 0
    seen_m = norm | ((y_true == 1) & ~is_unseen)
    uns_m = norm | ((y_true == 1) & is_unseen)
    one = len(np.unique(y_prob)) > 1
    return {"roc_auc": float(roc_auc_score(y_true, y_prob)) if one else 0.5,
            "pr_auc": float(average_precision_score(y_true, y_prob)),
            "roc_auc_seen_vs_normal": float(roc_auc_score(y_true[seen_m], y_prob[seen_m])) if one else 0.5,
            "roc_auc_unseen_vs_normal": float(roc_auc_score(y_true[uns_m], y_prob[uns_m])) if one else 0.5,
            "n_distinct_scores": int(len(np.unique(y_prob)))}


# ---------------------------------------------------------------------------
# Metrics
# ---------------------------------------------------------------------------
def compute_comprehensive_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    test_df: pd.DataFrame,
    unseen_attacks: Sequence[str],
    model_name: str,
    hyperparameters: dict,
    train_time: float = 0.0,
    infer_time: float = 0.0,
    y_prob: Optional[np.ndarray] = None,
    oof_thresholds: Optional[Dict[str, float]] = None,
) -> tuple[dict, pd.DataFrame]:
    """Binary, per-category, seen vs unseen, per-unseen-attack and (with y_prob) operating-point metrics."""
    y_true = np.asarray(y_true).astype(int)
    y_pred = np.asarray(y_pred).astype(int)
    r = lambda v, d=6: float(round(float(v), d))

    cm = confusion_matrix(y_true, y_pred, labels=[0, 1])
    tn, fp, fn, tp = cm.ravel()
    overall = {
        "accuracy": r(accuracy_score(y_true, y_pred)),
        "macro_f1": r(f1_score(y_true, y_pred, average="macro", zero_division=0)),
        "weighted_f1": r(f1_score(y_true, y_pred, average="weighted", zero_division=0)),
        "attack_precision": r(precision_score(y_true, y_pred, pos_label=1, zero_division=0)),
        "attack_recall": r(recall_score(y_true, y_pred, pos_label=1, zero_division=0)),
        "attack_f1": r(f1_score(y_true, y_pred, pos_label=1, zero_division=0)),
        "normal_precision": r(precision_score(y_true, y_pred, pos_label=0, zero_division=0)),
        "normal_recall": r(recall_score(y_true, y_pred, pos_label=0, zero_division=0)),
        "normal_f1": r(f1_score(y_true, y_pred, pos_label=0, zero_division=0)),
        "false_positive_rate": r(fp / (fp + tn) if (fp + tn) else 0.0),
        "false_negative_rate": r(fn / (fn + tp) if (fn + tp) else 0.0),
        "specificity": r(tn / (tn + fp) if (tn + fp) else 0.0),
        "confusion_matrix": cm.tolist(),
    }

    pred_df = pd.DataFrame({
        "y_true": y_true,
        "y_pred": y_pred,
        "attack_name": test_df["label"].to_numpy(),
        "attack_category": test_df["attack_category"].to_numpy(),
        "is_unseen": test_df["label"].isin(unseen_attacks).to_numpy(),
    })
    if y_prob is not None:
        pred_df["y_prob"] = np.asarray(y_prob, dtype=float)

    def recall_block(mask: np.ndarray) -> dict:
        tot = int(mask.sum())
        det = int((pred_df.loc[mask, "y_pred"] == 1).sum())
        return {"total_samples": tot, "detected": det, "missed": tot - det,
                "recall": r(det / tot if tot else 0.0, 4)}

    attack = (pred_df["y_true"] == 1).to_numpy()
    unseen = pred_df["is_unseen"].to_numpy()
    cats = pred_df["attack_category"].to_numpy()
    names = pred_df["attack_name"].to_numpy()

    category = {c: recall_block(attack & (cats == c)) for c in ATTACK_CATEGORIES}
    seen_b, unseen_b = recall_block(attack & ~unseen), recall_block(attack & unseen)
    per_unseen = {}
    for a in unseen_attacks:
        m = attack & (names == a)
        per_unseen[a] = {"category": str(cats[m][0]) if m.any() else "Unknown", **recall_block(m)}

    # Category-stratified seen / unseen recall and a composition-reweighted gap.
    strat = {c: {"seen": recall_block(attack & ~unseen & (cats == c)),
                 "unseen": recall_block(attack & unseen & (cats == c))} for c in ATTACK_CATEGORIES}
    w = {c: strat[c]["unseen"]["total_samples"] / max(unseen_b["total_samples"], 1) for c in ATTACK_CATEGORIES}
    reweighted_seen = sum(w[c] * strat[c]["seen"]["recall"] for c in ATTACK_CATEGORIES)
    macro_unseen = float(np.mean([v["recall"] for v in per_unseen.values()])) if per_unseen else 0.0

    payload = {
        "model": model_name,
        "framework": "ES335 Controlled Experimental Framework (122 features, leave-attack-type-out CV, notebooks)",
        "hyperparameters": hyperparameters,
        "decision_threshold": THRESHOLD,
        "evaluation_dataset": f"NSL-KDD official test set (KDDTest+), {len(y_true):,} records "
                              f"({int((y_true == 0).sum()):,} Normal, {int((y_true == 1).sum()):,} Attack)",
        "timing": {
            "training_time_seconds": r(train_time, 3),
            "inference_time_seconds": r(infer_time, 4),
            "inference_us_per_sample": r(infer_time / len(y_true) * 1e6, 2),
        },
        "overall_metrics": overall,
        "attack_category_recall": category,
        "seen_vs_unseen_recall": {
            "seen_total": seen_b["total_samples"], "seen_detected": seen_b["detected"],
            "seen_recall": seen_b["recall"],
            "unseen_total": unseen_b["total_samples"], "unseen_detected": unseen_b["detected"],
            "unseen_recall": unseen_b["recall"],
            "generalization_drop_percentage_points": r((seen_b["recall"] - unseen_b["recall"]) * 100, 2),
            "unseen_macro_recall_over_types": r(macro_unseen, 4),
            "seen_recall_reweighted_to_unseen_category_mix": r(reweighted_seen, 4),
            "reweighted_drop_percentage_points": r((reweighted_seen - unseen_b["recall"]) * 100, 2),
        },
        "category_stratified_seen_unseen_recall": strat,
        "per_unseen_attack_recall": per_unseen,
    }

    if y_prob is not None:
        payload["threshold_free"] = {k: (r(v) if isinstance(v, float) else v)
                                     for k, v in threshold_free(y_true, y_prob, unseen).items()}
        norm_scores = np.asarray(y_prob)[y_true == 0]
        payload["test_roc_operating_points"] = {
            budget_key(b): operating_point(y_true, y_prob, unseen, threshold_for_fpr(norm_scores, b))
            for b in FPR_BUDGETS}
        if oof_thresholds:
            payload["deployable_operating_points"] = {
                k: operating_point(y_true, y_prob, unseen, t) for k, t in oof_thresholds.items()}
    return payload, pred_df


# ---------------------------------------------------------------------------
# Novelty CV, tuning and final fit
# ---------------------------------------------------------------------------
@dataclass
class ExperimentResult:
    model_name: str
    seed: int
    pipeline: Pipeline
    best_params: dict          # FULL parameter dict used for the final model
    best_cv_auc: float
    best_cv_fold_aucs: List[float]
    oof: pd.DataFrame          # out-of-fold P(attack) on KDDTrain+ for the best trial
    oof_thresholds: Dict[str, float]
    trials: List[dict]
    study: optuna.Study
    metrics: dict
    predictions: pd.DataFrame


def make_pipeline(estimator_factory: Callable[[dict], Any], params: dict, X_fit: pd.DataFrame) -> Pipeline:
    return Pipeline([("prep", create_preprocessor(X_fit)), ("clf", estimator_factory(params))])


def _fit_score_fold(estimator_factory, params, X, y, tr, va):
    pipe = make_pipeline(estimator_factory, params, X.iloc[tr])
    pipe.fit(X.iloc[tr], y.iloc[tr])
    p = pipe.predict_proba(X.iloc[va])[:, 1]
    return p, float(roc_auc_score(y.iloc[va], p))


def novelty_cv(estimator_factory: Callable[[dict], Any], params: dict, data: Dataset,
               seed: int = SEED, n_splits: int = N_SPLITS, fold_jobs: int = 1):
    """Leave-attack-types-out CV. Returns (mean AUC, fold AUCs, out-of-fold scores)."""
    folds, _ = novelty_folds(data.train_df, seed, n_splits)
    out = Parallel(n_jobs=fold_jobs)(delayed(_fit_score_fold)(estimator_factory, params, data.X_train,
                                                              data.y_train, tr, va) for tr, va in folds)
    oof = np.empty(len(data.y_train))
    for (_, va), (p, _) in zip(folds, out):
        oof[va] = p
    aucs = [a for _, a in out]
    return float(np.mean(aucs)), aucs, oof


def run_controlled_experiment(
    model_name: str,
    suggest_fn: Callable[[optuna.Trial], dict],
    estimator_factory: Callable[[dict], Any],
    fixed_params: dict,
    seed: int = SEED,
    data: Optional[Dataset] = None,
    n_trials: int = N_TRIALS,
    n_splits: int = N_SPLITS,
    fold_jobs: int = 1,
    verbose: bool = True,
) -> ExperimentResult:
    """Tune with leave-attack-types-out CV on KDDTrain+, refit on KDDTrain+, score KDDTest+ once.

    ``suggest_fn(trial)`` returns only the TUNED parameters; ``fixed_params`` holds the rest.
    If ``fixed_params`` has a ``random_state`` key it is set to ``seed``. Every trial and the
    final model use ``{**fixed_params, **tuned}``; the full dict is stored on the trial so the
    final refit uses exactly the tuned configuration.
    """
    data = data or load_dataset()
    fixed = dict(fixed_params)
    if "random_state" in fixed:
        fixed["random_state"] = seed
    trials_log: List[dict] = []
    oof_by_trial: Dict[int, np.ndarray] = {}

    def objective(trial: optuna.Trial) -> float:
        tuned = suggest_fn(trial)
        clash = set(tuned) & set(fixed)
        if clash:
            raise ValueError(f"Parameters both tuned and fixed: {sorted(clash)}")
        params = {**fixed, **tuned}
        trial.set_user_attr("params", params)
        t0 = time.perf_counter()
        mean, aucs, oof = novelty_cv(estimator_factory, params, data, seed, n_splits, fold_jobs)
        trial.set_user_attr("fold_aucs", aucs)
        oof_by_trial[trial.number] = oof
        trials_log.append({"trial_number": trial.number, "params": params, "fold_auc": aucs,
                           "mean_auc": mean, "std_auc": float(np.std(aucs)),
                           "duration_seconds": round(time.perf_counter() - t0, 2)})
        if verbose:
            print(f"  [{model_name} | seed {seed}] trial {trial.number + 1:02d}/{n_trials}  "
                  f"novelty CV AUC {mean:.4f} (±{np.std(aucs):.4f})", flush=True)
        return mean

    study = optuna.create_study(direction="maximize", sampler=optuna.samplers.TPESampler(seed=seed))
    study.optimize(objective, n_trials=n_trials)
    best = study.best_trial
    best_params = dict(best.user_attrs["params"])
    oof = oof_by_trial[best.number]
    y_tr = data.y_train.to_numpy()
    oof_thresholds = {budget_key(b): threshold_for_fpr(oof[y_tr == 0], b) for b in FPR_BUDGETS}
    oof_df = pd.DataFrame({"y_true": y_tr, "label": data.train_df["label"].to_numpy(), "oof_prob": oof})

    t0 = time.perf_counter()
    final = make_pipeline(estimator_factory, best_params, data.X_train)
    final.fit(data.X_train, data.y_train)
    fit_s = time.perf_counter() - t0
    check_final_params(final, best_params)

    t0 = time.perf_counter()
    y_prob = final.predict_proba(data.X_test)[:, 1]
    infer_s = time.perf_counter() - t0
    # '>' matches sklearn's predict() at 0.5 (exact ties go to the normal class).
    y_pred = (y_prob > THRESHOLD).astype(int)

    metrics, preds = compute_comprehensive_metrics(
        data.y_test.to_numpy(), y_pred, data.test_df, data.unseen_attacks, model_name,
        hyperparameters={**best_params, "best_novelty_cv_auc": round(best.value, 6),
                         "best_novelty_cv_auc_std": round(float(np.std(best.user_attrs["fold_aucs"])), 6)},
        train_time=fit_s, infer_time=infer_s, y_prob=y_prob, oof_thresholds=oof_thresholds,
    )
    metrics["seed"] = seed
    metrics["oof_thresholds"] = oof_thresholds
    return ExperimentResult(model_name, seed, final, best_params, float(best.value),
                            list(best.user_attrs["fold_aucs"]), oof_df, oof_thresholds,
                            trials_log, study, metrics, preds)


def check_final_params(pipeline: Pipeline, params: dict) -> None:
    """Fail loudly if the fitted estimator does not carry the intended parameters."""
    got = pipeline.named_steps["clf"].get_params()
    bad = {k: (v, got.get(k)) for k, v in params.items() if got.get(k) != v}
    if bad:
        raise AssertionError(f"Final estimator parameters differ from the tuned ones: {bad}")


def save_experiment(res: ExperimentResult, primary: bool = True) -> Dict[str, Path]:
    """Persist results. The primary seed writes the model and the headline files;
    other seeds write metrics, predictions and trial logs under */seeds/."""
    key = file_key(res.model_name)
    sub = "" if primary else "seeds"
    suffix = "" if primary else f"_seed{res.seed}"
    mdir, pdir, tdir = METRICS_DIR / sub, PRED_DIR / sub, TUNING_DIR / sub
    ensure_dirs(mdir, pdir, tdir)
    paths = {
        "metrics": mdir / f"{key}{suffix}.json",
        "predictions": pdir / f"{key}{suffix}_predictions.csv",
        "tuning_json": tdir / f"{key}{suffix}_trials.json",
        "tuning_csv": tdir / f"{key}{suffix}_trials.csv",
    }
    if primary:
        ensure_dirs(MODELS_DIR)
        paths["model"] = MODELS_DIR / f"{key}.joblib"
        joblib.dump(res.pipeline, paths["model"], compress=3)
        paths["oof"] = pdir / f"{key}_oof_train_scores.csv"
        res.oof.to_csv(paths["oof"], index=False)
    paths["metrics"].write_text(json.dumps(res.metrics, indent=2))
    res.predictions.to_csv(paths["predictions"], index=False)
    paths["tuning_json"].write_text(json.dumps({
        "model": res.model_name, "seed": res.seed, "n_trials": len(res.trials),
        "objective": "mean ROC-AUC, leave-attack-types-out CV on KDDTrain+",
        "best_params": res.best_params, "best_novelty_cv_auc": res.best_cv_auc,
        "best_fold_aucs": res.best_cv_fold_aucs, "oof_thresholds": res.oof_thresholds,
        "trials": res.trials}, indent=2, default=str))
    trials_table(res).to_csv(paths["tuning_csv"], index=False)
    return paths


def trials_table(res: ExperimentResult) -> pd.DataFrame:
    rows = [{"trial": t["trial_number"], "mean_auc": t["mean_auc"], "std_auc": t["std_auc"],
             "duration_seconds": t["duration_seconds"], **t["params"]} for t in res.trials]
    return pd.DataFrame(rows).sort_values("mean_auc", ascending=False).reset_index(drop=True)


def summary_row(metrics: dict) -> dict:
    o, s = metrics["overall_metrics"], metrics["seen_vs_unseen_recall"]
    row = {
        "model": metrics["model"],
        "accuracy": o["accuracy"], "macro_f1": o["macro_f1"],
        "attack_precision": o["attack_precision"], "attack_recall": o["attack_recall"],
        "false_positive_rate": o["false_positive_rate"],
        "seen_recall": s["seen_recall"], "unseen_recall": s["unseen_recall"],
        "generalization_drop_pp": s["generalization_drop_percentage_points"],
        "reweighted_drop_pp": s.get("reweighted_drop_percentage_points"),
        "unseen_macro_recall": s.get("unseen_macro_recall_over_types"),
        **{f"{c}_recall": metrics["attack_category_recall"][c]["recall"] for c in ATTACK_CATEGORIES},
        "inference_us_per_sample": metrics["timing"]["inference_us_per_sample"],
    }
    tf = metrics.get("threshold_free")
    if tf:
        row.update({"roc_auc": tf["roc_auc"], "pr_auc": tf["pr_auc"],
                    "auc_seen_vs_normal": tf["roc_auc_seen_vs_normal"],
                    "auc_unseen_vs_normal": tf["roc_auc_unseen_vs_normal"]})
        for k, v in metrics["test_roc_operating_points"].items():
            row[f"unseen_recall@test_{k}"] = v["unseen_recall"]
        for k, v in metrics.get("deployable_operating_points", {}).items():
            row[f"test_fpr@oof_{k}"] = v["fpr"]
            row[f"unseen_recall@oof_{k}"] = v["unseen_recall"]
    return row


# ---------------------------------------------------------------------------
# Statistics
# ---------------------------------------------------------------------------
def compute_mcnemar_test(y_true: np.ndarray, y_pred1: np.ndarray, y_pred2: np.ndarray) -> dict:
    """McNemar's test on paired predictions (chi-square, Edwards continuity correction).

    Two-sided: tests whether the two models make different errors, not which is better.
    """
    c1, c2 = (np.asarray(y_pred1) == y_true), (np.asarray(y_pred2) == y_true)
    b, c = int(np.sum(c1 & ~c2)), int(np.sum(~c1 & c2))
    a, d = int(np.sum(c1 & c2)), int(np.sum(~c1 & ~c2))
    n = b + c
    stat = float((abs(b - c) - 1.0) ** 2 / n) if n else 0.0
    p = float(chi2.sf(stat, df=1)) if n else 1.0
    return {
        "contingency_table": {"both_correct": a, "m1_correct_m2_wrong": b,
                              "m1_wrong_m2_correct": c, "both_wrong": d},
        "disagreements": n,
        "statistic": float(round(stat, 4)),
        "p_value": p,
        "alternative": "two-sided",
    }


def holm_adjust(p_values: Sequence[float]) -> np.ndarray:
    """Holm-Bonferroni step-down adjusted p-values (same order as the input)."""
    p = np.asarray(p_values, dtype=float)
    m = len(p)
    order = np.argsort(p)
    adj = np.empty(m)
    running = 0.0
    for rank, i in enumerate(order):
        running = max(running, (m - rank) * p[i])
        adj[i] = min(1.0, running)
    return adj


def _seen_unseen_recall(y_true, y_pred, is_unseen):
    att = y_true == 1
    s, u = att & ~is_unseen, att & is_unseen
    sr = (y_pred[s] == 1).mean() if s.any() else 0.0
    ur = (y_pred[u] == 1).mean() if u.any() else 0.0
    return sr, ur


def _ci(arr) -> dict:
    arr = np.asarray(arr)
    return {"mean": float(round(arr.mean(), 4)), "std": float(round(arr.std(), 4)),
            "ci_95_lower": float(round(np.percentile(arr, 2.5), 4)),
            "ci_95_upper": float(round(np.percentile(arr, 97.5), 4))}


def compute_bootstrap_cis(pred_df: pd.DataFrame, n_bootstraps: int = N_BOOTSTRAPS, seed: int = SEED) -> dict:
    """Percentile bootstrap over test rows (captures test-set sampling only)."""
    rng = np.random.default_rng(seed)
    y_t, y_p = pred_df["y_true"].to_numpy(), pred_df["y_pred"].to_numpy()
    unseen = pred_df["is_unseen"].to_numpy()
    n = len(pred_df)
    f1s, sr, ur = [], [], []
    for _ in range(n_bootstraps):
        i = rng.integers(0, n, n)
        f1s.append(f1_score(y_t[i], y_p[i], average="macro", zero_division=0))
        s, u = _seen_unseen_recall(y_t[i], y_p[i], unseen[i])
        sr.append(s); ur.append(u)
    sr, ur = np.array(sr), np.array(ur)
    return {"macro_f1": _ci(f1s), "seen_recall": _ci(sr), "unseen_recall": _ci(ur),
            "generalization_gap_pp": _ci((sr - ur) * 100)}


def compute_cluster_bootstrap_unseen(pred_df: pd.DataFrame, n_bootstraps: int = N_BOOTSTRAPS,
                                     seed: int = SEED, score_col: str = "y_pred") -> dict:
    """Bootstrap that resamples unseen attack TYPES (clusters) with replacement.

    Rows of the same attack type are not independent, so this CI for unseen recall is the
    relevant one when generalising to other unseen attack types. Returns CIs for micro
    recall (pooled rows) and macro recall (mean over types).
    """
    rng = np.random.default_rng(seed)
    u = pred_df[(pred_df["y_true"] == 1) & pred_df["is_unseen"]]
    g = u.groupby("attack_name")[score_col].agg(["sum", "count"])
    det, tot = g["sum"].to_numpy(float), g["count"].to_numpy(float)
    k = len(g)
    micro, macro = [], []
    for _ in range(n_bootstraps):
        i = rng.integers(0, k, k)
        micro.append(det[i].sum() / tot[i].sum())
        macro.append((det[i] / tot[i]).mean())
    return {"n_types": int(k), "unseen_recall_micro": _ci(micro), "unseen_recall_macro": _ci(macro)}


def _matched_fpr_unseen_recall(y_t, prob, unseen, budget):
    t = threshold_for_fpr(prob[y_t == 0], budget)
    m = (y_t == 1) & unseen
    return float((prob[m] > t).mean()) if m.any() else 0.0


def _auc_unseen(y_t, prob, unseen):
    m = (y_t == 0) | ((y_t == 1) & unseen)
    return roc_auc_score(y_t[m], prob[m]) if len(np.unique(prob[m])) > 1 else 0.5


def compute_paired_bootstrap(pred_a: pd.DataFrame, pred_b: pd.DataFrame,
                             n_bootstraps: int = N_BOOTSTRAPS, seed: int = SEED,
                             matched_fpr: float = MATCHED_FPR) -> dict:
    """Paired bootstrap of (A - B) on the same resampled test rows.

    Metrics: Macro-F1 and unseen recall at threshold 0.5; ROC-AUC of unseen attacks vs
    normals; unseen recall at a matched test FPR (threshold re-chosen inside every resample
    on the resampled normals). p-values use (count + 1) / (B + 1); ``p_two_sided`` tests
    A == B and ``p_one_sided_a_le_b`` tests A <= B.
    """
    assert (pred_a["y_true"].to_numpy() == pred_b["y_true"].to_numpy()).all()
    rng = np.random.default_rng(seed)
    y_t = pred_a["y_true"].to_numpy()
    pa, pb = pred_a["y_pred"].to_numpy(), pred_b["y_pred"].to_numpy()
    unseen = pred_a["is_unseen"].to_numpy()
    has_prob = "y_prob" in pred_a and "y_prob" in pred_b
    qa = pred_a["y_prob"].to_numpy() if has_prob else None
    qb = pred_b["y_prob"].to_numpy() if has_prob else None
    mkey = f"unseen_recall_at_test_fpr_{matched_fpr * 100:g}pct_pp"
    n = len(y_t)
    d = {"macro_f1": [], "unseen_recall_pp": []}
    if has_prob:
        d.update({"auc_unseen_vs_normal": [], mkey: []})
    for _ in range(n_bootstraps):
        i = rng.integers(0, n, n)
        yt, un = y_t[i], unseen[i]
        d["macro_f1"].append(f1_score(yt, pa[i], average="macro", zero_division=0)
                             - f1_score(yt, pb[i], average="macro", zero_division=0))
        d["unseen_recall_pp"].append((_seen_unseen_recall(yt, pa[i], un)[1]
                                      - _seen_unseen_recall(yt, pb[i], un)[1]) * 100)
        if has_prob:
            d["auc_unseen_vs_normal"].append(_auc_unseen(yt, qa[i], un) - _auc_unseen(yt, qb[i], un))
            d[mkey].append((_matched_fpr_unseen_recall(yt, qa[i], un, matched_fpr)
                            - _matched_fpr_unseen_recall(yt, qb[i], un, matched_fpr)) * 100)

    def block(x):
        x = np.asarray(x)
        le = (np.sum(x <= 0) + 1) / (n_bootstraps + 1)
        ge = (np.sum(x >= 0) + 1) / (n_bootstraps + 1)
        return {**_ci(x), "p_one_sided_a_le_b": float(le), "p_two_sided": float(min(1.0, 2 * min(le, ge)))}

    return {k: block(v) for k, v in d.items()}


# ---------------------------------------------------------------------------
# Output helpers
# ---------------------------------------------------------------------------
def to_markdown_table(df: pd.DataFrame, floatfmt: str = "{:.4f}") -> str:
    """Render a DataFrame as a GitHub Markdown table (no extra dependency)."""
    def fmt(v):
        if isinstance(v, (float, np.floating)):
            return floatfmt.format(v)
        return str(v)
    cols = [str(c) for c in df.columns]
    lines = ["| " + " | ".join(cols) + " |", "|" + "|".join("---" for _ in cols) + "|"]
    lines += ["| " + " | ".join(fmt(v) for v in row) + " |" for row in df.itertuples(index=False)]
    return "\n".join(lines) + "\n"


def save_table(df: pd.DataFrame, name: str, floatfmt: str = "{:.4f}") -> Dict[str, Path]:
    """Save a table as results/tables/<name>.csv and .md."""
    ensure_dirs(TABLES_DIR)
    csv_p, md_p = TABLES_DIR / f"{name}.csv", TABLES_DIR / f"{name}.md"
    df.to_csv(csv_p, index=False)
    md_p.write_text(to_markdown_table(df, floatfmt))
    return {"csv": csv_p, "md": md_p}


def save_figure(fig, notebook_folder: str, name: str) -> Path:
    """Save a matplotlib figure as results/figures/<notebook_folder>/<name>.png."""
    d = FIGURES_DIR / notebook_folder
    ensure_dirs(d)
    p = d / f"{name}.png"
    fig.savefig(p, dpi=120, bbox_inches="tight")
    return p
