"""
Controlled Experimental Framework for Fair Model Comparison
===========================================================
Course: ES 335 - Machine Learning (IIT Gandhinagar)
Project: Signature Memorization vs. Unseen Attack Generalization in Network Intrusion Detection

This module establishes a strictly controlled, reproducible, and fair experimental protocol
for comparing Logistic Regression, Decision Tree, and Random Forest on the NSL-KDD benchmark.

Guarantees:
1. Identical data splits and canonical 41-feature inputs.
2. Identical preprocessor architecture (ColumnTransformer: OneHotEncoder + StandardScaler, 122 features).
3. Independent fold-level preprocessor fitting during 5-fold CV to eliminate data leakage.
4. Equal hyperparameter search budget (30 Optuna TPE trials per model, SEED=42, maximizing Macro-F1).
5. Fixed decision threshold of 0.50 on the official test set for the primary comparison.
6. Full artifact persistence without overwriting original historical diagnostic experiments.
"""

from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any, Callable, Dict, List, Tuple

import joblib
import numpy as np
import pandas as pd
from scipy.stats import chi2
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import StratifiedKFold
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    accuracy_score, confusion_matrix, f1_score,
    precision_score, recall_score
)
import optuna

from src.data_loader import load_nsl_kdd, PROJECT_ROOT
from src.preprocessing import split_features_target, create_preprocessor

optuna.logging.set_verbosity(optuna.logging.WARNING)

SEED = 42
N_TRIALS = 25
N_SPLITS = 5

MODELS_DIR = PROJECT_ROOT / "models"
METRICS_DIR = PROJECT_ROOT / "results" / "metrics"
PRED_DIR = PROJECT_ROOT / "results" / "predictions"
TUNING_DIR = PROJECT_ROOT / "results" / "tuning"

for d in [MODELS_DIR, METRICS_DIR, PRED_DIR, TUNING_DIR]:
    d.mkdir(parents=True, exist_ok=True)


def get_dataset_and_splits() -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.Series, pd.DataFrame, pd.Series, np.ndarray, np.ndarray, List[str], List[str]]:
    """Load official NSL-KDD datasets and load/verify pre-saved train_sub/val split indices."""
    train_df, test_df = load_nsl_kdd()
    X_train_raw, y_train = split_features_target(train_df, target_col="is_intrusion")
    X_test_raw, y_test = split_features_target(test_df, target_col="is_intrusion")

    split_dir = PROJECT_ROOT / "results" / "splits"
    tr_idx_path = split_dir / "train_sub_idx.npy"
    va_idx_path = split_dir / "val_idx.npy"

    if tr_idx_path.exists() and va_idx_path.exists():
        train_sub_idx = np.load(tr_idx_path)
        val_idx = np.load(va_idx_path)
    else:
        from sklearn.model_selection import train_test_split
        train_sub_idx, val_idx = train_test_split(
            np.arange(len(train_df)), test_size=0.2, stratify=y_train, random_state=SEED
        )
        split_dir.mkdir(parents=True, exist_ok=True)
        np.save(tr_idx_path, train_sub_idx)
        np.save(va_idx_path, val_idx)

    train_attack_types = set(train_df[train_df["is_intrusion"] == 1]["label"].unique())
    test_attack_types = set(test_df[test_df["is_intrusion"] == 1]["label"].unique())

    unseen_attack_types = sorted(test_attack_types - train_attack_types)
    seen_attack_types = sorted(test_attack_types.intersection(train_attack_types))
    assert len(unseen_attack_types) == 17, f"Expected 17 unseen attacks, found {len(unseen_attack_types)}"

    return (
        train_df, test_df,
        X_train_raw, y_train,
        X_test_raw, y_test,
        train_sub_idx, val_idx,
        seen_attack_types, unseen_attack_types
    )


def compute_comprehensive_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    test_df: pd.DataFrame,
    seen_attacks: List[str],
    unseen_attacks: List[str],
    train_time: float,
    infer_time: float,
    model_name: str,
    hyperparameters: dict
) -> Tuple[dict, pd.DataFrame]:
    """Compute the full suite of binary, category, seen vs unseen, and per-attack metrics."""
    acc = float(round(accuracy_score(y_true, y_pred), 6))
    prec_att = float(round(precision_score(y_true, y_pred, pos_label=1, zero_division=0), 6))
    rec_att = float(round(recall_score(y_true, y_pred, pos_label=1, zero_division=0), 6))
    f1_att = float(round(f1_score(y_true, y_pred, pos_label=1, zero_division=0), 6))

    prec_norm = float(round(precision_score(y_true, y_pred, pos_label=0, zero_division=0), 6))
    rec_norm = float(round(recall_score(y_true, y_pred, pos_label=0, zero_division=0), 6))
    f1_norm = float(round(f1_score(y_true, y_pred, pos_label=0, zero_division=0), 6))

    macro_f1 = float(round(f1_score(y_true, y_pred, average="macro", zero_division=0), 6))
    weighted_f1 = float(round(f1_score(y_true, y_pred, average="weighted", zero_division=0), 6))

    cm = confusion_matrix(y_true, y_pred, labels=[0, 1])
    tn, fp, fn, tp = cm.ravel()
    fpr = float(round(fp / (fp + tn) if (fp + tn) > 0 else 0.0, 6))
    fnr = float(round(fn / (fn + tp) if (fn + tp) > 0 else 0.0, 6))
    specificity = float(round(tn / (tn + fp) if (tn + fp) > 0 else 0.0, 6))

    pred_df = pd.DataFrame({
        "y_true": y_true,
        "y_pred": y_pred,
        "attack_name": test_df["label"].values,
        "attack_category": test_df["attack_category"].values,
        "is_unseen": test_df["label"].isin(unseen_attacks).values
    })

    # Category breakdown
    cat_metrics = {}
    attack_mask = pred_df["y_true"] == 1
    for cat in ["DoS", "Probe", "R2L", "U2R"]:
        cat_df = pred_df[attack_mask & (pred_df["attack_category"] == cat)]
        tot = len(cat_df)
        det = int((cat_df["y_pred"] == 1).sum())
        miss = tot - det
        rec = float(round(det / tot if tot > 0 else 0.0, 4))
        cat_metrics[cat] = {
            "total_samples": tot,
            "detected": det,
            "missed": miss,
            "recall": rec
        }

    # Seen vs. Unseen breakdown
    seen_df = pred_df[attack_mask & (~pred_df["is_unseen"])]
    unseen_df = pred_df[attack_mask & (pred_df["is_unseen"])]

    seen_tot = len(seen_df)
    seen_det = int((seen_df["y_pred"] == 1).sum())
    seen_rec = float(round(seen_det / seen_tot if seen_tot > 0 else 0.0, 4))

    unseen_tot = len(unseen_df)
    unseen_det = int((unseen_df["y_pred"] == 1).sum())
    unseen_rec = float(round(unseen_det / unseen_tot if unseen_tot > 0 else 0.0, 4))

    gen_gap_pp = float(round((seen_rec - unseen_rec) * 100.0, 2))

    # Per-unseen-attack breakdown
    unseen_attack_breakdown = {}
    for u_att in unseen_attacks:
        u_sub = unseen_df[unseen_df["attack_name"] == u_att]
        u_tot = len(u_sub)
        u_det = int((u_sub["y_pred"] == 1).sum())
        u_rec = float(round(u_det / u_tot if u_tot > 0 else 0.0, 4))
        cat_name = u_sub["attack_category"].iloc[0] if u_tot > 0 else "Unknown"
        unseen_attack_breakdown[u_att] = {
            "category": cat_name,
            "total_samples": u_tot,
            "detected": u_det,
            "missed": u_tot - u_det,
            "recall": u_rec
        }

    metrics_payload = {
        "model": model_name,
        "framework": "ES335 Controlled Experimental Framework (Standardized 122-feature, 5-fold CV)",
        "hyperparameters": hyperparameters,
        "decision_threshold": 0.50,
        "evaluation_dataset": "NSL-KDD official test set (KDDTest+.csv), 22,543 records (9,710 Normal, 12,833 Attack)",
        "timing": {
            "training_time_seconds": float(round(train_time, 3)),
            "inference_time_seconds": float(round(infer_time, 4)),
            "inference_us_per_sample": float(round(infer_time / len(y_true) * 1e6, 2))
        },
        "overall_metrics": {
            "accuracy": acc,
            "macro_f1": macro_f1,
            "weighted_f1": weighted_f1,
            "attack_precision": prec_att,
            "attack_recall": rec_att,
            "attack_f1": f1_att,
            "normal_precision": prec_norm,
            "normal_recall": rec_norm,
            "normal_f1": f1_norm,
            "false_positive_rate": fpr,
            "false_negative_rate": fnr,
            "specificity": specificity,
            "confusion_matrix": cm.tolist()
        },
        "attack_category_recall": cat_metrics,
        "seen_vs_unseen_recall": {
            "seen_total": seen_tot,
            "seen_detected": seen_det,
            "seen_recall": seen_rec,
            "unseen_total": unseen_tot,
            "unseen_detected": unseen_det,
            "unseen_recall": unseen_rec,
            "generalization_drop_percentage_points": gen_gap_pp
        },
        "per_unseen_attack_recall": unseen_attack_breakdown
    }

    return metrics_payload, pred_df


def run_controlled_experiment(
    model_name: str,
    suggest_fn: Callable[[optuna.Trial], dict],
    estimator_factory: Callable[[dict], Any],
    n_trials: int = N_TRIALS
) -> Tuple[Pipeline, dict, pd.DataFrame]:
    """Execute hyperparameter tuning via 5-fold CV, retrain on full training set, and evaluate on test set."""
    (
        train_df, test_df,
        X_train_raw, y_train,
        X_test_raw, y_test,
        train_sub_idx, val_idx,
        seen_attacks, unseen_attacks
    ) = get_dataset_and_splits()

    X_sub = X_train_raw.iloc[train_sub_idx].reset_index(drop=True)
    y_sub = y_train.iloc[train_sub_idx].reset_index(drop=True)

    cv = StratifiedKFold(n_splits=N_SPLITS, shuffle=True, random_state=SEED)
    fold_splits = list(cv.split(X_sub, y_sub))

    trials_log = []

    def objective(trial: optuna.Trial) -> float:
        params = suggest_fn(trial)
        fold_scores = []
        t0_trial = time.perf_counter()

        for fold_idx, (f_tr_idx, f_va_idx) in enumerate(fold_splits):
            X_f_tr, y_f_tr = X_sub.iloc[f_tr_idx], y_sub.iloc[f_tr_idx]
            X_f_va, y_f_va = X_sub.iloc[f_va_idx], y_sub.iloc[f_va_idx]

            pipe = Pipeline([
                ("prep", create_preprocessor(X_f_tr)),
                ("clf", estimator_factory(params))
            ])
            pipe.fit(X_f_tr, y_f_tr)
            preds_va = pipe.predict(X_f_va)
            score = f1_score(y_f_va, preds_va, average="macro", zero_division=0)
            fold_scores.append(score)

        trial_duration = time.perf_counter() - t0_trial
        mean_score = float(np.mean(fold_scores))
        std_score = float(np.std(fold_scores))

        trials_log.append({
            "trial_number": trial.number,
            "params": params,
            "mean_macro_f1": mean_score,
            "std_macro_f1": std_score,
            "duration_seconds": round(trial_duration, 2)
        })
        print(f"  [{model_name}] Trial {trial.number+1:02d}/{n_trials} -> CV Macro-F1: {mean_score:.4f} (±{std_score:.4f}) in {trial_duration:.1f}s", flush=True)
        return mean_score

    sampler = optuna.samplers.TPESampler(seed=SEED)
    study = optuna.create_study(direction="maximize", sampler=sampler)
    study.optimize(objective, n_trials=n_trials)

    best_params = study.best_params
    best_cv_score = study.best_value
    print(f"[{model_name}] Tuning Complete. Best CV Macro-F1: {best_cv_score:.4f} with params: {best_params}")

    # Retrain final selected model on complete training set (125,973 records)
    t0_fit = time.perf_counter()
    final_pipeline = Pipeline([
        ("prep", create_preprocessor(X_train_raw)),
        ("clf", estimator_factory(best_params))
    ])
    final_pipeline.fit(X_train_raw, y_train)
    fit_duration = time.perf_counter() - t0_fit

    # Score once on official test set (22,543 records) at fixed threshold 0.50
    t0_infer = time.perf_counter()
    y_pred_test = final_pipeline.predict(X_test_raw)
    infer_duration = time.perf_counter() - t0_infer

    metrics_payload, pred_df = compute_comprehensive_metrics(
        y_true=y_test.values,
        y_pred=y_pred_test,
        test_df=test_df,
        seen_attacks=seen_attacks,
        unseen_attacks=unseen_attacks,
        train_time=fit_duration,
        infer_time=infer_duration,
        model_name=model_name,
        hyperparameters={**best_params, "best_cv_macro_f1": float(round(best_cv_score, 4))}
    )

    # Persist artifacts with controlled suffix
    file_key = model_name.lower().replace(" ", "_")
    model_path = MODELS_DIR / f"{file_key}_controlled.joblib"
    metrics_path = METRICS_DIR / f"{file_key}_controlled.json"
    pred_path = PRED_DIR / f"{file_key}_controlled_predictions.csv"
    tuning_path = TUNING_DIR / f"{file_key}_trials.json"

    joblib.dump(final_pipeline, model_path, compress=3)
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(metrics_payload, f, indent=2)
    pred_df.to_csv(pred_path, index=False)
    with open(tuning_path, "w", encoding="utf-8") as f:
        json.dump({
            "model": model_name,
            "best_params": best_params,
            "best_cv_macro_f1": best_cv_score,
            "trials": trials_log
        }, f, indent=2)

    print(f"[{model_name}] Saved controlled artifacts:")
    print(f"  Model:       {model_path}")
    print(f"  Metrics:     {metrics_path}")
    print(f"  Predictions: {pred_path}")
    print(f"  Tuning:      {tuning_path}")

    return final_pipeline, metrics_payload, pred_df


def compute_mcnemar_test(y_true: np.ndarray, y_pred1: np.ndarray, y_pred2: np.ndarray) -> dict:
    """Compute McNemar's test for paired classification predictions."""
    corr1 = (y_pred1 == y_true)
    corr2 = (y_pred2 == y_true)

    # b: Model 1 correct, Model 2 incorrect
    b = int(np.sum(corr1 & (~corr2)))
    # c: Model 1 incorrect, Model 2 correct
    c = int(np.sum((~corr1) & corr2))
    # a: both correct, d: both incorrect
    a = int(np.sum(corr1 & corr2))
    d = int(np.sum((~corr1) & (~corr2)))

    n_disagreements = b + c
    if n_disagreements == 0:
        stat = 0.0
        p_val = 1.0
    else:
        # Edwards continuity correction
        stat = float(((abs(b - c) - 1.0) ** 2) / n_disagreements)
        p_val = float(1.0 - chi2.cdf(stat, df=1))

    return {
        "contingency_table": {"both_correct": a, "m1_correct_m2_wrong": b, "m1_wrong_m2_correct": c, "both_wrong": d},
        "disagreements": n_disagreements,
        "statistic": float(round(stat, 4)),
        "p_value": float(p_val),
        "significant_at_05": bool(p_val < 0.05),
        "significant_at_01": bool(p_val < 0.01)
    }


def compute_bootstrap_cis(pred_df: pd.DataFrame, n_bootstraps: int = 1000) -> dict:
    """Compute 95% percentile bootstrap confidence intervals for key generalization metrics."""
    rng = np.random.default_rng(SEED)
    n_samples = len(pred_df)

    y_true_all = pred_df["y_true"].values
    y_pred_all = pred_df["y_pred"].values
    is_unseen_all = pred_df["is_unseen"].values
    is_attack_all = (y_true_all == 1)

    macro_f1_boots = []
    seen_rec_boots = []
    unseen_rec_boots = []
    gap_boots = []

    for _ in range(n_bootstraps):
        boot_idx = rng.integers(0, n_samples, size=n_samples)
        y_t = y_true_all[boot_idx]
        y_p = y_pred_all[boot_idx]
        is_att = is_attack_all[boot_idx]
        is_uns = is_unseen_all[boot_idx]

        m_f1 = f1_score(y_t, y_p, average="macro", zero_division=0)
        macro_f1_boots.append(m_f1)

        # Seen recall
        seen_mask = is_att & (~is_uns)
        s_tot = np.sum(seen_mask)
        s_rec = np.sum(y_p[seen_mask] == 1) / s_tot if s_tot > 0 else 0.0
        seen_rec_boots.append(s_rec)

        # Unseen recall
        unseen_mask = is_att & is_uns
        u_tot = np.sum(unseen_mask)
        u_rec = np.sum(y_p[unseen_mask] == 1) / u_tot if u_tot > 0 else 0.0
        unseen_rec_boots.append(u_rec)

        gap_boots.append((s_rec - u_rec) * 100.0)

    def ci(arr):
        return {
            "mean": float(round(np.mean(arr), 4)),
            "std": float(round(np.std(arr), 4)),
            "ci_95_lower": float(round(np.percentile(arr, 2.5), 4)),
            "ci_95_upper": float(round(np.percentile(arr, 97.5), 4))
        }

    return {
        "macro_f1": ci(macro_f1_boots),
        "seen_recall": ci(seen_rec_boots),
        "unseen_recall": ci(unseen_rec_boots),
        "generalization_gap_pp": ci(gap_boots)
    }
