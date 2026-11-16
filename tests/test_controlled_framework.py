"""Tests for src/controlled_framework.py (metrics, statistics, tuning/refit path)."""

import numpy as np
import pandas as pd
import pytest
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier

from src import controlled_framework as cf


# ---------------------------------------------------------------------------
# Metrics
# ---------------------------------------------------------------------------
def _toy_test_df():
    # 4 normal, 6 attacks: 3 seen (neptune), 3 unseen (apache2 x2, mscan x1)
    labels = ["normal"] * 4 + ["neptune"] * 3 + ["apache2", "apache2", "mscan"]
    cats = ["Normal"] * 4 + ["DoS"] * 3 + ["DoS", "DoS", "Probe"]
    return pd.DataFrame({"label": labels, "attack_category": cats})


def test_metrics_hand_values():
    df = _toy_test_df()
    y_true = np.array([0, 0, 0, 0, 1, 1, 1, 1, 1, 1])
    y_pred = np.array([0, 0, 0, 1, 1, 1, 0, 1, 0, 0])
    m, preds = cf.compute_comprehensive_metrics(y_true, y_pred, df, ["apache2", "mscan"], "toy", {})
    o = m["overall_metrics"]
    assert o["confusion_matrix"] == [[3, 1], [3, 3]]
    assert o["accuracy"] == pytest.approx(0.6)
    assert o["false_positive_rate"] == pytest.approx(0.25)
    assert o["attack_recall"] == pytest.approx(0.5)
    s = m["seen_vs_unseen_recall"]
    assert (s["seen_total"], s["seen_detected"], s["unseen_total"], s["unseen_detected"]) == (3, 2, 3, 1)
    assert s["generalization_drop_percentage_points"] == pytest.approx((0.6667 - 0.3333) * 100, abs=0.01)
    assert m["attack_category_recall"]["DoS"] == {"total_samples": 5, "detected": 3, "missed": 2, "recall": 0.6}
    assert m["attack_category_recall"]["Probe"]["recall"] == 0.0
    assert m["per_unseen_attack_recall"]["apache2"]["detected"] == 1
    assert m["per_unseen_attack_recall"]["mscan"]["category"] == "Probe"
    assert preds["is_unseen"].sum() == 3


# ---------------------------------------------------------------------------
# Statistics
# ---------------------------------------------------------------------------
def test_mcnemar_hand_values():
    y = np.zeros(30, dtype=int)
    p1 = np.zeros(30, dtype=int)
    p2 = np.zeros(30, dtype=int)
    p2[:10] = 1          # b = 10 (m1 right, m2 wrong)
    p1[10:12] = 1        # c = 2  (m1 wrong, m2 right)
    r = cf.compute_mcnemar_test(y, p1, p2)
    assert r["contingency_table"]["m1_correct_m2_wrong"] == 10
    assert r["contingency_table"]["m1_wrong_m2_correct"] == 2
    assert r["statistic"] == pytest.approx((abs(10 - 2) - 1) ** 2 / 12, abs=1e-4)
    assert 0.01 < r["p_value"] < 0.05
    assert cf.compute_mcnemar_test(y, p1, p1)["p_value"] == 1.0


def test_holm_adjust():
    adj = cf.holm_adjust([0.01, 0.04, 0.03, 0.005])
    # sorted: 0.005*4=0.02, 0.01*3=0.03, 0.03*2=0.06, 0.04*1 -> max(0.06, 0.04)=0.06
    np.testing.assert_allclose(adj, [0.03, 0.06, 0.06, 0.02])
    assert cf.holm_adjust([0.9, 0.8]).max() <= 1.0


def test_bootstraps_deterministic_and_paired_sign():
    rng = np.random.default_rng(0)
    n = 400
    y = rng.integers(0, 2, n)
    unseen = rng.random(n) < 0.3
    good = np.where(rng.random(n) < 0.9, y, 1 - y)
    bad = np.where(rng.random(n) < 0.6, y, 1 - y)
    mk = lambda p: pd.DataFrame({"y_true": y, "y_pred": p, "is_unseen": unseen})
    a = cf.compute_bootstrap_cis(mk(good), n_bootstraps=200)
    assert a == cf.compute_bootstrap_cis(mk(good), n_bootstraps=200)
    d = cf.compute_paired_bootstrap(mk(good), mk(bad), n_bootstraps=200)
    assert d["macro_f1"]["ci_95_lower"] > 0
    assert d["macro_f1"]["p_one_sided_a_le_b"] == pytest.approx(1 / 201)
    assert d["macro_f1"]["p_two_sided"] == pytest.approx(2 / 201)


# ---------------------------------------------------------------------------
# Tuning + refit (regression test for the dropped-fixed-parameters bug)
# ---------------------------------------------------------------------------
@pytest.fixture(scope="module")
def small_data():
    full = cf.load_dataset()
    rng = np.random.default_rng(0)
    tr = np.sort(rng.choice(len(full.train_df), 3000, replace=False))
    te = np.sort(rng.choice(len(full.test_df), 1500, replace=False))
    train_df = full.train_df.iloc[tr].reset_index(drop=True)
    test_df = full.test_df.iloc[te].reset_index(drop=True)
    X_tr, y_tr = full.X_train.iloc[tr].reset_index(drop=True), full.y_train.iloc[tr].reset_index(drop=True)
    X_te, y_te = full.X_test.iloc[te].reset_index(drop=True), full.y_test.iloc[te].reset_index(drop=True)
    return cf.Dataset(train_df, test_df, X_tr, y_tr, X_te, y_te, full.seen_attacks, full.unseen_attacks)


def test_final_model_uses_fixed_params(small_data):
    fixed = {"solver": "lbfgs", "max_iter": 777, "random_state": 0, "class_weight": None}
    res = cf.run_controlled_experiment(
        "LR test", lambda t: {"C": t.suggest_float("C", 1e-2, 1e1, log=True)},
        lambda p: LogisticRegression(**p), fixed, seed=123, data=small_data, n_trials=2, n_splits=2, verbose=False)
    clf = res.pipeline.named_steps["clf"]
    assert clf.max_iter == 777 and clf.random_state == 123 and clf.class_weight is None   # seed propagated
    assert res.best_params["C"] == res.study.best_params["C"]
    assert set(fixed) <= set(res.best_params)
    assert len(res.predictions) == len(small_data.test_df)
    assert "y_prob" in res.predictions
    assert set(res.oof_thresholds) == {cf.budget_key(b) for b in cf.FPR_BUDGETS}
    assert "threshold_free" in res.metrics and "deployable_operating_points" in res.metrics
    assert len(res.oof) == len(small_data.train_df)


def test_refit_is_reproducible(small_data):
    fixed = {"random_state": 7, "class_weight": None}
    run = lambda: cf.run_controlled_experiment(
        "DT test", lambda t: {"max_depth": t.suggest_int("max_depth", 2, 12)},
        lambda p: DecisionTreeClassifier(**p), fixed, seed=7, data=small_data, n_trials=3, n_splits=2, verbose=False)
    a, b = run(), run()
    assert a.best_params == b.best_params
    np.testing.assert_array_equal(a.predictions["y_prob"], b.predictions["y_prob"])


def test_tuned_and_fixed_keys_must_be_disjoint(small_data):
    with pytest.raises(ValueError, match="both tuned and fixed"):
        cf.run_controlled_experiment(
            "bad", lambda t: {"random_state": t.suggest_int("random_state", 0, 1)},
            lambda p: DecisionTreeClassifier(**p), {"random_state": 0}, data=small_data,
            n_trials=1, n_splits=2, verbose=False)


def test_check_final_params_detects_mismatch(small_data):
    pipe = cf.make_pipeline(lambda p: DecisionTreeClassifier(**p), {"max_depth": 3}, small_data.X_train)
    with pytest.raises(AssertionError):
        cf.check_final_params(pipe, {"max_depth": 4})


# ---------------------------------------------------------------------------
# Novelty folds, operating points, cluster bootstrap
# ---------------------------------------------------------------------------
def test_novelty_folds_hold_out_whole_attack_types(small_data):
    folds, groups = cf.novelty_folds(small_data.train_df, seed=0, n_splits=3)
    labels = small_data.train_df["label"].to_numpy()
    seen_val = np.zeros(len(labels), dtype=int)
    for k, (tr, va) in enumerate(folds):
        assert len(np.intersect1d(tr, va)) == 0
        held = {t for t in set(labels[va]) if t != "normal"}
        assert held == {t for t, f in groups.items() if f == k}
        assert not held & set(labels[tr])           # no held-out attack type in training
        seen_val[va] += 1
    assert (seen_val == 1).all()                    # every row held out exactly once


def test_threshold_for_fpr_and_operating_point():
    normals = np.array([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0])
    t = cf.threshold_for_fpr(normals, 0.2)
    assert t == 0.8 and (normals > t).mean() == pytest.approx(0.2)
    disc = np.array([0.0] * 8 + [1.0] * 2)          # tied scores: cannot hit 10% exactly
    assert (disc > cf.threshold_for_fpr(disc, 0.1)).mean() <= 0.1
    y = np.array([0, 0, 1, 1]); p = np.array([0.1, 0.9, 0.95, 0.2]); u = np.array([False, False, True, False])
    op = cf.operating_point(y, p, u, 0.5)
    assert op["fpr"] == 0.5 and op["unseen_recall"] == 1.0 and op["seen_recall"] == 0.0


def test_cluster_bootstrap_resamples_types():
    df = pd.DataFrame({"y_true": [1] * 6, "is_unseen": [True] * 6,
                       "attack_name": ["a", "a", "a", "b", "b", "c"], "y_pred": [1, 1, 1, 0, 0, 1]})
    r = cf.compute_cluster_bootstrap_unseen(df, n_bootstraps=300)
    assert r["n_types"] == 3
    assert 0 <= r["unseen_recall_micro"]["ci_95_lower"] <= r["unseen_recall_micro"]["ci_95_upper"] <= 1
    assert r["unseen_recall_macro"]["mean"] == pytest.approx(2 / 3, abs=0.06)


def test_paired_bootstrap_with_probabilities():
    rng = np.random.default_rng(1)
    n = 600
    y = rng.integers(0, 2, n); unseen = (y == 1) & (rng.random(n) < 0.5)
    good = np.clip(y * 0.7 + rng.random(n) * 0.3, 0, 1); bad = rng.random(n)
    mk = lambda q: pd.DataFrame({"y_true": y, "y_pred": (q > 0.5).astype(int), "is_unseen": unseen, "y_prob": q})
    d = cf.compute_paired_bootstrap(mk(good), mk(bad), n_bootstraps=100)
    assert d["auc_unseen_vs_normal"]["ci_95_lower"] > 0
    assert any(k.startswith("unseen_recall_at_test_fpr") for k in d)
