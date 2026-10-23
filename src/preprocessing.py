from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler


def create_preprocessor(X_train):
    """Build preprocessing using the training data's feature types."""

    # Identify categorical and numerical columns
    categorical_cols = X_train.select_dtypes(
        include=["object"]
    ).columns.tolist()

    numerical_cols = X_train.select_dtypes(
        exclude=["object"]
    ).columns.tolist()

    # Encode categories and scale numerical features
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