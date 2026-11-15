"""
evaluation.py
-------------
Unified metrics, threshold selection and result persistence for every model.

All models are scored by the same functions on the same rows, so the
centralized comparison notebook (07) only reads the files written here.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, Optional

import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score, average_precision_score, confusion_matrix, f1_score,
    matthews_corrcoef, precision_score, recall_score, roc_auc_score,
)

from src.data_loader import PROJECT_ROOT

RESULTS_DIR = PROJECT_ROOT / "results"
METRICS_DIR = RESULTS_DIR / "metrics"
PRED_DIR = RESULTS_DIR / "predictions"
THRESHOLD_GRID = np.round(np.arange(0.05, 0.951, 0.01), 2)


def compute_metrics(y_true, y_prob, threshold: float = 0.5) -> Dict[str, float]:
    """Binary metrics with attack (1) as the positive class.

    Threshold-free metrics (ROC-AUC, PR-AUC) use ``y_prob``; the rest use
    ``y_prob >= threshold``. FPR = normal traffic flagged as attack;
    FNR = attacks missed.
    """
    y_true = np.asarray(y_true).astype(int)
    y_prob = np.asarray(y_prob, dtype=float)
    y_pred = (y_prob >= threshold).astype(int)
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred, labels=[0, 1]).ravel()
    one_class_scores = len(np.unique(y_prob)) > 1
    return {
        "threshold": float(threshold),
        "accuracy": accuracy_score(y_true, y_pred),
        "precision": precision_score(y_true, y_pred, zero_division=0),
        "recall": recall_score(y_true, y_pred, zero_division=0),
        "f1": f1_score(y_true, y_pred, zero_division=0),
        "f1_macro": f1_score(y_true, y_pred, average="macro", zero_division=0),
        "f1_weighted": f1_score(y_true, y_pred, average="weighted", zero_division=0),
        "mcc": matthews_corrcoef(y_true, y_pred),
        "roc_auc": roc_auc_score(y_true, y_prob) if one_class_scores else 0.5,
        "pr_auc": average_precision_score(y_true, y_prob),
        "fpr": fp / (fp + tn) if (fp + tn) else 0.0,
        "fnr": fn / (fn + tp) if (fn + tp) else 0.0,
        "tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp),
    }


def best_threshold(y_true, y_prob, metric: str = "f1_macro") -> float:
    """Threshold on THRESHOLD_GRID maximising ``metric`` (validation data only)."""
    y_true = np.asarray(y_true).astype(int)
    scores = [f1_score(y_true, (y_prob >= t).astype(int), average="macro" if metric == "f1_macro" else "binary",
                       zero_division=0) for t in THRESHOLD_GRID]
    return float(THRESHOLD_GRID[int(np.argmax(scores))])


def slice_recall(df: pd.DataFrame, group_col: str) -> pd.Series:
    """Attack recall (share predicted attack) per group, over attack rows only."""
    attacks = df[df["y_true"] == 1]
    return attacks.groupby(group_col, observed=True)["y_pred"].mean()


def save_predictions(model_name: str, test_df: pd.DataFrame, y_prob, threshold: float,
                     novel_labels: Optional[set] = None) -> Path:
    """Write the unified test-prediction CSV used by notebook 07."""
    PRED_DIR.mkdir(parents=True, exist_ok=True)
    out = pd.DataFrame({
        "row_id": np.arange(len(test_df)),
        "y_true": test_df["is_intrusion"].to_numpy(),
        "y_prob": np.asarray(y_prob, dtype=float),
        "y_pred": (np.asarray(y_prob) >= threshold).astype(int),
        "label": test_df["label"].to_numpy(),
        "attack_category": test_df["attack_category"].to_numpy(),
        "difficulty_level": test_df["difficulty_level"].to_numpy(),
    })
    if novel_labels is not None:
        out["is_novel"] = out["label"].isin(novel_labels).astype(int)
    path = PRED_DIR / f"{model_name}_test_predictions.csv"
    out.to_csv(path, index=False)
    return path


def save_metrics_json(model_name: str, payload: dict) -> Path:
    """Write ``results/metrics/{model_name}.json`` (unified schema)."""
    METRICS_DIR.mkdir(parents=True, exist_ok=True)
    path = METRICS_DIR / f"{model_name}.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, default=_json_default)
    return path


def _json_default(o):
    if isinstance(o, (np.integer,)):
        return int(o)
    if isinstance(o, (np.floating,)):
        return float(o)
    if isinstance(o, np.ndarray):
        return o.tolist()
    return str(o)
