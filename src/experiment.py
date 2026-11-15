"""
experiment.py
-------------
Shared experiment harness: reproducibility, data splits, Optuna tuning,
MLflow tracking and artifact management for every model notebook.

Workflow used by notebooks 03-06 (identical for every model):

1. ``load_data()``         KDDTrain+/KDDTest+ (headered copies in dataset/).
2. ``get_splits()``        Stratified 80/20 train_sub/val split of KDDTrain+,
                           saved as row indices and reused by all notebooks.
3. ``start_run()``         One MLflow parent run per model.
4. ``tune()``              Optuna TPE search, objective = stratified 5-fold CV
                           macro-F1 on train_sub (preprocessing refit per fold).
                           Every trial is a nested MLflow run.
5. ``fit_and_evaluate()``  Fit on train_sub -> train/val metrics and the
                           decision threshold (val only); refit on all of
                           KDDTrain+ -> score KDDTest+ once; save predictions,
                           metrics, artifacts; log everything to MLflow.

The test set is never used for tuning, selection or threshold choice.
"""

from __future__ import annotations

import hashlib
import json
import os
import platform
import shutil
import subprocess
import time
import warnings
from datetime import datetime
from pathlib import Path
from typing import Callable, Dict, Optional

import joblib
import numpy as np
import pandas as pd

from src.config import load_config, set_all_seeds
from src.data_loader import FEATURE_COLUMNS, PROJECT_ROOT, load_nsl_kdd
from src.evaluation import (
    best_threshold, compute_metrics, save_metrics_json, save_predictions,
)

CFG = load_config()
SEED: int = int(CFG["seed"])
MODELS_DIR = PROJECT_ROOT / CFG["artifacts"]["models_dir"]
SCALARS_DIR = PROJECT_ROOT / CFG["artifacts"]["scalars_dir"]
SPLIT_DIR = PROJECT_ROOT / "results" / "splits"
TUNING_DIR = PROJECT_ROOT / "results" / "tuning"
FIG_DIR = PROJECT_ROOT / "results" / "figures"
TRAIN_PATH = PROJECT_ROOT / "dataset" / "KDDTrain+.csv"
TEST_PATH = PROJECT_ROOT / "dataset" / "KDDTest+.csv"


# --------------------------------------------------------------------------
# Reproducibility and environment
# --------------------------------------------------------------------------
def init(seed: int = SEED) -> np.random.Generator:
    """Seed everything and silence noisy, non-actionable warnings."""
    os.environ.setdefault("MLFLOW_DISABLE_AGENT_HINT", "1")
    warnings.filterwarnings("ignore", category=FutureWarning)
    warnings.filterwarnings("ignore", message=".*Filesystem tracking backend.*")
    import optuna
    optuna.logging.set_verbosity(optuna.logging.WARNING)
    return set_all_seeds(seed)


def library_versions() -> Dict[str, str]:
    import mlflow, optuna, sklearn
    return {"python": platform.python_version(), "numpy": np.__version__, "pandas": pd.__version__,
            "scikit-learn": sklearn.__version__, "optuna": optuna.__version__, "mlflow": mlflow.__version__,
            "joblib": joblib.__version__}


def git_sha() -> str:
    try:
        return subprocess.check_output(["git", "rev-parse", "--short", "HEAD"], cwd=PROJECT_ROOT,
                                       text=True, stderr=subprocess.DEVNULL).strip()
    except Exception:
        return "unknown"


def file_sha256(path: Path) -> str:
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def data_hashes() -> Dict[str, str]:
    return {"KDDTrain+.csv": file_sha256(TRAIN_PATH), "KDDTest+.csv": file_sha256(TEST_PATH)}


# --------------------------------------------------------------------------
# Data and splits
# --------------------------------------------------------------------------
def load_data():
    """Return (train_df, test_df, novel_labels)."""
    train, test = load_nsl_kdd(TRAIN_PATH, TEST_PATH)
    novel = set(test["label"]) - set(train["label"])
    return train, test, novel


def get_splits(train: pd.DataFrame, seed: int = SEED):
    """Stratified 80/20 train_sub/val row indices of KDDTrain+ (cached on disk).

    Same parameters as the original RF notebook (test_size=0.2,
    stratify=is_intrusion, random_state=42), saved so every notebook uses
    identical rows.
    """
    from sklearn.model_selection import train_test_split
    SPLIT_DIR.mkdir(parents=True, exist_ok=True)
    tr_path, va_path = SPLIT_DIR / "train_sub_idx.npy", SPLIT_DIR / "val_idx.npy"
    if tr_path.exists() and va_path.exists():
        idx_tr, idx_va = np.load(tr_path), np.load(va_path)
        if len(idx_tr) + len(idx_va) == len(train):
            return idx_tr, idx_va
    idx_tr, idx_va = train_test_split(np.arange(len(train)), test_size=CFG["split"]["val_size"],
                                      stratify=train["is_intrusion"], random_state=seed)
    np.save(tr_path, np.sort(idx_tr)), np.save(va_path, np.sort(idx_va))
    return np.sort(idx_tr), np.sort(idx_va)


def xy(df: pd.DataFrame):
    """41 raw features and binary target."""
    return df[FEATURE_COLUMNS], df["is_intrusion"].to_numpy()


def cv_splitter(seed: int = SEED):
    from sklearn.model_selection import StratifiedKFold
    return StratifiedKFold(n_splits=CFG["cv"]["n_splits"], shuffle=True, random_state=seed)


def n_trials() -> int:
    t = CFG["tuning"]
    return int(t["quick_mode_trials"] if t.get("quick_mode", True) else t["n_trials"])


# --------------------------------------------------------------------------
# MLflow
# --------------------------------------------------------------------------
def setup_mlflow():
    import mlflow
    (PROJECT_ROOT / "mlruns").mkdir(exist_ok=True)
    mlflow.set_tracking_uri(CFG["mlflow"]["tracking_uri"].replace("{root}", str(PROJECT_ROOT)))
    exp = mlflow.get_experiment_by_name(CFG["mlflow"]["experiment"])
    if exp is None:
        mlflow.create_experiment(CFG["mlflow"]["experiment"],
                                 artifact_location=(PROJECT_ROOT / "mlruns" / "artifacts").as_uri())
    mlflow.set_experiment(CFG["mlflow"]["experiment"])
    return mlflow


def start_run(model_name: str, prep_settings: dict) -> str:
    """Create the parent MLflow run for a model; returns its run_id."""
    mlflow = setup_mlflow()
    with mlflow.start_run(run_name=model_name) as run:
        mlflow.set_tags({"model": model_name, "seed": SEED, "git_sha": git_sha(),
                         "started": datetime.now().isoformat(timespec="seconds")})
        mlflow.log_params({f"prep__{k}": v for k, v in prep_settings.items()})
        mlflow.log_params({"seed": SEED, "cv_folds": CFG["cv"]["n_splits"], "val_size": CFG["split"]["val_size"]})
        mlflow.log_dict(library_versions(), "environment/library_versions.json")
        mlflow.log_dict(data_hashes(), "environment/data_sha256.json")
        mlflow.log_dict(CFG, "environment/config.json")
        return run.info.run_id


def log_figure(run_id: str, fig, name: str, model_name: str):
    """Save a figure under results/figures/{model}/ and attach it to the MLflow run."""
    mlflow = setup_mlflow()
    out = FIG_DIR / model_name
    out.mkdir(parents=True, exist_ok=True)
    fig.savefig(out / f"{name}.png", dpi=110, bbox_inches="tight")
    with mlflow.start_run(run_id=run_id):
        mlflow.log_figure(fig, f"figures/{name}.png")


# --------------------------------------------------------------------------
# Optuna
# --------------------------------------------------------------------------
def tune(model_name: str, run_id: str, make_pipeline: Callable[[dict], object],
         suggest: Callable, X, y, trials: Optional[int] = None, cv_jobs: int = 5):
    """Optuna TPE search maximising stratified-CV macro-F1 on (X, y).

    ``suggest(trial) -> params``; ``make_pipeline(params) -> unfitted Pipeline``.
    The whole pipeline (incl. preprocessing) is refit inside every fold.
    """
    import optuna
    from sklearn.model_selection import cross_val_score
    mlflow = setup_mlflow()
    trials = trials or n_trials()
    sampler = optuna.samplers.TPESampler(seed=SEED, n_startup_trials=min(CFG["tuning"]["n_startup_trials"],
                                                                         max(trials // 3, 1)))
    study = optuna.create_study(direction="maximize", sampler=sampler, study_name=model_name)

    def objective(trial):
        params = suggest(trial)
        t0 = time.perf_counter()
        scores = cross_val_score(make_pipeline(params), X, y, cv=cv_splitter(), scoring="f1_macro", n_jobs=cv_jobs)
        trial.set_user_attr("cv_std", float(scores.std()))
        trial.set_user_attr("seconds", time.perf_counter() - t0)
        with mlflow.start_run(run_name=f"{model_name}_trial_{trial.number:03d}", nested=True):
            mlflow.log_params(params)
            mlflow.log_metrics({"cv_f1_macro": float(scores.mean()), "cv_f1_macro_std": float(scores.std())})
        return float(scores.mean())

    with mlflow.start_run(run_id=run_id):
        study.optimize(objective, n_trials=trials, show_progress_bar=False)
        TUNING_DIR.mkdir(parents=True, exist_ok=True)
        df = study.trials_dataframe()
        df.to_csv(TUNING_DIR / f"{model_name}_trials.csv", index=False)
        best = {"best_params": study.best_params, "best_cv_f1_macro": study.best_value,
                "best_trial": study.best_trial.number, "n_trials": trials, "sampler_seed": SEED}
        with open(TUNING_DIR / f"{model_name}_best.json", "w") as f:
            json.dump(best, f, indent=2)
        mlflow.log_params({f"best__{k}": v for k, v in study.best_params.items()})
        mlflow.log_metric("best_cv_f1_macro", study.best_value)
        mlflow.log_artifact(str(TUNING_DIR / f"{model_name}_trials.csv"), "optuna")
    return study


# --------------------------------------------------------------------------
# Fit, evaluate, persist
# --------------------------------------------------------------------------
def _predict_proba(pipe, X) -> np.ndarray:
    return pipe.predict_proba(X)[:, 1]


def fit_and_evaluate(model_name: str, run_id: str, make_pipeline: Callable[[dict], object], params: dict,
                     train: pd.DataFrame, test: pd.DataFrame, idx_tr, idx_va, novel: set,
                     tune_threshold: bool = True, extra: Optional[dict] = None,
                     export_onnx: bool = True) -> dict:
    """Train/val diagnostics, val-based threshold, final refit, single test evaluation."""
    mlflow = setup_mlflow()
    X_all, y_all = xy(train)
    X_tr, y_tr, X_va, y_va = X_all.iloc[idx_tr], y_all[idx_tr], X_all.iloc[idx_va], y_all[idx_va]
    X_te, y_te = xy(test)

    # 1) development fit on train_sub -> train / validation metrics and threshold
    dev = make_pipeline(params)
    t0 = time.perf_counter(); dev.fit(X_tr, y_tr); dev_fit_s = time.perf_counter() - t0
    p_tr, p_va = _predict_proba(dev, X_tr), _predict_proba(dev, X_va)
    threshold = best_threshold(y_va, p_va) if tune_threshold else 0.5

    # 2) final fit on all of KDDTrain+ with frozen params and threshold
    final = make_pipeline(params)
    t0 = time.perf_counter(); final.fit(X_all, y_all); fit_s = time.perf_counter() - t0
    _predict_proba(final, X_te.iloc[:100])  # warm-up
    times = []
    for _ in range(3):
        t0 = time.perf_counter(); p_te = _predict_proba(final, X_te); times.append(time.perf_counter() - t0)
    infer_s = float(np.median(times))

    metrics = {
        "train": compute_metrics(y_tr, p_tr, threshold),
        "val": compute_metrics(y_va, p_va, threshold),
        "val_at_0.5": compute_metrics(y_va, p_va, 0.5),
        "test": compute_metrics(y_te, p_te, threshold),
        "test_at_0.5": compute_metrics(y_te, p_te, 0.5),
    }
    pred_path = save_predictions(model_name, test, p_te, threshold, novel)
    preds = pd.read_csv(pred_path)
    attacks = preds[preds.y_true == 1]
    slices = {
        "recall_by_category": attacks.groupby("attack_category")["y_pred"].mean().to_dict(),
        "recall_novel": float(attacks.loc[attacks.is_novel == 1, "y_pred"].mean()),
        "recall_known": float(attacks.loc[attacks.is_novel == 0, "y_pred"].mean()),
    }
    artifacts = save_artifacts(model_name, final, params, threshold, export_onnx=export_onnx, X_sample=X_te)
    payload = {
        "model": model_name, "params": params, "threshold": threshold,
        "threshold_source": "validation (max macro-F1)" if tune_threshold else "fixed 0.5",
        "metrics": metrics, "slices": slices,
        "timing": {"dev_fit_seconds": dev_fit_s, "final_fit_seconds": fit_s,
                   "test_inference_seconds": infer_s,
                   "inference_us_per_row": infer_s / len(X_te) * 1e6},
        "complexity": model_complexity(final),
        "n_rows": {"train_sub": len(idx_tr), "val": len(idx_va), "train_full": len(train), "test": len(test)},
        "artifacts": artifacts, "seed": SEED, "git_sha": git_sha(),
        "library_versions": library_versions(), "data_sha256": data_hashes(),
        "created": datetime.now().isoformat(timespec="seconds"),
    }
    if extra:
        payload.update(extra)
    metrics_path = save_metrics_json(model_name, payload)

    with mlflow.start_run(run_id=run_id):
        mlflow.log_params({f"final__{k}": v for k, v in params.items()})
        mlflow.log_param("threshold", threshold)
        for split in ["train", "val", "test"]:
            mlflow.log_metrics({f"{split}_{k}": float(v) for k, v in metrics[split].items()
                                if isinstance(v, (int, float, np.floating))})
        mlflow.log_metrics({"final_fit_seconds": fit_s, "test_inference_seconds": infer_s,
                            "test_recall_novel": slices["recall_novel"]})
        mlflow.log_artifact(str(metrics_path), "results")
        mlflow.log_artifact(str(pred_path), "results")
        for p in artifacts.values():
            if p and Path(PROJECT_ROOT / p).exists() and Path(PROJECT_ROOT / p).stat().st_size < 200 * 2**20:
                mlflow.log_artifact(str(PROJECT_ROOT / p), "model_files")

    return {"dev": dev, "final": final, "threshold": threshold, "metrics": metrics, "slices": slices,
            "p_tr": p_tr, "p_va": p_va, "p_te": p_te, "y_tr": y_tr, "y_va": y_va, "y_te": y_te,
            "preds": preds, "payload": payload}


def model_complexity(pipe) -> dict:
    est = pipe[-1] if hasattr(pipe, "steps") else pipe
    out = {"n_features_in": int(getattr(est, "n_features_in_", 0))}
    if hasattr(est, "coef_"):
        out["nonzero_coefficients"] = int(np.count_nonzero(est.coef_))
    if hasattr(est, "tree_"):
        out.update(depth=int(est.get_depth()), leaves=int(est.get_n_leaves()))
    if hasattr(est, "estimators_"):
        out.update(n_trees=len(est.estimators_),
                   total_leaves=int(sum(t.get_n_leaves() for t in est.estimators_)),
                   max_depth=int(max(t.get_depth() for t in est.estimators_)))
    return out


def _archive_existing(path: Path):
    """Move an existing artifact to models|scalars/archive/ instead of overwriting it."""
    if path.exists():
        arch = path.parent / "archive"
        arch.mkdir(exist_ok=True)
        stamp = datetime.fromtimestamp(path.stat().st_mtime).strftime("%Y%m%d-%H%M%S")
        shutil.move(str(path), str(arch / f"{path.stem}_{stamp}{path.suffix}"))


def save_artifacts(model_name: str, pipe, params: dict, threshold: float,
                   export_onnx: bool = True, X_sample: Optional[pd.DataFrame] = None) -> Dict[str, str]:
    """Persist the fitted pipeline (models/) and its preprocessing (scalars/).

    - models/{name}_pipeline.joblib     full pipeline: raw 41 features -> probability
    - models/{name}_metadata.json       params, threshold, versions, hashes
    - models/{name}_estimator.onnx      estimator only, on preprocessed float32 input
    - scalars/{name}_preprocessor.joblib fitted preprocessing (cleaning, filter, encoders, scalers)
    - scalars/{name}_feature_names.json  preprocessed column names + dropped columns
    - scalars/label_mapping.json         binary label mapping
    Existing files are archived (never silently overwritten).
    """
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    SCALARS_DIR.mkdir(parents=True, exist_ok=True)
    rel = lambda p: str(Path(p).relative_to(PROJECT_ROOT))
    out: Dict[str, str] = {}

    pipe_path = MODELS_DIR / f"{model_name}_pipeline.joblib"
    _archive_existing(pipe_path)
    joblib.dump(pipe, pipe_path, compress=3)
    out["pipeline"] = rel(pipe_path)

    has_prep = hasattr(pipe, "steps") and len(pipe.steps) > 1
    if has_prep:
        prep = pipe[:-1]
        prep_path = SCALARS_DIR / f"{model_name}_preprocessor.joblib"
        _archive_existing(prep_path)
        joblib.dump(prep, prep_path, compress=3)
        out["preprocessor"] = rel(prep_path)
        names = {"feature_names_out": list(map(str, prep.get_feature_names_out())),
                 "raw_input_features": FEATURE_COLUMNS,
                 "dropped_constant": ["num_outbound_cmds"],
                 "dropped_correlated": list(getattr(pipe.named_steps["prep"].named_steps["corr"], "dropped_", []))}
        fn_path = SCALARS_DIR / f"{model_name}_feature_names.json"
        fn_path.write_text(json.dumps(names, indent=2))
        out["feature_names"] = rel(fn_path)

    lm_path = SCALARS_DIR / "label_mapping.json"
    lm_path.write_text(json.dumps({"0": "normal", "1": "attack (any non-normal class)",
                                   "positive_class": 1, "source_column": "class/label"}, indent=2))
    out["label_mapping"] = rel(lm_path)

    if export_onnx and has_prep and X_sample is not None:
        out.update(export_estimator_onnx(model_name, pipe, X_sample))

    meta = {"model": model_name, "params": params, "threshold": threshold, "seed": SEED,
            "git_sha": git_sha(), "library_versions": library_versions(), "data_sha256": data_hashes(),
            "files": out, "created": datetime.now().isoformat(timespec="seconds"),
            "usage": "joblib.load(pipeline).predict_proba(df[41 raw features])[:, 1] >= threshold"}
    meta_path = MODELS_DIR / f"{model_name}_metadata.json"
    meta_path.write_text(json.dumps(meta, indent=2, default=str))
    out["metadata"] = rel(meta_path)
    return out


def export_estimator_onnx(model_name: str, pipe, X_sample: pd.DataFrame) -> Dict[str, str]:
    """Export the final estimator to ONNX and check parity with scikit-learn.

    Custom pandas transformers (cleaning, correlation filter) are not ONNX
    convertible, so the ONNX graph takes the *preprocessed* float32 matrix
    (``scalars/{name}_preprocessor.joblib`` output). Returns {} on failure.
    """
    try:
        import onnxruntime as ort
        from skl2onnx import convert_sklearn
        from skl2onnx.common.data_types import FloatTensorType
    except ImportError:
        return {"onnx_status": "skipped: skl2onnx/onnxruntime not installed"}
    est = pipe[-1]
    Xp = np.asarray(pipe[:-1].transform(X_sample), dtype=np.float32)
    try:
        onx = convert_sklearn(est, initial_types=[("input", FloatTensorType([None, Xp.shape[1]]))],
                              options={id(est): {"zipmap": False}}, target_opset=17)
    except Exception as e:  # pragma: no cover - converter coverage differs by estimator
        return {"onnx_status": f"skipped: {type(e).__name__}: {e}"[:200]}
    path = MODELS_DIR / f"{model_name}_estimator.onnx"
    _archive_existing(path)
    path.write_bytes(onx.SerializeToString())
    sess = ort.InferenceSession(str(path), providers=["CPUExecutionProvider"])
    outputs = sess.run(None, {"input": Xp})
    p_onnx = np.asarray(outputs[1])[:, 1]
    p_skl = est.predict_proba(Xp.astype(np.float64))[:, 1]
    parity = {"max_abs_prob_diff": float(np.max(np.abs(p_onnx - p_skl))),
              "label_agreement": float(np.mean((p_onnx >= 0.5) == (p_skl >= 0.5)))}
    (MODELS_DIR / f"{model_name}_onnx_parity.json").write_text(json.dumps(parity, indent=2))
    return {"onnx": str(path.relative_to(PROJECT_ROOT)),
            "onnx_status": f"ok (max |dp|={parity['max_abs_prob_diff']:.2e}, agreement={parity['label_agreement']:.5f})"}
