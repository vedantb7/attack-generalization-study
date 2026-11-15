"""
features.py
-----------
Shared, leakage-safe scikit-learn preprocessing for NSL-KDD binary detection.

Every decision here is justified by the EDA (docs/dataset_notes.md, Part B):

- ``num_outbound_cmds`` is constant -> dropped.
- ``su_attempted`` takes the undefined value 2 (all such rows have
  ``root_shell = 1``) -> mapped to 1. Row-wise and label-free.
- Near-duplicate numeric features (|r| >= 0.98) -> one of each pair dropped by
  ``CorrelationFilter``, which learns the drop list in ``fit`` (training data
  only, refit inside every CV fold).
- Heavy-tailed counts/bytes (skew up to 290) -> ``log1p`` + ``StandardScaler``
  for linear models; rates -> ``StandardScaler``. Tree models skip both,
  because trees are invariant to monotone transforms.
- Categoricals -> one-hot with ``min_frequency`` grouping of rare levels.

Both model families share the same cleaning, correlation filter, categorical
encoding and rare-level grouping, so model comparisons are fair.
"""

from __future__ import annotations

from typing import List

import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import FunctionTransformer, OneHotEncoder, StandardScaler

from src.data_loader import FEATURE_COLUMNS

# --- Column groups (41 raw features = 16 + 15 + 6 + 3 + 1) -----------------
LOG_COLS: List[str] = [
    "duration", "src_bytes", "dst_bytes", "wrong_fragment", "urgent", "hot",
    "num_failed_logins", "num_compromised", "num_root", "num_file_creations",
    "num_shells", "num_access_files", "count", "srv_count", "dst_host_count",
    "dst_host_srv_count",
]
RATE_COLS: List[str] = [c for c in FEATURE_COLUMNS if c.endswith("_rate")]
BINARY_COLS: List[str] = [
    "land", "logged_in", "root_shell", "su_attempted", "is_host_login", "is_guest_login",
]
CAT_COLS: List[str] = ["protocol_type", "service", "flag"]
DROP_COLS: List[str] = ["num_outbound_cmds"]
NUMERIC_COLS: List[str] = LOG_COLS + RATE_COLS + BINARY_COLS

assert len(LOG_COLS) + len(RATE_COLS) + len(BINARY_COLS) + len(CAT_COLS) + len(DROP_COLS) == 41
assert set(LOG_COLS + RATE_COLS + BINARY_COLS + CAT_COLS + DROP_COLS) == set(FEATURE_COLUMNS)

# Columns that must never reach a model (targets and label-derived metadata)
FORBIDDEN_COLS = {"label", "class", "difficulty_level", "is_intrusion", "attack_category", "target"}


class FeatureCleaner(BaseEstimator, TransformerMixin):
    """Stateless row-wise cleaning: drop constant columns, fix ``su_attempted``."""

    def fit(self, X: pd.DataFrame, y=None):
        forbidden = FORBIDDEN_COLS.intersection(X.columns)
        if forbidden:
            raise ValueError(f"Target/metadata columns must not be model inputs: {sorted(forbidden)}")
        self.feature_names_in_ = np.asarray(X.columns, dtype=object)
        return self

    def transform(self, X: pd.DataFrame) -> pd.DataFrame:
        X = X.drop(columns=[c for c in DROP_COLS if c in X.columns]).copy()
        if "su_attempted" in X.columns:
            X["su_attempted"] = X["su_attempted"].clip(upper=1)
        return X

    def get_feature_names_out(self, input_features=None):
        return np.asarray([c for c in self.feature_names_in_ if c not in DROP_COLS], dtype=object)


class CorrelationFilter(BaseEstimator, TransformerMixin):
    """Drop numeric columns highly correlated with an earlier, kept column.

    Columns are scanned in their input order; a column is dropped when its
    absolute Pearson correlation with any already-kept column is
    ``>= threshold``. The drop list is learned in ``fit`` only.
    ``threshold=None`` disables the filter (used for ablations).
    """

    def __init__(self, threshold: float | None = 0.98, columns: List[str] | None = None):
        self.threshold = threshold
        self.columns = columns

    def fit(self, X: pd.DataFrame, y=None):
        cols = [c for c in (self.columns or NUMERIC_COLS) if c in X.columns]
        self.feature_names_in_ = np.asarray(X.columns, dtype=object)
        self.dropped_: List[str] = []
        if self.threshold is not None:
            data = X[cols].astype(float)
            data = data.loc[:, data.std() > 0]
            corr = data.corr().abs()
            kept: List[str] = []
            for c in corr.columns:
                if any(corr.loc[c, k] >= self.threshold for k in kept):
                    self.dropped_.append(c)
                else:
                    kept.append(c)
        return self

    def transform(self, X: pd.DataFrame) -> pd.DataFrame:
        return X.drop(columns=self.dropped_)

    def get_feature_names_out(self, input_features=None):
        return np.asarray([c for c in self.feature_names_in_ if c not in self.dropped_], dtype=object)


class PresentColumns:
    """Picklable column selector: the subset of ``columns`` present in ``X``.

    Needed because ``CorrelationFilter`` removes columns before the
    ColumnTransformer; lambdas would break joblib serialization.
    """

    def __init__(self, columns: List[str]):
        self.columns = list(columns)

    def __call__(self, X: pd.DataFrame) -> List[str]:
        return [c for c in self.columns if c in X.columns]


def build_preprocessor(
    family: str = "linear",
    log_transform: bool = True,
    corr_threshold: float | None = 0.98,
    min_frequency: int | None = 50,
) -> Pipeline:
    """Return an unfitted preprocessing Pipeline.

    Parameters
    ----------
    family : {"linear", "tree"}
        ``linear`` scales numeric features (optionally after ``log1p``);
        ``tree`` passes numeric features through unchanged.
    log_transform : bool
        Apply ``log1p`` to heavy-tailed counts/bytes (linear family only).
    corr_threshold : float or None
        |r| threshold of ``CorrelationFilter``; ``None`` disables it.
    min_frequency : int or None
        Categories with fewer training rows are grouped into one
        "infrequent" one-hot column.
    """
    if family not in {"linear", "tree"}:
        raise ValueError("family must be 'linear' or 'tree'")

    ohe = OneHotEncoder(handle_unknown="infrequent_if_exist", min_frequency=min_frequency,
                        sparse_output=False)
    if family == "linear":
        log_step = (Pipeline([("log1p", FunctionTransformer(np.log1p, feature_names_out="one-to-one")),
                              ("scale", StandardScaler())])
                    if log_transform else StandardScaler())
        transformers = [
            ("log", log_step, PresentColumns(LOG_COLS)),
            ("rate", StandardScaler(), PresentColumns(RATE_COLS)),
            ("bin", "passthrough", PresentColumns(BINARY_COLS)),
            ("cat", ohe, PresentColumns(CAT_COLS)),
        ]
    else:
        transformers = [
            ("num", "passthrough", PresentColumns(NUMERIC_COLS)),
            ("cat", ohe, PresentColumns(CAT_COLS)),
        ]

    return Pipeline([
        ("clean", FeatureCleaner()),
        ("corr", CorrelationFilter(threshold=corr_threshold)),
        ("encode", ColumnTransformer(transformers, remainder="drop", verbose_feature_names_out=True)),
    ])


def build_pipeline(estimator, family: str, **prep_kwargs) -> Pipeline:
    """Full model pipeline: shared preprocessing + estimator."""
    return Pipeline([("prep", build_preprocessor(family, **prep_kwargs)), ("model", estimator)])
