"""Tests for the shared preprocessing pipeline, header script and metrics."""

import importlib.util
import shutil

import joblib
import numpy as np
import pandas as pd
import pytest
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier

from src.config import set_all_seeds
from src.data_loader import FEATURE_COLUMNS, PROJECT_ROOT, load_nsl_kdd
from src.evaluation import best_threshold, compute_metrics
from src.features import (
    BINARY_COLS, CAT_COLS, DROP_COLS, LOG_COLS, RATE_COLS, CorrelationFilter,
    build_pipeline, build_preprocessor,
)

SEED = 42


@pytest.fixture(scope="module")
def data():
    set_all_seeds(SEED)
    train, test = load_nsl_kdd()
    sample = train.groupby("is_intrusion", group_keys=False).sample(n=2500, random_state=SEED)
    return train, test, sample


def test_column_groups_cover_41_features():
    groups = LOG_COLS + RATE_COLS + BINARY_COLS + CAT_COLS + DROP_COLS
    assert len(groups) == 41 and set(groups) == set(FEATURE_COLUMNS)


@pytest.mark.parametrize("family", ["linear", "tree"])
def test_preprocessor_output_clean(data, family):
    train, test, sample = data
    prep = build_preprocessor(family).fit(sample[FEATURE_COLUMNS])
    out = prep.transform(test[FEATURE_COLUMNS])
    names = prep.get_feature_names_out()
    assert out.shape == (len(test), len(names))
    assert np.isfinite(out).all()
    assert not any("num_outbound_cmds" in n for n in names)


def test_su_attempted_cleaned(data):
    train, _, _ = data
    cleaned = build_preprocessor("tree")[:1].fit_transform(train[FEATURE_COLUMNS])
    assert set(cleaned["su_attempted"].unique()) <= {0, 1}
    assert (train["su_attempted"] == 2).sum() > 0  # raw data untouched


def test_forbidden_columns_rejected(data):
    _, _, sample = data
    with pytest.raises(ValueError):
        build_preprocessor("linear").fit(sample[FEATURE_COLUMNS + ["difficulty_level"]])


def test_correlation_filter_learns_on_fit_data_only():
    rng = np.random.default_rng(SEED)
    a = rng.normal(size=500)
    fit_df = pd.DataFrame({"serror_rate": a, "srv_serror_rate": a + 1e-4 * rng.normal(size=500),
                           "rerror_rate": rng.normal(size=500)})
    filt = CorrelationFilter(0.98, columns=list(fit_df.columns)).fit(fit_df)
    assert filt.dropped_ == ["srv_serror_rate"]
    # transform on different data never changes the learned drop list
    other = pd.DataFrame(rng.normal(size=(50, 3)), columns=fit_df.columns)
    assert list(filt.transform(other).columns) == ["serror_rate", "rerror_rate"]
    assert CorrelationFilter(None).fit(fit_df).dropped_ == []


def test_full_train_correlation_drops(data):
    train, _, _ = data
    prep = build_preprocessor("tree").fit(train[FEATURE_COLUMNS])
    assert set(prep.named_steps["corr"].dropped_) == {
        "num_root", "srv_serror_rate", "srv_rerror_rate", "dst_host_srv_serror_rate"}


def test_pipeline_joblib_roundtrip(tmp_path, data):
    _, test, sample = data
    pipe = build_pipeline(LogisticRegression(max_iter=300, random_state=SEED), "linear")
    pipe.fit(sample[FEATURE_COLUMNS], sample["is_intrusion"])
    joblib.dump(pipe, tmp_path / "p.joblib")
    loaded = joblib.load(tmp_path / "p.joblib")
    np.testing.assert_array_equal(pipe.predict_proba(test[FEATURE_COLUMNS]),
                                  loaded.predict_proba(test[FEATURE_COLUMNS]))


def test_fit_is_reproducible(data):
    _, test, sample = data
    probs = []
    for _ in range(2):
        set_all_seeds(SEED)
        pipe = build_pipeline(DecisionTreeClassifier(max_depth=8, random_state=SEED), "tree")
        pipe.fit(sample[FEATURE_COLUMNS], sample["is_intrusion"])
        probs.append(pipe.predict_proba(test[FEATURE_COLUMNS]))
    np.testing.assert_array_equal(probs[0], probs[1])


def test_xgboost_pipeline_reproducible_and_complexity(data):
    xgb = pytest.importorskip("xgboost")
    from src.experiment import model_complexity
    _, test, sample = data
    probs = []
    for _ in range(2):
        set_all_seeds(SEED)
        est = xgb.XGBClassifier(n_estimators=40, max_depth=4, learning_rate=0.2, subsample=0.8,
                                colsample_bytree=0.8, tree_method="hist", n_jobs=-1, random_state=SEED)
        pipe = build_pipeline(est, "tree")
        pipe.fit(sample[FEATURE_COLUMNS], sample["is_intrusion"])
        probs.append(pipe.predict_proba(test[FEATURE_COLUMNS]))
    np.testing.assert_array_equal(probs[0], probs[1])
    comp = model_complexity(pipe)
    assert comp["n_trees"] == 40 and comp["max_depth"] == 4


def test_optuna_seeded_sampler_reproducible():
    import optuna
    optuna.logging.set_verbosity(optuna.logging.WARNING)
    best = []
    for _ in range(2):
        s = optuna.create_study(direction="maximize", sampler=optuna.samplers.TPESampler(seed=SEED))
        s.optimize(lambda t: -(t.suggest_float("x", -5, 5) - 1) ** 2, n_trials=5)
        best.append(s.best_params)
    assert best[0] == best[1]


def test_compute_metrics_hand_values():
    y = np.array([0, 0, 1, 1, 1])
    p = np.array([0.1, 0.8, 0.9, 0.4, 0.7])
    m = compute_metrics(y, p, 0.5)
    assert (m["tn"], m["fp"], m["fn"], m["tp"]) == (1, 1, 1, 2)
    assert m["fpr"] == pytest.approx(0.5) and m["fnr"] == pytest.approx(1 / 3)
    assert m["recall"] == pytest.approx(2 / 3) and m["precision"] == pytest.approx(2 / 3)
    assert 0.05 <= best_threshold(y, p) <= 0.95


def test_header_script_idempotent(tmp_path):
    spec = importlib.util.spec_from_file_location("add_headers", PROJECT_ROOT / "scripts" / "add_headers.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    work = tmp_path / "data"
    work.mkdir()
    target = work / "KDDTest+.csv"
    shutil.copy(PROJECT_ROOT / "dataset" / "raw" / "KDDTest+.csv", target)
    original = target.read_bytes()
    assert mod.add_header(target).startswith("update")
    once = target.read_bytes()
    assert mod.add_header(target).startswith("skip")
    assert target.read_bytes() == once
    assert once.endswith(original) and once.count(mod.HEADER) == 1
    df = pd.read_csv(target)
    assert list(df.columns) == mod.COLUMNS and len(df) == 22543
