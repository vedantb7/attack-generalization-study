# Features and Feature Engineering

This document describes every input feature the models see, how the raw NSL-KDD columns are turned into the 122-column model input, which columns are deliberately kept out, and why each feature-engineering decision was made (including the alternatives that were tried and removed).

- **Code:** [`src/data_loader.py`](../src/data_loader.py) (schema, feature lists, groups), [`src/preprocessing.py`](../src/preprocessing.py) (feature/target split, leakage guards, the preprocessor), [`src/controlled_framework.py`](../src/controlled_framework.py) (`make_pipeline`, refit inside every fold)
- **Notebooks:** [`01_data_exploration`](../notebooks/01_data_exploration.ipynb) (feature analysis), [`02_preprocessing`](../notebooks/02_preprocessing.ipynb) (fits and saves the preprocessor)
- **Artifacts:** `scalars/preprocessor.joblib` (fitted on all of KDDTrain+), `scalars/preprocessor_feature_names.json` (the 122 output names), `results/eda/eda_summary.json`
- **Related:** the raw column dictionary with theoretical domains is in [`dataset_notes.md`](dataset_notes.md) §A.4; this document focuses on how features are used.

All statistics below are computed on `dataset/raw/KDDTrain+.csv` (125,973 rows) and `dataset/raw/KDDTest+.csv` (22,543 rows).

---

## 1. Summary

| Stage | Columns | What happens |
|---|---|---|
| Raw file | 43 | 41 features + attack label + `difficulty_level` (headerless CSV; names assigned by `load_nsl_kdd()`) |
| Derived in memory | +2 | `is_intrusion` (binary target) and `attack_category` (DoS / Probe / R2L / U2R / Normal) |
| Model input `X` | **41** | `split_features_target()` keeps exactly the 41 predictors; label, metadata and targets are removed |
| After preprocessing | **122** | 3 categorical features one-hot encoded into 84 columns; 38 numeric features standardised |

Every model (Logistic Regression, Decision Tree, Random Forest, XGBoost; the majority baseline ignores features) receives the **same 122 columns**. There is no per-model feature engineering and no feature selection, so differences between models come from the models, not from different inputs.

---

## 2. Feature inventory

The 41 predictors fall into four groups (as defined in `src/data_loader.FEATURE_GROUPS`). In the original KDD'99 numbering `hot` is the first content feature; this repository groups it with the basic features. The grouping is descriptive only and does not change any processing.

Column meanings: **zeros** = share of training rows equal to 0; **skew** = sample skewness on KDDTrain+; **AUC** = univariate ROC-AUC of the raw value for attack vs normal on KDDTrain+, reported as max(AUC, 1 − AUC) so 0.5 means no signal; **KS** = Kolmogorov–Smirnov statistic between the train and test distributions (higher = more distribution shift). AUC is a label-based diagnostic computed on training data only and is never used to choose features.

### 2.1 Basic connection features (10)

| # | Feature | Type | Encoding | Distinct (train) | Zeros | Skew | AUC | KS | Notes |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `duration` | integer, seconds | StandardScaler | 2,981 | 92.0% | 11.9 | 0.541 | 0.077 | Heavy right tail |
| 2 | `protocol_type` | categorical | one-hot (3) | 3 | – | – | – | – | tcp, udp, icmp |
| 3 | `service` | categorical | one-hot (70) | 70 (63 in test) | – | – | – | – | 7 train-only services, no test-only services |
| 4 | `flag` | categorical | one-hot (11) | 11 | – | – | – | – | Connection state (SF, S0, REJ, …) |
| 5 | `src_bytes` | integer, bytes | StandardScaler | 3,341 | 39.2% | 190.7 | 0.899 | 0.082 | Extreme tail (max 1.38 × 10⁹) |
| 6 | `dst_bytes` | integer, bytes | StandardScaler | 9,326 | 54.0% | 290.0 | **0.900** | 0.124 | Highest univariate AUC of all features |
| 7 | `land` | binary | StandardScaler | 2 | >99.9% | 71.0 | 0.500 | 0.000 | Near-constant (25 train rows = 1) |
| 8 | `wrong_fragment` | integer | StandardScaler | 3 | 99.1% | 11.5 | 0.509 | 0.005 | teardrop / pod signature |
| 9 | `urgent` | integer | StandardScaler | 4 | >99.9% | 149.9 | 0.500 | 0.000 | Near-constant |
| 10 | `hot` | integer | StandardScaler | 28 | 97.9% | 12.6 | 0.503 | 0.023 | "Hot" indicators in the payload |

**Feature definitions (caveman format):**
- `duration`: Connection life in seconds. 0 = single probe packet or teardrop. High = long interactive shell or massive transfer.
- `protocol_type`: Transport protocol (`tcp`, `udp`, `icmp`). Maps wire format. Expands to 3 one-hot columns.
- `service`: Target network daemon port (`http`, `private`, `smtp`, `ftp`, etc.). 70 levels in train. Shows target attack surface.
- `flag`: Terminal TCP handshake status. `SF` = clean finish. `S0` = SYN sent, zero ACK back (SYN flood/stealth scan). `REJ` = connection refused (closed port sweep).
- `src_bytes`: Bytes sent client to server. Zero in silent listen probes. Massive spike in payload exfiltration or buffer overflow floods.
- `dst_bytes`: Bytes returned server to client. 54% zero. Highest raw separation power (AUC 0.900). Zero on unanswered scans and half-open floods.
- `land`: Binary flag. 1 if source IP and port equal destination IP and port. Classic LAND DoS loop exploit.
- `wrong_fragment`: Corrupt overlapping IP fragment count. Non-zero triggers kernel crash exploits (`teardrop`, `pod`). Zero in normal traffic.
- `urgent`: Urgent out-of-band packet count. Rare URG flag marker in interactive protocols.
- `hot`: Sensitive action count. Spikes when intruder enters system directories, accesses sensitive files, or executes programs.

### 2.2 Content features (12)

| # | Feature | Type | Encoding | Distinct (train) | Zeros | Skew | AUC | KS | Notes |
|---|---|---|---|---|---|---|---|---|---|
| 11 | `num_failed_logins` | integer | StandardScaler | 6 | 99.9% | 53.8 | 0.500 | 0.020 | Rare; R2L signal |
| 12 | `logged_in` | binary | StandardScaler | 2 | 60.4% | 0.4 | 0.838 | 0.046 | One of the strongest single features |
| 13 | `num_compromised` | integer | StandardScaler | 88 | 99.0% | 250.1 | 0.505 | 0.006 | r = 0.999 with `num_root` |
| 14 | `root_shell` | binary | StandardScaler | 2 | 99.9% | 27.2 | 0.501 | 0.001 | U2R signal |
| 15 | `su_attempted` | integer (0/1/2) | StandardScaler | 3 | 99.9% | 42.4 | 0.501 | 0.000 | Value 2 in 59 train / 2 test rows, all normal; kept as recorded |
| 16 | `num_root` | integer | StandardScaler | 82 | 99.5% | 236.9 | 0.505 | 0.003 | Near-duplicate of `num_compromised` |
| 17 | `num_file_creations` | integer | StandardScaler | 35 | 99.8% | 55.7 | 0.502 | 0.000 | |
| 18 | `num_shells` | integer | StandardScaler | 3 | >99.9% | 59.6 | 0.500 | 0.000 | Near-constant |
| 19 | `num_access_files` | integer | StandardScaler | 10 | 99.7% | 45.6 | 0.503 | 0.000 | |
| 20 | `num_outbound_cmds` | integer | StandardScaler | **1** | 100% | – | 0.500 | 0.000 | **Constant (always 0)**; kept, contributes nothing |
| 21 | `is_host_login` | binary | StandardScaler | 2 | >99.9% | 354.9 | 0.500 | 0.000 | 1 train row = 1 |
| 22 | `is_guest_login` | binary | StandardScaler | 2 | 99.1% | 10.2 | 0.504 | 0.019 | Mostly `warezclient` |

**Feature definitions (caveman format):**
- `num_failed_logins`: Failed password attempts. Flags dictionary brute-force (`guess_passwd`). Key R2L indicator.
- `logged_in`: 1 if session authentication passed; 0 if rejected or non-login. Strongest binary discriminator (AUC 0.838).
- `num_compromised`: System distress alerts (path traversal, file manipulation). Tracks exploit execution.
- `root_shell`: 1 if session spawned superuser root shell. Primary signature for U2R exploits (`buffer_overflow`, `rootkit`).
- `su_attempted`: 1 if `su root` command invoked. Stray value 2 on 59 normal rows; kept as recorded.
- `num_root`: Privileged operations executed as root user. Redundant with `num_compromised` (r = 0.999).
- `num_file_creations`: Files written to target disk. Spikes when attacker drops exploit payload, backdoors, or staging scripts.
- `num_shells`: Command interpreter shells opened. Positive count flags interactive terminal control.
- `num_access_files`: Edits to permission databases (`/etc/passwd`, `/etc/shadow`, `.rhosts`). Flags privilege escalation and persistence.
- `num_outbound_cmds`: Outbound FTP commands. Exactly 0 across all NSL-KDD rows. Dead constant feature kept for 41-column compliance.
- `is_host_login`: 1 if logged in directly as admin host account. Rare administrative marker (1 train row, 11 test rows).
- `is_guest_login`: 1 if session authenticated via guest account. Primary marker for anonymous access (`warezclient`).

### 2.3 Time-based traffic features: connections in the past 2 seconds (9)

| # | Feature | Type | Encoding | Distinct (train) | Zeros | Skew | AUC | KS | Notes |
|---|---|---|---|---|---|---|---|---|---|
| 23 | `count` | integer, 0–511 | StandardScaler | 512 | 0.0% | 1.5 | 0.821 | 0.084 | Same-host connections; DoS floods hit the cap |
| 24 | `srv_count` | integer, 0–511 | StandardScaler | 509 | 0.0% | 4.7 | 0.559 | 0.062 | Same-service connections |
| 25 | `serror_rate` | rate [0, 1] | StandardScaler | 89 | 68.9% | 1.0 | 0.806 | 0.185 | SYN-error cluster (see §5.3) |
| 26 | `srv_serror_rate` | rate [0, 1] | StandardScaler | 86 | 70.5% | 1.0 | 0.789 | 0.181 | r = 0.993 with `serror_rate` |
| 27 | `rerror_rate` | rate [0, 1] | StandardScaler | 82 | 87.1% | 2.3 | 0.587 | 0.130 | REJ errors |
| 28 | `srv_rerror_rate` | rate [0, 1] | StandardScaler | 62 | 87.1% | 2.3 | 0.582 | 0.124 | r = 0.989 with `rerror_rate` |
| 29 | `same_srv_rate` | rate [0, 1] | StandardScaler | 101 | 2.2% | −0.6 | 0.874 | 0.095 | Strong single feature |
| 30 | `diff_srv_rate` | rate [0, 1] | StandardScaler | 95 | 60.5% | 4.4 | 0.845 | 0.098 | |
| 31 | `srv_diff_host_rate` | rate [0, 1] | StandardScaler | 60 | 77.5% | 2.9 | 0.637 | 0.014 | |

**Feature definitions (caveman format):**
- `count`: Connections to same destination IP in last 2 seconds. Caps at 511. Spikes during high-rate DoS floods (`smurf`, `neptune`).
- `srv_count`: Connections to same service port in last 2 seconds. Caps at 511. Distinguishes single-service flood from broad sweep.
- `serror_rate`: Share of same-host connections with SYN errors (no ACK). Flags half-open SYN flooding and uncompleted connections.
- `srv_serror_rate`: Share of same-service connections with SYN errors. Redundant with `serror_rate` (r = 0.993).
- `rerror_rate`: Share of same-host connections ending in REJ. Non-zero when scanner probes closed ports.
- `srv_rerror_rate`: Share of same-service connections ending in REJ. Redundant with `rerror_rate` (r = 0.989).
- `same_srv_rate`: Share of connections targeting same service. High in concentrated floods; low in multi-port scans.
- `diff_srv_rate`: Share of connections targeting different services. Elevated in horizontal port scans.
- `srv_diff_host_rate`: Share of same-service connections coming from different client hosts. Detects distributed multi-source scans.

### 2.4 Host-based traffic features: last 100 connections to the same host (10)

| # | Feature | Type | Encoding | Distinct (train) | Zeros | Skew | AUC | KS | Notes |
|---|---|---|---|---|---|---|---|---|---|
| 32 | `dst_host_count` | integer, 0–255 | StandardScaler | 256 | 0.0% | −0.8 | 0.707 | 0.061 | |
| 33 | `dst_host_srv_count` | integer, 0–255 | StandardScaler | 256 | 0.0% | 0.3 | 0.892 | 0.111 | Second-highest univariate AUC |
| 34 | `dst_host_same_srv_rate` | rate [0, 1] | StandardScaler | 101 | 5.5% | −0.0 | 0.865 | 0.105 | |
| 35 | `dst_host_diff_srv_rate` | rate [0, 1] | StandardScaler | 101 | 37.3% | 3.6 | 0.827 | 0.104 | |
| 36 | `dst_host_same_src_port_rate` | rate [0, 1] | StandardScaler | 101 | 50.0% | 2.1 | 0.630 | 0.064 | |
| 37 | `dst_host_srv_diff_host_rate` | rate [0, 1] | StandardScaler | 75 | 69.0% | 5.5 | 0.682 | 0.041 | |
| 38 | `dst_host_serror_rate` | rate [0, 1] | StandardScaler | 101 | 64.6% | 1.0 | 0.811 | 0.203 | Second-most shifted feature |
| 39 | `dst_host_srv_serror_rate` | rate [0, 1] | StandardScaler | 100 | 67.8% | 1.0 | 0.783 | 0.197 | |
| 40 | `dst_host_rerror_rate` | rate [0, 1] | StandardScaler | 101 | 81.9% | 2.3 | 0.583 | **0.226** | **Most shifted feature** between train and test |
| 41 | `dst_host_srv_rerror_rate` | rate [0, 1] | StandardScaler | 101 | 84.6% | 2.3 | 0.573 | 0.168 | |

**Feature definitions (caveman format):**
- `dst_host_count`: Accumulated connections to same destination host (capped at 255). Measures long-term target traffic density.
- `dst_host_srv_count`: Accumulated connections to same destination host and service (capped at 255). Second-highest univariate AUC (0.892).
- `dst_host_same_srv_rate`: Share of last 100 connections targeting same service. Tracks persistent service focus.
- `dst_host_diff_srv_rate`: Share of last 100 connections targeting different services. High during slow, stealthy port sweeps.
- `dst_host_same_src_port_rate`: Share of connections coming from identical source port. Port-scan signature.
- `dst_host_srv_diff_host_rate`: Share of same-service connections originating from distinct source IPs. Flags distributed scans.
- `dst_host_serror_rate`: Share of last 100 connections with SYN errors. Tracks lingering SYN flood backlog (KS = 0.203).
- `dst_host_srv_serror_rate`: Share of last 100 host+service connections with SYN errors.
- `dst_host_rerror_rate`: Share of last 100 connections with REJ errors. Most shifted feature between train and test (KS = 0.226).
- `dst_host_srv_rerror_rate`: Share of last 100 host+service connections with REJ errors.

**Type counts:** 3 categorical, 38 numeric (of which 6 are binary flags: `land`, `logged_in`, `root_shell`, `is_host_login`, `is_guest_login`, and `su_attempted`, which is binary by definition but holds a stray value 2).

---

## 3. Columns that are never model inputs

| Column | What it is | How it is used | Why it is excluded |
|---|---|---|---|
| `label` (`class` in headered files) | Attack name or `normal` | Source of both targets; defines seen vs unseen attack types | It *is* the answer |
| `is_intrusion` | 0 = normal, 1 = attack (derived) | Binary target `y` | Target |
| `attack_category` | DoS / Probe / R2L / U2R / Normal (derived via `ATTACK_MAPPING`) | Evaluation slices only (per-category recall) | Derived from the label |
| `difficulty_level` | Number of 21 reference learners that classified the record correctly (0–21) | Not used anywhere in the models; kept for possible post-hoc analysis | Computed from labels and model outcomes; on its own it separates attack from normal with ROC-AUC 0.763 on KDDTrain+, a direct leak |

**How this is enforced in code (not just by convention):**
- `split_features_target()` selects exactly the 41 names in `FEATURE_COLUMNS` and raises an error if any is missing.
- `create_preprocessor()` raises `ValueError` if any column in `DISALLOWED_COLUMNS` (`label`, `difficulty_level`, `is_intrusion`, `attack_category`, `attack`, `difficulty`) is passed, and if the input does not have exactly 41 columns.
- `tests/test_data_pipeline.py` checks both guards (`test_disallowed_columns_in_preprocessor`, `test_invalid_feature_count_raises_value_error`).

---

## 4. The preprocessing pipeline

```python
ColumnTransformer([
    ("categorical", OneHotEncoder(handle_unknown="ignore"), ["protocol_type", "service", "flag"]),
    ("numerical",   StandardScaler(),                       <the other 38 features>),
])
```

### 4.1 Categorical features → 84 one-hot columns

| Feature | Levels in KDDTrain+ | Output columns | Unseen levels in KDDTest+ |
|---|---|---|---|
| `protocol_type` | 3 | 3 | none |
| `service` | 70 | 70 | none (test uses 63 of the 70; 7 services occur only in training: `aol`, `harvest`, `http_2784`, `http_8001`, `red_i`, `tftp_u`, `urh_i`) |
| `flag` | 11 | 11 | none |

- **`handle_unknown="ignore"`:** a category not seen when fitting becomes an all-zero row instead of an error. It never triggers on KDDTest+, but it matters inside cross-validation folds, where a rare service can be absent from a fold's training part.
- **No rare-level grouping:** all 70 services keep their own column, including 9 with fewer than 50 training rows. Rare services can be attack-specific, and grouping would hide that.
- Output names follow scikit-learn's `<feature>_<level>` pattern (e.g. `protocol_type_tcp`, `service_http`, `flag_SF`) and are saved in `scalars/preprocessor_feature_names.json`. The 84 one-hot columns come first, then the 38 numeric columns in their original order.

### 4.2 Numeric features → 38 standardised columns

Each numeric feature is transformed to `z = (x − mean_train) / sd_train`, with mean and standard deviation learned on the training rows only.
- The constant `num_outbound_cmds` has standard deviation 0; scikit-learn leaves it at 0, so it adds a column with no information and no effect on any model.
- Binary flags are standardised too. This changes nothing for tree models and puts them on the same scale as the other features for Logistic Regression.

### 4.3 Where the preprocessor is fitted

The preprocessor is part of every model's `Pipeline` (`cf.make_pipeline`):

| Step | Data the preprocessor is fitted on |
|---|---|
| Each tuning trial (notebooks 04–07) | The training part of each of the 5 leave-attack-types-out folds, refit for every fold of every trial |
| Known-attack CV (notebook 10) | The training part of each stratified fold |
| Final model | All of KDDTrain+ |
| Test evaluation | Never fitted; KDDTest+ is only transformed |

`scalars/preprocessor.joblib` (from notebook 02) is the same preprocessor fitted on all of KDDTrain+. It is identical to the one inside each saved model in `models/` and is kept for inspection and reuse; `tests/test_data_pipeline.py::test_persistence_and_notebook_compatibility` checks that a fresh fit reproduces it exactly.

### 4.4 How each model family uses the 122 columns

| Model | Effect of the preprocessing |
|---|---|
| Logistic Regression | Needs scaling: L2 regularisation penalises all coefficients equally, which is only fair when features share a scale. One-hot columns give each service and flag its own coefficient. |
| Decision Tree, Random Forest, XGBoost | Splits are invariant to monotonic transforms, so standardisation does not change which splits are possible. One-hot encoding lets a tree split on a single service or flag. |

Using one shared representation for all models is a deliberate choice for fairness; §6 lists what a per-model pipeline could add.

---

## 5. Feature engineering decisions

### 5.1 Decisions and their evidence

| # | Decision | Evidence (from `notebooks/01_data_exploration.ipynb`, `results/eda/eda_summary.json`) | Rationale |
|---|---|---|---|
| 1 | Keep all 41 predictors | 1 constant and 10 near-constant (≥ 99.5% one value) features | Near-constant content flags (`root_shell`, `num_failed_logins`, `su_attempted`, …) are the main evidence for rare R2L/U2R attacks. The constant column carries no weight. One identical input for every model. |
| 2 | Exclude `difficulty_level`, label and derived targets | `difficulty_level` alone reaches ROC-AUC 0.763 | Leakage (§3) |
| 3 | One-hot encode all categorical levels | 70 services, 9 with < 50 training rows; no unseen test levels | Rare services can be attack-specific; no grouping needed for unseen levels |
| 4 | Standardise numeric features, no log transform | Extreme skew: `is_host_login` 354.9, `dst_bytes` 290.0, `num_compromised` 250.1, `src_bytes` 190.7 | Same transform for every model; trees are unaffected. Log transforms would only help the linear model (see §6). |
| 5 | Keep correlated features | 10 pairs with \|r\| > 0.95 (§5.3) | Identical input for every model; L2 regularisation and trees cope with redundancy. Dropping members of a pair was tried earlier (§5.2) and removed. |
| 6 | Keep `su_attempted` as recorded | Value 2 in 59 train / 2 test rows; all normal traffic, all with `root_shell = 1` | No re-coding of raw values; the stray value affects 61 rows |
| 7 | No feature selection | Top MI features: `src_bytes` 0.564, `service` 0.465, `dst_bytes` 0.440, `diff_srv_rate` 0.363, `flag` 0.361; near-zero MI for 7 rare flags | Selecting on train-set relevance would remove the rare-attack flags, which matter most for the minority classes; regularisation and tree splits handle irrelevant features |
| 8 | No resampling (SMOTE etc.) | Train is 46.5% attack | The binary task is close to balanced; oversampling training attack types cannot create the unseen test types |
| 9 | No outlier removal or clipping | Outliers are attack-enriched in 11 of 24 numeric features | Extreme values are real behaviour (floods, large transfers), not errors |

### 5.2 Feature engineering that was tried and removed

An earlier, separate pipeline (removed from the repository during the protocol revision; see `docs/methodology.md` §10) applied model-specific engineering. It produced **107** features instead of 122:

| Earlier step | What it did | Why it was removed |
|---|---|---|
| `log1p` on counts and bytes (linear model only) | Compressed heavy tails | Gave Logistic Regression a different input from the trees, so model differences mixed with input differences |
| `CorrelationFilter(threshold=0.98)` fitted per fold | Dropped one member of each \|r\| ≥ 0.98 pair (on full train: `num_root`, `srv_serror_rate`, `srv_rerror_rate`, `dst_host_srv_serror_rate`) | Same reason; also unnecessary for regularised and tree models |
| `OneHotEncoder(min_frequency=50, handle_unknown="infrequent_if_exist")` | Merged rare services into one "infrequent" column | Hid rare, possibly attack-specific services |
| Map `su_attempted` 2 → 1, drop `num_outbound_cmds` | Cleaned two quirks | Re-coding raw values gave little benefit and differed between pipelines |

The controlled pipeline replaced all of this with the single shared preprocessor in §4 so that every model sees exactly the same 122 columns.

### 5.3 Redundant feature groups (kept on purpose)

Pairs with \|r\| > 0.95 on KDDTrain+:

| Feature A | Feature B | r |
|---|---|---|
| `num_compromised` | `num_root` | 0.999 |
| `serror_rate` | `srv_serror_rate` | 0.993 |
| `rerror_rate` | `srv_rerror_rate` | 0.989 |
| `srv_serror_rate` | `dst_host_srv_serror_rate` | 0.986 |
| `dst_host_serror_rate` | `dst_host_srv_serror_rate` | 0.985 |
| `serror_rate` | `dst_host_srv_serror_rate` | 0.981 |
| `serror_rate` | `dst_host_serror_rate` | 0.979 |
| `srv_serror_rate` | `dst_host_serror_rate` | 0.978 |
| `srv_rerror_rate` | `dst_host_srv_rerror_rate` | 0.970 |
| `rerror_rate` | `dst_host_srv_rerror_rate` | 0.964 |

Most of them form a **SYN-error cluster** (`serror_rate`, `srv_serror_rate`, `dst_host_serror_rate`, `dst_host_srv_serror_rate`) that captures SYN-flood behaviour such as `neptune`; the REJ-error features form a second, smaller cluster.

### 5.4 Distribution shift between KDDTest+ and KDDTrain+

- Mean KS statistic across numeric features: **0.072** on all rows, **0.044** on normal traffic only. Most of the shift comes from the different (and novel) attack mix, not from normal traffic changing.
- Most shifted features: `dst_host_rerror_rate` 0.226, `dst_host_serror_rate` 0.203, `dst_host_srv_serror_rate` 0.197, `serror_rate` 0.185, `srv_serror_rate` 0.181. These are the error-rate features tied to scanning and flooding attacks.
- No categorical level appears only in the test set.

This shift is part of why thresholds chosen on training data overshoot their false-positive target on the test set (see the website's "Operating points" section and `results/tables/deployable_operating_points.md`).

---

## 6. Limitations and possible extensions

- **No feature attribution was performed.** The study does not report which features drive each model's decisions or explain *why* a model misses an unseen attack type. SHAP or permutation importance on the saved models would be the next step.
- **Heavy tails for the linear model.** Standardisation does not tame `src_bytes` / `dst_bytes` tails; a `log1p` step inside the Logistic Regression pipeline could help it, at the cost of no longer giving every model identical input.
- **Window features are pre-computed.** The 2-second and 100-connection features come with the dataset; their window sizes cannot be tuned, and they would need to be recomputed from raw traffic in a live deployment.
- **Content features depend on payload inspection**, which may be unavailable on encrypted traffic in modern networks.
- **`num_outbound_cmds` is constant** in NSL-KDD and adds a dead column; it is kept only so the feature set matches the standard 41.

---

## 7. How to change the features

1. **Feature lists and groups:** `COLUMN_NAMES`, `FEATURE_COLUMNS` and `FEATURE_GROUPS` in `src/data_loader.py`.
2. **Excluded columns:** `DISALLOWED_COLUMNS` in `src/preprocessing.py`.
3. **Transforms:** `create_preprocessor()` in `src/preprocessing.py`. Because it sits inside every model's pipeline, a change applies to all models and is refit inside every fold automatically.
4. **Rerun** `notebooks/02_preprocessing.ipynb` (saves the new preprocessor and feature names), then notebooks 03–11, then `pytest -q tests`. The tests assume 41 inputs and 122 outputs, so update them if the output width changes.
