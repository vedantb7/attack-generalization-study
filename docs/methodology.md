# 🛡️ Data Pipeline & Preprocessing Methodology

**Project:** Signature Memorization vs. Unseen Attack Generalization in Network Intrusion Detection  
**Course:** ES 335: Machine Learning (IIT Gandhinagar)  
**Modules:** [`src/data_loader.py`](../src/data_loader.py), [`src/preprocessing.py`](../src/preprocessing.py)  
**Notebooks:** [`notebooks/01_data_exploration.ipynb`](../notebooks/01_data_exploration.ipynb), [`notebooks/02_preprocessing.ipynb`](../notebooks/02_preprocessing.ipynb)  

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

**Notebook:** [`notebooks/06_random_forest.ipynb`](../notebooks/06_random_forest.ipynb)  
**Author:** Vedant (Team: Vedant & Dhruv)  
**Artifacts:** [`models/random_forest.joblib`](../models/random_forest.joblib), [`results/metrics/random_forest.json`](../results/metrics/random_forest.json), [`results/metrics/random_forest_initial.json`](../results/metrics/random_forest_initial.json), [`results/predictions/random_forest_predictions.csv`](../results/predictions/random_forest_predictions.csv)

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

---

## 9. Unified Controlled Experimental Framework & Fair Multi-Model Comparison

**Module:** [`src/controlled_framework.py`](../src/controlled_framework.py)  
**Notebook:** [`notebooks/07_evaluation_comparison.ipynb`](../notebooks/07_evaluation_comparison.ipynb)  
**Artifacts:**
- Models: `models/logistic_regression_controlled.joblib`, `models/decision_tree_controlled.joblib`, `models/random_forest_controlled.joblib`
- Metrics: `results/metrics/logistic_regression_controlled.json`, `results/metrics/decision_tree_controlled.json`, `results/metrics/random_forest_controlled.json`, `results/metrics/majority_baseline_controlled.json`, `results/metrics/statistical_comparison.json`
- Predictions: `results/predictions/*_controlled_predictions.csv` (22,543 records each)

### 9.1 Motivation & Protocol Controls
An audit of team implementations revealed disparities in feature dimensionality (107 features with correlation dropping vs. 122 canonical features) and missing execution outputs. To ensure absolute scientific fairness, transparency, and reproducibility:
1. **Identical Inputs:** All models consume the canonical 122-feature standard-scaled representation (`OneHotEncoder(handle_unknown='ignore')` + `StandardScaler()`).
2. **Zero Validation Leakage:** During 5-fold Stratified Cross-Validation on `KDDTrain+` ($N=100,778$), preprocessors were fitted strictly inside each training fold.
3. **Equal Optimization Budget:** Exactly 25 Optuna TPE trials per model maximizing CV Macro-F1 (`random_state=42`).
4. **Strict Evaluation Hygiene:** The official test set (`KDDTest+`, $N=22,543$) was evaluated exactly once at a fixed decision threshold of $0.50$ (zero test-set hyperparameter tuning or threshold snooping).
5. **Statistical Significance & Uncertainty:** Paired McNemar tests with Edwards continuity correction on all 22,543 test predictions and 1,000-sample percentile bootstrap 95% confidence intervals.

### 9.2 Tuned Model Configurations
- **Logistic Regression (Controlled):**
  - $C = 82.05$, `class_weight='balanced'`, `solver='lbfgs'`, `max_iter=500`
  - Best 5-fold CV Macro-F1: $0.9757 \pm 0.0010$
- **Decision Tree (Controlled):**
  - `criterion='gini'`, `max_depth=30`, `min_samples_split=2`, `min_samples_leaf=2`, `max_features=None`, `class_weight='balanced'`
  - Best 5-fold CV Macro-F1: $0.9979 \pm 0.0002$
- **Random Forest (Controlled):**
  - `n_estimators=75`, `max_depth=None`, `min_samples_split=3`, `min_samples_leaf=1`, `max_features='sqrt'`, `class_weight=None`
  - Best 5-fold CV Macro-F1: $0.9987 \pm 0.0004$

### 9.3 Controlled Test Benchmark Results (`KDDTest+`, $N=22,543$)

| Metric | Majority Baseline | Logistic Regression | Decision Tree | Random Forest |
|:---|:---:|:---:|:---:|:---:|
| **Accuracy (%)** | 43.07% | 75.64% | **83.22%** | 76.36% |
| **Macro-F1 (95% CI)** | 0.3011 | 0.7560 [0.7500, 0.7613] | **0.8322** [0.8272, 0.8370] | 0.7623 [0.7567, 0.7674] |
| **Attack Recall (%)** | 0.00% | 62.92% | **73.91%** | 60.52% |
| **Attack Precision (%)** | 0.00% | 91.68% | 95.61% | **96.72%** |
| **Attack F1** | 0.0000 | 0.7462 | **0.8337** | 0.7446 |
| **False Positive Rate (FPR)** | 0.00% | 7.55% | 4.48% | **2.71%** |
| **False Negative Rate (FNR)** | 100.00% | 37.08% | **26.09%** | 39.48% |
| **DoS Recall (n=7,458)** | 0.00% | 82.22% | **85.43%** | 79.47% |
| **Probe Recall (n=2,421)** | 0.00% | 78.11% | **83.02%** | 72.86% |
| **R2L Recall (n=2,887)** | 0.00% | 1.04% | **37.48%** | 2.36% |
| **U2R Recall (n=67)** | 0.00% | 31.34% | **32.84%** | 11.94% |
| **Seen Attack Recall (n=9,083)** | 0.00% | 71.52% [70.51, 72.41] | **82.40%** [81.58, 83.15] | 75.91% [75.01, 76.70] |
| **Unseen Attack Recall (n=3,750)** | 0.00% | 42.08% [40.57, 43.70] | **53.36%** [51.82, 54.96] | 23.25% [21.90, 24.62] |
| **Generalization Drop (pp)** | 0.00 pp | **29.44 pp** [27.67, 31.27] | **29.04 pp** [27.21, 30.74] | **52.66 pp** [50.99, 54.24] |
| **Latency (μs / flow)** | 0.04 μs | 1.34 μs | **0.82 μs** | 4.34 μs |

### 9.4 Granular 17 Unseen Attack Types Breakdown

| Attack Signature | Category | Test Samples ($n$) | Logistic Regression | Decision Tree | Random Forest | Primary Behavioral Observation |
|:---|:---:|:---:|:---:|:---:|:---:|:---|
| **mscan** | Probe | 996 | 523 (52.51%) | 589 (59.14%) | 344 (34.54%) | Multi-host IP scanning sweep; all models detect over a third of flows |
| **apache2** | DoS | 737 | 730 (99.05%) | 334 (45.32%) | 195 (26.46%) | Volumetric HTTP flood; linear weights capture high connection rates |
| **processtable** | DoS | 685 | 7 (1.02%) | 235 (34.31%) | 8 (1.17%) | Slow resource-exhaustion DoS; DT captures lingering connection states |
| **snmpguess** | R2L | 331 | 2 (0.60%) | 327 (98.79%) | 0 (0.00%) | SNMP community string brute-force; DT isolates via UDP destination port |
| **saint** | Probe | 319 | 305 (95.61%) | 317 (99.37%) | 314 (98.43%) | Aggressive vulnerability assessment tool; recognized by all models |
| **mailbomb** | DoS | 293 | 0 (0.00%) | 63 (21.50%) | 0 (0.00%) | Spam-based volume queue flood; LR and RF miss 100% of samples |
| **snmpgetattack** | R2L | 178 | 1 (0.56%) | 0 (0.00%) | 0 (0.00%) | SNMP reconnaissance; stealthy UDP payload missed by all models |
| **httptunnel** | R2L | 133 | 4 (3.01%) | 110 (82.71%) | 1 (0.75%) | Payload tunneling over HTTP port 80; DT detects anomalous flow length |
| **named** | R2L | 17 | 1 (5.88%) | 5 (29.41%) | 2 (11.76%) | DNS zone transfer / cache exploit; moderate detection by DT |
| **ps** | U2R | 15 | 0 (0.00%) | 9 (60.00%) | 2 (13.33%) | Shell command execution exploit; DT isolates process count indicators |
| **sendmail** | R2L | 14 | 1 (7.14%) | 1 (7.14%) | 0 (0.00%) | Buffer overflow in SMTP daemon; low-volume payload largely undetected |
| **xterm** | U2R | 13 | 4 (30.77%) | 4 (30.77%) | 3 (23.08%) | Local display root exploit; recognized via host session patterns |
| **xlock** | R2L | 9 | 0 (0.00%) | 2 (22.22%) | 0 (0.00%) | X11 screen locker authentication bypass; DT detects 2 of 9 flows |
| **xsnoop** | R2L | 4 | 0 (0.00%) | 1 (25.00%) | 1 (25.00%) | X11 keystroke sniffer; low volume makes statistical detection difficult |
| **sqlattack** | U2R | 2 | 0 (0.00%) | 2 (100.00%) | 0 (0.00%) | SQL injection privilege escalation; DT isolates SQL traffic byte ratio |
| **udpstorm** | DoS | 2 | 0 (0.00%) | 2 (100.00%) | 2 (100.00%) | UDP loop flood; volumetric byte spikes detected by both DT and RF |
| **worm** | R2L | 2 | 0 (0.00%) | 0 (0.00%) | 0 (0.00%) | Self-propagating worm payload; zero detection across all models |
| **TOTAL (SUM)** | **ALL UNSEEN** | **3,750** | **1,578 (42.08%)** | **2,001 (53.36%)** | **872 (23.25%)** | **Exact match with aggregate unseen detection metrics** |

### 9.5 Statistical Significance (McNemar's Tests & Paired Bootstrap)

#### A. Full Test Set ($N=22,543$: Overall Classification Concordance)
- **Logistic Regression vs. Decision Tree:** Disagreements: 3,223 | $\chi^2 = 905.14$, $p < 10^{-198}$ (Decision Tree significantly superior in overall accuracy).
- **Logistic Regression vs. Random Forest:** Disagreements: 1,919 | $\chi^2 = 13.68$, $p = 0.000217$ (Significantly distinct error distributions; RF achieves higher precision, LR achieves higher recall).
- **Decision Tree vs. Random Forest:** Disagreements: 2,026 | $\chi^2 = 1,178.20$, $p < 10^{-257}$ (Decision Tree significantly superior overall).

#### B. Unseen Attack Subset ($N=3,750$: Novel Attack Detection Concordance)
- **Logistic Regression vs. Decision Tree:** Disagreements: 1,605 (LR right/DT wrong: 591, LR wrong/DT right: 1,014) | $\chi^2 = 110.96$, $p < 10^{-25}$ (Decision Tree significantly superior on novel attack detection).
- **Logistic Regression vs. Random Forest:** Disagreements: 928 (LR right/RF wrong: 817, LR wrong/RF right: 111) | $\chi^2 = 535.59$, $p < 10^{-118}$ (Logistic Regression significantly superior on novel attack detection).
- **Decision Tree vs. Random Forest:** Disagreements: 1,245 (DT right/RF wrong: 1,187, DT wrong/RF right: 58) | $\chi^2 = 1,022.00$, $p < 10^{-223}$ (Decision Tree significantly superior on novel attack detection).

#### C. Paired Bootstrap Differences (1,000 Replicates with Shared Test Indices)
- **DT vs. RF:** $\Delta(\text{Macro-F1}) = +0.0699$ [$+0.0662, +0.0739$], $\Delta(\text{Unseen Recall}) = +30.13\text{ pp}$ [$+28.62, +31.75$ pp], $P(\Delta \le 0) = 0.0000$.
- **LR vs. RF:** $\Delta(\text{Macro-F1}) = -0.0064$ [$-0.0100, -0.0029$], $\Delta(\text{Unseen Recall}) = +18.79\text{ pp}$ [$+17.31, +20.25$ pp], $P(\Delta \le 0) = 0.0000$.
- **DT vs. LR:** $\Delta(\text{Macro-F1}) = +0.0763$ [$+0.0715, +0.0807$], $\Delta(\text{Unseen Recall}) = +11.34\text{ pp}$ [$+9.25, +13.43$ pp], $P(\Delta \le 0) = 0.0000$.

### 9.6 Bounded Academic Evaluation of the Research Hypothesis
1. **Does Random Forest Suffer from Signature Memorization?**  
   Random Forest exhibits clear empirical evidence of signature memorization. While saturating cross-validation ($0.9987$) and achieving $75.91\%$ seen recall, its performance drops by **$52.66$ percentage points** to only $23.25\%$ on unseen attacks. Feature subspace projection (`max_features='sqrt'`) forces trees to split on local, specialized feature combinations that fail when novel attacks appear with altered traffic distributions. However, "memorization" is an empirical interpretation of severe out-of-distribution degradation, not a standalone causal proof; covariance shift in continuous traffic features and class imbalance also contribute.
2. **Do Simpler Models Generalize Better to Unseen Attacks?**  
   On this benchmark, yes: both Decision Tree ($53.36\%$ unseen recall, $29.04$ pp drop) and Logistic Regression ($42.08\%$ unseen recall, $29.44$ pp drop) significantly outperformed Random Forest ($23.25\%$ unseen recall, $52.66$ pp drop). Decision Tree's unconstrained splits on global continuous features enabled it to detect substantial unseen DoS and R2L tools (`httptunnel`, `apache2`, `snmpguess`).
3. **Crucial Methodological Boundaries:**  
   - *Alert Fatigue:* Simpler models do not provide an uncompromised solution. Logistic Regression produced a $7.55\%$ false positive rate ($733$ false alarms), nearly $3\times$ higher than Random Forest ($2.71\%$, $263$ false alarms).
   - *Stealth Failure:* On non-volumetric stealth attacks (`mailbomb`, `processtable`, `worm`, `snmpgetattack`), all models experienced severe blind spots.
   - *No True Zero-Day Claim:* NSL-KDD unseen attacks are historical 1999–2009 variations within a synthetic benchmark; they do not establish operational zero-day protection in modern enterprise networks.

### 9.7 Reproduction & Verification Workflow

All controlled experiments and evaluation figures can be reproduced directly via the command-line scripts:

1. **Run All Controlled Models:**
   ```bash
   python scripts/run_all_controlled_models.py
   ```
   Executes 5-fold CV hyperparameter tuning via Optuna (25 trials per model), fits final models on full `KDDTrain+`, evaluates once on `KDDTest+`, serializes models to `models/*_controlled.joblib`, writes metrics to `results/metrics/`, and exports predictions to `results/predictions/`.

2. **Build & Execute Comparative Evaluation Notebook:**
   ```bash
   python scripts/build_comparison_notebook.py
   ```
   Generates and validates `notebooks/07_evaluation_comparison.ipynb`, executing the full statistical significance suite (McNemar tests, bootstrap CIs) and rendering high-resolution figures to `results/figures/evaluation/`.



