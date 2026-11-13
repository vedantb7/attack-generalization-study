"""
preprocessing.py
----------------
Module for feature extraction, categorical encoding, and numerical scaling for the NSL-KDD dataset.

Strict methodological rules enforced:
- Preprocessing is fitted ONLY on training data. Never fit on testing data.
- Categorical features ('protocol_type', 'service', 'flag') are one-hot encoded
  with handle_unknown='ignore' to gracefully handle unseen categories in test data.
- Numerical features (38 remaining original features) are scaled using StandardScaler.
- Target ('label', 'is_intrusion', 'attack_category') and metadata ('difficulty_level')
  columns are strictly excluded from the preprocessor to prevent data leakage.
"""

from pathlib import Path
from typing import List, Tuple, Union, Optional
import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from src.data_loader import COLUMN_NAMES, FEATURE_COLUMNS, PROJECT_ROOT

# Categorical input features in NSL-KDD
CATEGORICAL_FEATURES: List[str] = ['protocol_type', 'service', 'flag']

# Disallowed metadata and target columns that must never enter the feature preprocessor
DISALLOWED_COLUMNS = {
    'label', 'difficulty_level', 'is_intrusion', 'attack_category', 'attack', 'difficulty'
}

# Default destination for persisting the fitted preprocessor
DEFAULT_PREPROCESSOR_PATH: Path = PROJECT_ROOT / 'models' / 'preprocessor.joblib'


def get_feature_columns() -> List[str]:
    """Return the list of the 41 canonical model input feature names."""
    return list(FEATURE_COLUMNS)


def split_features_target(
    df: pd.DataFrame,
    target_col: str = "is_intrusion"
) -> Tuple[pd.DataFrame, pd.Series]:
    """
    Split an NSL-KDD DataFrame into predictor features (X) and target series (y).

    Parameters
    ----------
    df : pd.DataFrame
        DataFrame loaded via load_nsl_kdd().
    target_col : str, default='is_intrusion'
        Target column name (e.g. 'is_intrusion', 'attack_category', or 'label').

    Returns
    -------
    Tuple[pd.DataFrame, pd.Series]
        (X, y) where X contains only the 41 predictor features.

    Raises
    ------
    KeyError
        If target_col is not present in df.
    ValueError
        If df is missing any of the 41 required predictor features.
    """
    if target_col not in df.columns:
        raise KeyError(f"Target column '{target_col}' not found in DataFrame.")

    feature_cols = [col for col in get_feature_columns() if col in df.columns]
    if len(feature_cols) != 41:
        missing = set(get_feature_columns()) - set(df.columns)
        raise ValueError(
            f"DataFrame is missing required predictor features: {sorted(missing)}"
        )

    X = df[feature_cols].copy()
    y = df[target_col].copy()
    return X, y


def create_preprocessor(X_train: pd.DataFrame) -> ColumnTransformer:
    """
    Build an unfitted scikit-learn ColumnTransformer for the NSL-KDD training features.

    Parameters
    ----------
    X_train : pd.DataFrame
        Training feature matrix containing only the 41 original predictor features.
        Target and metadata columns ('label', 'difficulty_level', 'is_intrusion',
        'attack_category') are strictly prohibited to prevent data leakage.

    Returns
    -------
    ColumnTransformer
        Unfitted ColumnTransformer configuring:
        - Categorical features ('protocol_type', 'service', 'flag') -> OneHotEncoder(handle_unknown='ignore')
        - Numerical features (38 features) -> StandardScaler()

    Raises
    ------
    ValueError
        If X_train contains target or metadata columns, or does not contain the required 41 features.
    """
    # Enforce strict absence of target / metadata columns
    forbidden = [col for col in X_train.columns if col in DISALLOWED_COLUMNS]
    if forbidden:
        raise ValueError(
            f"Forbidden target or metadata column(s) detected in X_train: {forbidden}. "
            "The preprocessor must receive only the 41 original input features."
        )

    if len(X_train.columns) != 41:
        raise ValueError(
            f"Expected exactly 41 input features, but received {len(X_train.columns)}."
        )

    missing = set(FEATURE_COLUMNS) - set(X_train.columns)
    if missing:
        raise ValueError(
            f"Missing required predictor features in X_train: {sorted(missing)}."
        )

    # Identify categorical and numerical columns in canonical order
    categorical_cols = [col for col in X_train.columns if col in CATEGORICAL_FEATURES]
    numerical_cols = [col for col in X_train.columns if col not in CATEGORICAL_FEATURES]

    return ColumnTransformer(
        transformers=[
            (
                "categorical",
                OneHotEncoder(handle_unknown="ignore"),
                categorical_cols,
            ),
            (
                "numerical",
                StandardScaler(),
                numerical_cols,
            ),
        ]
    )


def save_preprocessor(
    preprocessor: ColumnTransformer,
    path: Union[str, Path] = DEFAULT_PREPROCESSOR_PATH
) -> Path:
    """
    Save a fitted ColumnTransformer preprocessor to disk using joblib.

    Parameters
    ----------
    preprocessor : ColumnTransformer
        A fitted ColumnTransformer instance.
    path : str or Path, optional
        Target file path. Defaults to models/preprocessor.joblib.

    Returns
    -------
    Path
        Path to the saved preprocessor file.
    """
    out_path = Path(path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(preprocessor, out_path)
    return out_path


def load_preprocessor(
    path: Union[str, Path] = DEFAULT_PREPROCESSOR_PATH
) -> ColumnTransformer:
    """
    Load a fitted ColumnTransformer preprocessor from disk using joblib.

    Parameters
    ----------
    path : str or Path, optional
        Path to the saved preprocessor file. Defaults to models/preprocessor.joblib.

    Returns
    -------
    ColumnTransformer
        Loaded fitted ColumnTransformer instance.

    Raises
    ------
    FileNotFoundError
        If the specified preprocessor file does not exist.
    """
    in_path = Path(path)
    if not in_path.exists():
        raise FileNotFoundError(f"Preprocessor file not found at: {in_path}")
    return joblib.load(in_path)
