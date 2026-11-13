# 🛡️ Data Pipeline & Preprocessing Methodology

**Project:** Signature Memorization vs. Unseen Attack Generalization in Network Intrusion Detection  
**Course:** ES 335: Machine Learning (IIT Gandhinagar)  
**Modules:** [`src/data_loader.py`](file:///run/media/vedant/DISK/Studies/SEM%205/ES%20335/Project/Intrusion%20Detection/src/data_loader.py), [`src/preprocessing.py`](file:///run/media/vedant/DISK/Studies/SEM%205/ES%20335/Project/Intrusion%20Detection/src/preprocessing.py)  
**Notebooks:** [`notebooks/01_data_exploration.ipynb`](file:///run/media/vedant/DISK/Studies/SEM%205/ES%20335/Project/Intrusion%20Detection/notebooks/01_data_exploration.ipynb), [`notebooks/02_preprocessing.ipynb`](file:///run/media/vedant/DISK/Studies/SEM%205/ES%20335/Project/Intrusion%20Detection/notebooks/02_preprocessing.ipynb)  

---

## 1. Overview & Research Objective

This project investigates whether simpler machine learning models generalize better to previously unseen attack types compared to highly parameterized models. To ensure strict scientific rigor and comparability between team members (Vedant and Dhruv), all models are trained and evaluated using one unified, reproducible data pipeline.

> [!IMPORTANT]
> **Methodological Restriction:** While NSL-KDD contains 17 attack types present exclusively in the test set, we do not claim genuine real-world zero-day detection based solely on this synthetic benchmark. These attacks represent novel signatures within the benchmark domain.

---

## 2. Shared Pipeline Architecture

```mermaid
flowchart TD
    RawTrain["dataset/raw/KDDTrain+.csv (125,973 rows)"] --> DL["src/data_loader.py: load_nsl_kdd()"]
    RawTest["dataset/raw/KDDTest+.csv (22,543 rows)"] --> DL

    DL --> TrainDF["train_df (45 columns)"]
    DL --> TestDF["test_df (45 columns)"]

    TrainDF --> SplitTrain["split_features_target()"]
    TestDF --> SplitTest["split_features_target()"]

    SplitTrain --> X_train["X_train (41 features)"]
    SplitTrain --> y_train["y_train (is_intrusion)"]

    SplitTest --> X_test["X_test (41 features)"]
    SplitTest --> y_test["y_test (is_intrusion)"]

    X_train --> Fit["create_preprocessor(X_train).fit()"]
    Fit --> PrepArtifact["models/preprocessor.joblib (Fitted on Train Only)"]

    PrepArtifact --> TransTrain["preprocessor.transform(X_train) -> (125,973 x 122)"]
    PrepArtifact --> TransTest["preprocessor.transform(X_test) -> (22,543 x 122)"]
```

---

## 3. Data Ingestion (`src/data_loader.py`)

### Schema Specification
- Loaded with `header=None` and `names=COLUMN_NAMES`.
- Canonical 43 columns: 41 network traffic features + 1 attack label (`label`) + 1 difficulty score (`difficulty_level`).
- Path handling is implemented via `pathlib.Path` anchored to `PROJECT_ROOT`, guaranteeing working-directory independence.

### Target Derivations
When `add_derived_targets=True` (default):
1. **Binary Classification (`is_intrusion`):**
   $$\text{is\_intrusion} = \begin{cases} 0 & \text{if } \text{label} = \text{'normal'} \\ 1 & \text{otherwise} \end{cases}$$
   - **Training Set:** 67,343 Normal vs. 58,630 Attack.
   - **Testing Set:** 9,710 Normal vs. 12,833 Attack (class distribution inversion).
2. **5-Class Categorization (`attack_category`):**
   - Maps 39 individual attack signatures into standard DARPA classes: `Normal`, `DoS`, `Probe`, `R2L`, `U2R`.
   - **Mapping Validation:** Pre-validates all unique labels against `ATTACK_MAPPING`. If an unmapped signature appears, it raises a descriptive `ValueError` instead of silently introducing NaNs.
   - **Signature Preservation:** Original fine-grained attack names remain intact in `df['label']` for granular zero-day evaluation.

---

## 4. Feature Extraction & Preprocessing (`src/preprocessing.py`)

### Input Feature Isolation
- Model training inputs $X$ strictly consist of the 41 original predictor features (`FEATURE_COLUMNS = COLUMN_NAMES[:41]`).
- Target columns (`label`, `is_intrusion`, `attack_category`) and metadata (`difficulty_level`) are explicitly excluded. `create_preprocessor()` enforces this check and raises a `ValueError` if forbidden columns are passed.

### Transformations
Combined inside a scikit-learn `ColumnTransformer`:

1. **Categorical Pipeline (`protocol_type`, `service`, `flag`):**
   - Transformed with `OneHotEncoder(handle_unknown='ignore')`.
   - 3 protocol types + 70 training services + 11 TCP flags expand into **84 binary indicators**.
   - `handle_unknown='ignore'` maps unseen categories in test data to all zeros without error.
2. **Numerical Pipeline (remaining 38 features):**
   - Standardized via `StandardScaler()`:
     $$z = \frac{x - \mu_{\text{train}}}{\sigma_{\text{train}}}$$
- **Total Processed Features:** $84 + 38 = 122$ features.

---

## 5. Train-Only Fitting & Anti-Leakage Protocol

To ensure valid generalization measurement:
1. **Train-Only Statistics:** All encoders and scalers are fitted exclusively on `X_train`.
2. **Test Transformation Only:** `X_test` is strictly transformed via `preprocessor.transform(X_test)`. It is never used in `fit()` or `fit_transform()`.
3. **Official Partitions:** The official NSL-KDD `KDDTrain+` and `KDDTest+` files are used without random repartitioning to preserve the designed unseen attack distribution.

---

## 6. Preprocessor Persistence (`models/preprocessor.joblib`)

The fitted pipeline is serialized using `joblib`:
- **Saved location:** `models/preprocessor.joblib`.
- **Reproducibility:** Preprocessors fitted via `src.preprocessing.create_preprocessor` produce exact numerical equivalence ($\Delta = 0.0$) with the reference pipeline from `notebooks/02_preprocessing.ipynb`.
- **Reusable helpers:**
  ```python
  from src.preprocessing import save_preprocessor, load_preprocessor
  save_preprocessor(fitted_preprocessor)
  preprocessor = load_preprocessor()
  ```

---

## 7. Standard Code Recipe for Model Training

All team members must load and preprocess data using this standard recipe:

```python
from src.data_loader import load_nsl_kdd
from src.preprocessing import split_features_target, load_preprocessor, create_preprocessor

# 1. Load standardized dataframes
train_df, test_df = load_nsl_kdd()

# 2. Extract 41 predictor features and binary target
X_train, y_train = split_features_target(train_df, target_col="is_intrusion")
X_test, y_test = split_features_target(test_df, target_col="is_intrusion")

# 3. Option A: Load shared pre-fitted preprocessor
preprocessor = load_preprocessor()
X_train_proc = preprocessor.transform(X_train)
X_test_proc = preprocessor.transform(X_test)

# 3. Option B: Create and fit preprocessor from scratch
# preprocessor = create_preprocessor(X_train)
# X_train_proc = preprocessor.fit_transform(X_train)
# X_test_proc = preprocessor.transform(X_test)

# Dimensions:
# X_train_proc: (125973, 122)
# X_test_proc:  (22543, 122)
```
