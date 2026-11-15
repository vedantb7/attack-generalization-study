"""
plots.py
--------
Shared diagnostic plots so every model notebook shows the same views.
Each function returns the matplotlib Figure (notebooks log it to MLflow).
"""

from __future__ import annotations

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import (ConfusionMatrixDisplay, auc, average_precision_score, f1_score,
                             precision_recall_curve, roc_curve)

from src.evaluation import THRESHOLD_GRID

KEY_METRICS = ["accuracy", "precision", "recall", "f1", "f1_macro", "roc_auc", "pr_auc"]


def metric_bars(metrics: dict, title: str):
    """Train / validation / test metrics at the chosen threshold."""
    df = pd.DataFrame({s: {k: metrics[s][k] for k in KEY_METRICS} for s in ["train", "val", "test"]})
    fig, ax = plt.subplots(figsize=(11, 4))
    df.plot(kind="bar", ax=ax, color=["#4C72B0", "#55A868", "#C44E52"], rot=0, width=.8)
    ax.set_ylim(max(0, df.values.min() - .1), 1.0)
    ax.set_title(title)
    for cont in ax.containers:
        ax.bar_label(cont, fmt="%.3f", fontsize=7, rotation=90, padding=2)
    ax.legend(loc="lower left")
    fig.tight_layout()
    return fig


def confusion_and_curves(y_va, p_va, y_te, p_te, threshold: float, name: str):
    """Test confusion matrix + ROC + PR (validation and test) + threshold curve."""
    fig, axes = plt.subplots(1, 4, figsize=(21, 4.6))
    ConfusionMatrixDisplay.from_predictions(y_te, (p_te >= threshold).astype(int), display_labels=["normal", "attack"],
                                            cmap="Blues", values_format=",", ax=axes[0], colorbar=False)
    axes[0].set_title(f"{name}: test confusion (t={threshold:.2f})")
    for y, p, lab, col in [(y_va, p_va, "val", "#55A868"), (y_te, p_te, "test", "#C44E52")]:
        fpr, tpr, _ = roc_curve(y, p)
        axes[1].plot(fpr, tpr, c=col, label=f"{lab} AUC={auc(fpr, tpr):.3f}")
        pr, rc, _ = precision_recall_curve(y, p)
        axes[2].plot(rc, pr, c=col, label=f"{lab} AP={average_precision_score(y, p):.3f}")
    axes[1].plot([0, 1], [0, 1], "k--", lw=.8); axes[1].set(xlabel="FPR", ylabel="TPR (recall)", title="ROC")
    axes[2].set(xlabel="recall", ylabel="precision", title="Precision–Recall")
    axes[1].legend(loc="lower right"); axes[2].legend(loc="lower left")
    f_va = [f1_score(y_va, (p_va >= t).astype(int), average="macro") for t in THRESHOLD_GRID]
    f_te = [f1_score(y_te, (p_te >= t).astype(int), average="macro") for t in THRESHOLD_GRID]
    axes[3].plot(THRESHOLD_GRID, f_va, c="#55A868", label="val (used to choose)")
    axes[3].plot(THRESHOLD_GRID, f_te, c="#C44E52", ls="--", label="test (shown only, not used)")
    axes[3].axvline(threshold, c="k", lw=1); axes[3].set(xlabel="threshold", ylabel="macro-F1", title="Threshold curve")
    axes[3].legend(loc="lower center")
    fig.tight_layout()
    return fig


def error_analysis(preds: pd.DataFrame, test_df: pd.DataFrame, name: str):
    """Recall by attack category / novelty / difficulty and false-positive hot spots."""
    fig, axes = plt.subplots(1, 4, figsize=(21, 4.4), gridspec_kw={"width_ratios": [1.2, .7, 1.4, 1.3]})
    att = preds[preds.y_true == 1]
    rc = att.groupby("attack_category")["y_pred"].agg(["mean", "size"])
    axes[0].bar(rc.index, rc["mean"], color="#DD8452")
    for i, (m, n) in enumerate(zip(rc["mean"], rc["size"])):
        axes[0].text(i, m + .02, f"{m:.2f}\nn={n}", ha="center", fontsize=8)
    axes[0].set_ylim(0, 1.2); axes[0].set_title("Test recall by attack category")
    nv = att.groupby("is_novel")["y_pred"].mean().rename({0: "known", 1: "novel"})
    axes[1].bar(nv.index, nv.values, color=["#4C72B0", "#C44E52"]); axes[1].set_ylim(0, 1.05)
    axes[1].set_title("Recall: known vs novel")
    for i, v in enumerate(nv.values): axes[1].text(i, v + .02, f"{v:.2f}", ha="center")
    bins = pd.cut(preds["difficulty_level"], [-1, 10, 15, 18, 21], labels=["0-10", "11-15", "16-18", "19-21"])
    err = (preds["y_pred"] != preds["y_true"]).groupby(bins, observed=True).mean()
    fnr = att.groupby(bins[att.index], observed=True)["y_pred"].apply(lambda s: 1 - s.mean())
    pd.DataFrame({"error rate": err, "FNR (attacks)": fnr}).plot(kind="bar", ax=axes[2], rot=0, color=["#8C8C8C", "#C44E52"])
    axes[2].set_title("Errors by difficulty_level (evaluation slice only)")
    fp = preds[(preds.y_true == 0) & (preds.y_pred == 1)]
    top_fp = test_df.loc[fp.row_id, "service"].value_counts().head(10)
    axes[3].barh(top_fp.index[::-1], top_fp.values[::-1], color="#4C72B0")
    axes[3].set_title(f"False positives by service (total FP={len(fp):,})")
    fig.suptitle(f"{name}: error analysis on KDDTest+", y=1.03)
    fig.tight_layout()
    return fig


def missed_attack_types(preds: pd.DataFrame, top: int = 15):
    """Attack types with the most false negatives (red = novel)."""
    fn = preds[(preds.y_true == 1)].groupby("label").agg(missed=("y_pred", lambda s: int((s == 0).sum())),
                                                         total=("y_pred", "size"), novel=("is_novel", "max"))
    fn = fn.sort_values("missed", ascending=False).head(top)
    fig, ax = plt.subplots(figsize=(11, 4))
    ax.bar(fn.index, fn["missed"], color=np.where(fn["novel"] == 1, "#C44E52", "#4C72B0"))
    for i, (m, t) in enumerate(zip(fn["missed"], fn["total"])):
        ax.text(i, m, f"{m}/{t}", ha="center", va="bottom", fontsize=8)
    ax.set_title("Missed attacks (false negatives) by attack type — red = novel in test")
    ax.tick_params(axis="x", rotation=60)
    fig.tight_layout()
    return fig


def optuna_overview(study, param_x: str, hue: str | None = None):
    """Optimization history + objective vs a key hyperparameter."""
    df = study.trials_dataframe()
    fig, axes = plt.subplots(1, 2, figsize=(14, 4))
    axes[0].plot(df["number"], df["value"], "o", alpha=.6, label="trial")
    axes[0].plot(df["number"], df["value"].cummax(), "r-", label="best so far")
    axes[0].set(xlabel="trial", ylabel="CV macro-F1", title="Optuna optimization history"); axes[0].legend()
    lo = df["value"].quantile(.1)
    axes[0].set_ylim(lo - .005, df["value"].max() + .003)
    col = f"params_{param_x}"
    if hue and f"params_{hue}" in df:
        sns.scatterplot(data=df, x=col, y="value", hue=f"params_{hue}", ax=axes[1])
    else:
        axes[1].scatter(df[col], df["value"])
    if df[col].dtype.kind == "f" and df[col].min() > 0 and df[col].max() / df[col].min() > 50:
        axes[1].set_xscale("log")
    axes[1].set_ylim(lo - .005, df["value"].max() + .003)
    axes[1].set(xlabel=param_x, ylabel="CV macro-F1", title=f"Objective vs {param_x}")
    fig.tight_layout()
    return fig
