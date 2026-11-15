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

---

## 8. Random Forest Classifier: Feature Selection, Hyperparameters & Generalization Analysis

**Notebook:** [`notebooks/06_random_forest.ipynb`](file:///run/media/vedant/DISK/Studies/SEM%205/ES%20335/Project/Intrusion%20Detection/notebooks/06_random_forest.ipynb)  
**Author:** Vedant (Team: Vedant & Dhruv)  
**Artifacts:** [`models/random_forest.joblib`](file:///run/media/vedant/DISK/Studies/SEM%205/ES%20335/Project/Intrusion%20Detection/models/random_forest.joblib), [`results/metrics/random_forest.json`](file:///run/media/vedant/DISK/Studies/SEM%205/ES%20335/Project/Intrusion%20Detection/results/metrics/random_forest.json), [`results/metrics/random_forest_initial.json`](file:///run/media/vedant/DISK/Studies/SEM%205/ES%20335/Project/Intrusion%20Detection/results/metrics/random_forest_initial.json), [`results/predictions/random_forest_predictions.csv`](file:///run/media/vedant/DISK/Studies/SEM%205/ES%20335/Project/Intrusion%20Detection/results/predictions/random_forest_predictions.csv)

### 8.1 Model Role & Objective
Random Forest serves as the **high-capacity non-linear ensemble benchmark** in this study. By aggregating an ensemble of randomized, deep decision trees through bagging and random subspace projection:
$$\text{Var}(\bar{X}) = \rho \sigma^2 + \frac{1 - \rho}{B} \sigma^2$$
it models complex non-linear feature interactions without manual feature engineering. The experimental objective is to establish whether high-capacity tree ensembles primarily memorize known training signatures at the expense of out-of-distribution generalization on novel attack types.

### 8.2 Input Feature Selection & Transformation Justification
- **Retention of All 41 Features:** All 41 original predictor features are retained across Basic (10), Content (12), Time-Traffic (9), and Host-Traffic (10) categories. Intrusion signatures operate across multiple abstractions (byte counts, payload indicators, short-window packet rates, long-window host distributions); retaining all features ensures complete structural visibility.
- **Strict Exclusion of Targets and Metadata:** Target labels (`label`, `is_intrusion`, `attack_category`) and historical metadata (`difficulty_level`) are strictly excluded. `difficulty_level` is a consensus score from 21 historical models; including it would constitute severe metadata leakage.
- **Transformation:** 3 categorical variables are one-hot encoded into 84 binary columns (`OneHotEncoder(handle_unknown='ignore')`), and 38 numerical features are standardized (`StandardScaler`), yielding **122 processed features**.
- **Test-Set Integrity:** No feature selection was executed on the official test set to prevent data snooping bias.

### 8.3 Post-Training Feature Importance (MDI)
The model's internal feature reliance is quantified via **Mean Decrease in Impurity (MDI)**:
$$\text{MDI}(j) = \frac{1}{B} \sum_{b=1}^B \sum_{t \in T_b : v(t)=j} \frac{N_t}{N} \Delta I(t, j)$$
- **Top Features Identified:** `src_bytes` (15.54%), `dst_bytes` (9.71%), `flag_SF` (7.37%), `same_srv_rate` (5.52%), `count` (4.83%).
- **Critical Methodological Caveats:**
  1. *Post-Hoc Inspection:* These features were identified after training through model inspection, not pre-selected.
  2. *Correlation $\neq$ Causation:* High MDI indicates effective statistical discrimination in training trees, not physical or causal necessity in network security.
  3. *Impurity Bias:* MDI is biased toward continuous variables with many split candidates (`src_bytes`, `dst_bytes`) over binary indicator flags.

### 8.4 Hyperparameter Justification & Selection Protocol
The final serialized model (`models/random_forest.joblib`) uses:
```python
RandomForestClassifier(
    n_estimators=100,
    criterion="gini",
    max_depth=None,
    min_samples_split=2,
    min_samples_leaf=1,
    max_features="sqrt",
    class_weight="balanced",
    bootstrap=True,
    random_state=42,
    n_jobs=-1
)
```
- **`n_estimators=100`:** Reduces ensemble variance to stabilization without unnecessary computational overhead.
- **`criterion="gini"`:** Fast, robust impurity calculation.
- **`max_depth=None`:** Allows full non-linear interaction modeling; individual trees terminate when nodes are pure.
- **`min_samples_split=2` / `min_samples_leaf=1`:** Preserves fine-grained leaves for rare attack instances. Validation experiments showed that setting `min_samples_leaf=4` (Config 4) degraded validation recall from $0.9985$ to $0.9971$ (missing 35 attacks vs. 18).
- **`max_features="sqrt"`:** Samples $\approx \sqrt{122} \approx 11$ features per split, de-correlating trees.
- **`class_weight="balanced"`:** Adjusts sample weights inversely proportional to class frequencies ($w_c = \frac{N}{2 \cdot N_c}$), directly penalizing minority-class false negatives.
- **`bootstrap=True`:** Ensures out-of-bag diversity (~63.2% unique records per tree).
- **`random_state=42`:** Pinned for exact reproducibility.
- **`n_jobs=-1`:** Utilizes all CPU cores for training parallelization.

#### Validation Evidence & Selection Objective
Hyperparameters were evaluated strictly on an 80/20 stratified validation split of `KDDTrain+` (100,778 train-sub / 25,195 val-sub). All unconstrained configurations achieved saturation on in-distribution data (Macro-F1 $\approx 0.9990$). The difference between unweighted Config 1 ($0.99912$) and balanced Config 2 ($0.99896$) represents only 4 sample predictions out of 25,195 validation records. Config 2 was selected because it satisfies the operational security objective of cost-sensitive learning to protect under-represented attacks, with validation evidence confirming zero degradation in benign precision ($99.93\%$, 9 false alarms out of 13,470 benign validation flows).

### 8.5 Empirical Test Results (`KDDTest+`, $N = 22,543$)
- **Accuracy:** **$78.59\%$** ($17,716 / 22,543$)
- **Attack Precision:** **$96.86\%$** ($8,274 / 8,542$)
- **Attack Recall:** **$64.47\%$** ($8,274 / 12,833$)
- **Macro-F1:** **$0.7853$**
- **False Positive Rate:** **$2.76\%$** ($268 / 9,710$)
- **False Negative Rate:** **$35.53\%$** ($4,559 / 12,833$)
- **Category Recall:**
  - DoS: **$82.43\%$** ($6,148 / 7,458$)
  - Probe: **$80.46\%$** ($1,948 / 2,421$)
  - R2L: **$5.89\%$** ($170 / 2,887$)
  - U2R: **$11.94\%$** ($8 / 67$)

### 8.6 Seen vs. Unseen Generalization Gap
- **Seen Attacks (22 training signatures):** **$76.91\%$** recall ($6,986 / 9,083$).
- **Unseen Attacks (17 novel test signatures):** **$34.35\%$** recall ($1,288 / 3,750$).
- **Generalization Degradation:** **$42.57\text{ percentage points}$**.

### 8.7 Artifacts & Reproducibility Recipe
```python
import joblib, pandas as pd
from src.data_loader import load_nsl_kdd
from src.preprocessing import split_features_target

# 1. Load data and fitted artifacts
_, test_df = load_nsl_kdd()
X_test_raw, y_test = split_features_target(test_df, target_col="is_intrusion")
preprocessor = joblib.load("models/preprocessor.joblib")
model = joblib.load("models/random_forest.joblib")

# 2. Transform and predict
X_test_proc = preprocessor.transform(X_test_raw)
y_pred = model.predict(X_test_proc)
```

### 8.8 Methodological Boundaries & Limitations
1. **Initial Test-Set Diagnostic:** The official test set was evaluated during an initial diagnostic baseline before final hyperparameter selection. While official test results were not used to pick hyperparameters, the test set was not an untouched blind holdout.
2. **Benchmark Scope:** NSL-KDD results measure benchmark-domain out-of-distribution behavior, not genuine real-world zero-day exploit detection.
3. **Research Hypothesis Scope:** Random Forest alone **cannot** establish whether simpler models generalize better. That comparative hypothesis is strictly reserved for `notebooks/07_evaluation_comparison.ipynb`.

