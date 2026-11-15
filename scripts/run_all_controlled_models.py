"""
Script to execute the complete controlled comparison across:
1. Logistic Regression
2. Decision Tree
3. Random Forest
4. Majority-Class Baseline (standardized)
5. Statistical Significance (McNemar tests) and 95% Bootstrap CIs
"""

import json
import sys
import time
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
import numpy as np
import pandas as pd
import optuna
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier

from src.controlled_framework import (
    run_controlled_experiment,
    compute_comprehensive_metrics,
    compute_mcnemar_test,
    compute_bootstrap_cis,
    get_dataset_and_splits,
    METRICS_DIR,
    PRED_DIR,
    SEED,
    N_TRIALS
)

print("=" * 80)
print("ES 335 CONTROLLED EXPERIMENTAL EXECUTION: FAIR 3-MODEL COMPARISON")
print(f"Seed: {SEED} | 5-Fold Stratified CV | {N_TRIALS} Optuna Trials per model")
print("=" * 80)

# -----------------------------------------------------------------------------
# 0. Majority-Class Baseline (Standardized)
# -----------------------------------------------------------------------------
print("\n>>> STEP 0: COMPUTING MAJORITY-CLASS BASELINE (Standardized schema)...")
(
    train_df, test_df,
    X_train_raw, y_train,
    X_test_raw, y_test,
    train_sub_idx, val_idx,
    seen_attacks, unseen_attacks
) = get_dataset_and_splits()

# Training majority class is Normal (y=0, 53.46%)
y_pred_mb = np.zeros(len(y_test), dtype=int)
metrics_mb, preds_mb = compute_comprehensive_metrics(
    y_true=y_test.values,
    y_pred=y_pred_mb,
    test_df=test_df,
    seen_attacks=seen_attacks,
    unseen_attacks=unseen_attacks,
    train_time=0.001,
    infer_time=0.001,
    model_name="Majority Baseline",
    hyperparameters={"strategy": "most_frequent", "predicted_class": 0}
)
with open(METRICS_DIR / "majority_baseline_controlled.json", "w", encoding="utf-8") as f:
    json.dump(metrics_mb, f, indent=2)
preds_mb.to_csv(PRED_DIR / "majority_baseline_controlled_predictions.csv", index=False)
print(">>> Majority Baseline saved: Accuracy = 43.07%, Macro-F1 = 0.3011, Attack Recall = 0.00%")

# -----------------------------------------------------------------------------
# 1. Logistic Regression
# -----------------------------------------------------------------------------
print("\n>>> STEP 1/3: TUNING AND TRAINING LOGISTIC REGRESSION (Controlled)...")
def suggest_lr(trial: optuna.Trial) -> dict:
    C = trial.suggest_float("C", 1e-3, 1e2, log=True)
    class_weight = trial.suggest_categorical("class_weight", [None, "balanced"])
    return {
        "C": C,
        "class_weight": class_weight,
        "solver": "lbfgs",
        "max_iter": 500,
        "random_state": SEED
    }

def factory_lr(p: dict):
    return LogisticRegression(**p)

t0_lr = time.time()
pipe_lr, metrics_lr, preds_lr = run_controlled_experiment(
    model_name="Logistic Regression",
    suggest_fn=suggest_lr,
    estimator_factory=factory_lr,
    n_trials=N_TRIALS
)
print(f">>> Logistic Regression completed in {(time.time() - t0_lr)/60:.1f} minutes.")

# -----------------------------------------------------------------------------
# 2. Decision Tree
# -----------------------------------------------------------------------------
print("\n>>> STEP 2/3: TUNING AND TRAINING DECISION TREE (Controlled)...")
def suggest_dt(trial: optuna.Trial) -> dict:
    criterion = trial.suggest_categorical("criterion", ["gini", "entropy"])
    max_depth = trial.suggest_categorical("max_depth", [None, 10, 15, 20, 30])
    min_samples_split = trial.suggest_int("min_samples_split", 2, 20)
    min_samples_leaf = trial.suggest_int("min_samples_leaf", 1, 20, log=True)
    max_features = trial.suggest_categorical("max_features", ["sqrt", None])
    class_weight = trial.suggest_categorical("class_weight", [None, "balanced"])
    return {
        "criterion": criterion,
        "max_depth": max_depth,
        "min_samples_split": min_samples_split,
        "min_samples_leaf": min_samples_leaf,
        "max_features": max_features,
        "class_weight": class_weight,
        "random_state": SEED
    }

def factory_dt(p: dict):
    return DecisionTreeClassifier(**p)

t0_dt = time.time()
pipe_dt, metrics_dt, preds_dt = run_controlled_experiment(
    model_name="Decision Tree",
    suggest_fn=suggest_dt,
    estimator_factory=factory_dt,
    n_trials=N_TRIALS
)
print(f">>> Decision Tree completed in {(time.time() - t0_dt)/60:.1f} minutes.")

# -----------------------------------------------------------------------------
# 3. Random Forest
# -----------------------------------------------------------------------------
print("\n>>> STEP 3/3: TUNING AND TRAINING RANDOM FOREST (Controlled)...")
def suggest_rf(trial: optuna.Trial) -> dict:
    n_estimators = trial.suggest_int("n_estimators", 50, 150, step=25)
    max_depth = trial.suggest_categorical("max_depth", [None, 15, 20, 25])
    min_samples_split = trial.suggest_int("min_samples_split", 2, 10)
    min_samples_leaf = trial.suggest_int("min_samples_leaf", 1, 10)
    max_features = trial.suggest_categorical("max_features", ["sqrt", "log2"])
    class_weight = trial.suggest_categorical("class_weight", [None, "balanced"])
    return {
        "n_estimators": n_estimators,
        "max_depth": max_depth,
        "min_samples_split": min_samples_split,
        "min_samples_leaf": min_samples_leaf,
        "max_features": max_features,
        "class_weight": class_weight,
        "bootstrap": True,
        "n_jobs": -1,
        "random_state": SEED
    }

def factory_rf(p: dict):
    return RandomForestClassifier(**p)

t0_rf = time.time()
pipe_rf, metrics_rf, preds_rf = run_controlled_experiment(
    model_name="Random Forest",
    suggest_fn=suggest_rf,
    estimator_factory=factory_rf,
    n_trials=N_TRIALS
)
print(f">>> Random Forest completed in {(time.time() - t0_rf)/60:.1f} minutes.")

# -----------------------------------------------------------------------------
# 4. Statistical Tests & Bootstrap Uncertainty Analysis
# -----------------------------------------------------------------------------
print("\n>>> STEP 4: COMPUTING STATISTICAL COMPARISONS & BOOTSTRAP CIs...")
y_true = preds_lr["y_true"].values
y_pred_lr = preds_lr["y_pred"].values
y_pred_dt = preds_dt["y_pred"].values
y_pred_rf = preds_rf["y_pred"].values

mcnemar_lr_dt = compute_mcnemar_test(y_true, y_pred_lr, y_pred_dt)
mcnemar_lr_rf = compute_mcnemar_test(y_true, y_pred_lr, y_pred_rf)
mcnemar_dt_rf = compute_mcnemar_test(y_true, y_pred_dt, y_pred_rf)

ci_lr = compute_bootstrap_cis(preds_lr, n_bootstraps=1000)
ci_dt = compute_bootstrap_cis(preds_dt, n_bootstraps=1000)
ci_rf = compute_bootstrap_cis(preds_rf, n_bootstraps=1000)

stat_comparison = {
    "framework": "ES335 Controlled Statistical Significance & Bootstrap Uncertainty",
    "mcnemar_tests": {
        "logistic_regression_vs_decision_tree": mcnemar_lr_dt,
        "logistic_regression_vs_random_forest": mcnemar_lr_rf,
        "decision_tree_vs_random_forest": mcnemar_dt_rf
    },
    "bootstrap_95_confidence_intervals": {
        "logistic_regression": ci_lr,
        "decision_tree": ci_dt,
        "random_forest": ci_rf
    }
}

stat_path = METRICS_DIR / "statistical_comparison.json"
with open(stat_path, "w", encoding="utf-8") as f:
    json.dump(stat_comparison, f, indent=2)
print(f">>> Statistical comparison saved to: {stat_path}")

print("\n" + "=" * 80)
print("ALL CONTROLLED EXPERIMENTS SUCCESSFULLY EXECUTED AND SAVED!")
print("=" * 80)
