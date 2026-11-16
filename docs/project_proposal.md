# 📋 Project Proposal: Signature Memorization vs. Unseen Attack Generalization

**Course:** ES 335: Machine Learning (IIT Gandhinagar)  
**Project Title:** Signature Memorization vs. Unseen Attack Generalization in Network Intrusion Detection  
**Team Members:**  
- **Vedant:** Data Loading, Preprocessing Pipeline, Majority-Class Baseline, Random Forest Classifier, Interactive Demonstration Website (deferred)  
- **Dhruv Meshram:** Exploratory Data Analysis, Logistic Regression, Decision Tree Classifier, Comparative Evaluation & Statistical Analysis  

---

## 1. Executive Summary & Research Motivation

Machine Learning-based Network Intrusion Detection Systems (NIDS) routinely achieve $> 98\%$ accuracy on static academic benchmarks. However, in operational cybersecurity, classifiers suffer catastrophic performance degradation when confronted with previously unseen attacks. 

A central question in applied machine learning is:
> *Do complex, highly expressive models primarily memorize training attack signatures rather than learning invariant representations of anomalous traffic, and can simpler, regularized models generalize more robustly to unseen attack signatures?*

This project investigates the empirical trade-off between **in-distribution signature memorization** and **out-of-distribution unseen attack generalization** using the canonical NSL-KDD benchmark.

---

## 2. Core Research Hypotheses

1. **Hypothesis 1 (The Memorization Penalty):** Complex ensemble models (e.g., Random Forests) will achieve superior precision and F1-scores on known attack types present in the training distribution, but will exhibit a steeper performance decline when evaluated on unseen attack types compared to simpler linear models.
2. **Hypothesis 2 (Regularization Benefit):** Simpler linear models with explicit regularizers (e.g., $L_1$/$L_2$ Logistic Regression) establish smoother decision boundaries that prevent overfitting to specific port/service combinations, yielding more resilient recall on novel attack signatures.
3. **Hypothesis 3 (Distribution Inversion Sensitivity):** Because the test set experiences an empirical class inversion ($53.46\%$ normal in training vs. $56.93\%$ attack in testing), classifiers evaluated by raw accuracy will provide misleading performance estimates; Macro F1-score and Precision-Recall AUC (PR-AUC) are necessary to capture true intrusion detection utility.

---

## 3. Dataset & Experimental Setup

### Dataset: NSL-KDD
- **Training Set (`KDDTrain+.csv`):** 125,973 network connection records.
- **Testing Set (`KDDTest+.csv`):** 22,543 records.
- **Predictor Features:** 41 traffic descriptors (10 Basic, 12 Content, 9 Time-based Traffic, 10 Host-based Traffic).
- **Target Attributes:** 1 categorical attack label (`label`), 1 difficulty score (`difficulty_level`, strictly excluded from model features).

### Unseen Attack Signatures
The official NSL-KDD test set contains **17 distinct attack types** that never appear in the training set:
- *DoS:* `apache2`, `mailbomb`, `processtable`, `udpstorm`
- *Probe:* `mscan`, `saint`
- *R2L:* `httptunnel`, `named`, `sendmail`, `snmpgetattack`, `snmpguess`, `worm`, `xlock`, `xsnoop`
- *U2R:* `ps`, `sqlattack`, `xterm`

### Methodological Guardrail
> [!IMPORTANT]
> We explicitly do **not** claim genuine real-world zero-day detection based solely on the NSL-KDD dataset. NSL-KDD is a curated benchmark; unseen attack types represent controlled out-of-distribution signatures within the benchmark environment.

---

## 4. Model Spectrum & Experimental Workflow

We evaluate a complexity spectrum on the exact same standardized feature representation ($122$ features after one-hot encoding and standardization). The list below is the implemented version; the original plan also considered $L_1$ for Logistic Regression and cost-complexity pruning for the tree, which were replaced by an $L_2$ strength sweep and depth / leaf-size tuning.

1. **Zero-Rule Baseline:** Majority-Class Classifier (`DummyClassifier(strategy="most_frequent")`).
2. **Linear Regularized Model:** Logistic Regression ($L_2$ penalty, tuned regularization strength $C$).
3. **Interpretable Tree Model:** Decision Tree (tuned depth, split and leaf sizes, criterion).
4. **Bagged Ensemble:** Random Forest (bootstrap + feature subsampling, tuned depth and leaf sizes).
5. **Boosted Ensemble:** XGBoost (gradient-boosted trees, tuned depth, learning rate and regularisation).

Every model is tuned with leave-attack-types-out CV inside `KDDTrain+` (held-out attack types vs held-out normals, ROC-AUC), uses `class_weight=None`, and is run end to end over 5 seeds (see `docs/methodology.md` §8).

All models are evaluated under:
- **Global Evaluation:** Binary Intrusion Classification (ROC-AUC, PR-AUC, Macro F1, Precision, Recall, FPR), threshold-free, at matched false-positive rates and at threshold 0.5.
- **Stratified Attack Analysis:** Performance across the 5 DARPA categories (`Normal`, `DoS`, `Probe`, `R2L`, `U2R`).
- **Unseen Attack Generalization Audit:** Disaggregated detection rate on the 17 novel attack signatures vs. the 20 seen attack types present in the test set (22 attack types occur in training; `spy` and `warezclient` never appear in the test set).

---

## 5. Deliverables & Milestones

- [x] **Milestone 1:** Exploratory Data Analysis & statistical distributions report (`notebooks/01_data_exploration.ipynb`, `docs/dataset_notes.md`).
- [x] **Milestone 2:** Standardized data loading & anti-leakage preprocessing module (`src/data_loader.py`, `src/preprocessing.py`, `tests/test_data_pipeline.py`).
- [x] **Milestone 3:** Majority-class baseline implementation & benchmark metric storage (`notebooks/03_majority_baseline.ipynb`, `results/metrics/majority_baseline.json`).
- [x] **Milestone 4:** Implementation and hyperparameter tuning for Logistic Regression, Decision Tree, and Random Forest (`notebooks/04_logistic_regression.ipynb`, `05_decision_tree.ipynb`, `06_random_forest.ipynb`, helpers in `src/controlled_framework.py`).
- [x] **Milestone 5:** Comparative generalization audit and statistical significance analysis (`notebooks/08_evaluation_comparison.ipynb`, with XGBoost in `notebooks/07_xgboost.ipynb` and the capacity sweep in `notebooks/09_capacity_analysis.ipynb`).
- [x] **Milestone 6a:** Methodology consolidation (`docs/methodology.md`, `README.md`).
- [ ] **Milestone 6b:** Final report and interactive results website (`website/`, deferred).

---

## 6. Outcome of the Hypotheses

Results from `notebooks/08_evaluation_comparison.ipynb` and `notebooks/09_capacity_analysis.ipynb` (details in `README.md` §8–9 and `docs/methodology.md` §9).

| Hypothesis | Outcome | Evidence (KDDTest+, 5 seeds unless noted) |
|---|---|---|
| **H1 · Memorization penalty** | **Partly supported** | The ensembles are best on seen attacks (seen-vs-normal AUC: RF 0.975, XGBoost 0.963, DT 0.947, LR 0.885; seed 42) and lose more ranking quality on unseen attacks than LR (AUC drop 0.033 / 0.016 vs 0.002). But they still rank unseen attacks best in absolute terms (unseen-vs-normal AUC: RF 0.941, XGBoost 0.943, LR 0.883, DT 0.746), so the drop is not a collapse. |
| **H2 · Regularization benefit** | **Supported within LR, not across families** | Stronger $L_2$ raises LR's unseen-vs-normal AUC from 0.71 (`C`=100) to 0.88 (`C`=0.001), and a depth-4–6 tree beats a fully grown one. Regularised LR still ranks unseen attacks worse than either ensemble in every seed. |
| **H3 · Distribution-inversion sensitivity** | **Supported** | The majority baseline reaches 43.1% accuracy with zero attack recall. Model rankings at threshold 0.5 differ from rankings by AUC or at matched FPR, and thresholds calibrated on training normals overshoot the target FPR on test, by up to 10× (RF: 9.9% for a 1% target). |

