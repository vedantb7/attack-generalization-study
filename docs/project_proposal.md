# 📋 Project Proposal: Signature Memorization vs. Unseen Attack Generalization

**Course:** ES 335: Machine Learning (IIT Gandhinagar)  
**Project Title:** Signature Memorization vs. Unseen Attack Generalization in Network Intrusion Detection  
**Team Members:**  
- **Vedant:** Data Loading, Preprocessing Pipeline, Majority-Class Baseline, Random Forest Classifier, Interactive Demonstration Website  
- **Dhruv:** Exploratory Data Analysis, Logistic Regression, Decision Tree Classifier, Comparative Evaluation & Statistical Analysis  

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

We evaluate a progressive complexity spectrum across the exact same standardized feature representation ($122$ features post one-hot encoding and standardization):

1. **Zero-Rule Baseline:** Majority-Class Classifier (`DummyClassifier(strategy="most_frequent")`).
2. **Linear Regularized Model:** Logistic Regression ($L_1$/$L_2$ penalty, tuned regularization strength $C$).
3. **Interpretable Tree Model:** Decision Tree (Cost-Complexity Pruning $\alpha$, maximum depth tuning).
4. **Non-Linear Ensemble:** Random Forest (Bagging + Feature Subsampling, calibrated tree depth).

All models will be evaluated under:
- **Global Evaluation:** Binary Intrusion Classification (Accuracy, Macro F1, Precision, Recall, PR-AUC).
- **Stratified Attack Analysis:** Performance across the 5 DARPA categories (`Normal`, `DoS`, `Probe`, `R2L`, `U2R`).
- **Unseen Attack Generalization Audit:** Disaggregated detection rate on the 17 novel attack signatures vs. the 22 known training attack signatures.

---

## 5. Deliverables & Milestones

- [x] **Milestone 1:** Exploratory Data Analysis & statistical distributions report (`notebooks/01_data_exploration.ipynb`, `docs/eda_report.md`).
- [x] **Milestone 2:** Standardized data loading & anti-leakage preprocessing module (`src/data_loader.py`, `src/preprocessing.py`, `tests/test_data_pipeline.py`).
- [x] **Milestone 3:** Majority-class baseline implementation & benchmark metric storage (`notebooks/03_majority_baseline.ipynb`, `results/metrics/majority_baseline.json`).
- [ ] **Milestone 4:** Implementation and hyperparameter tuning for Logistic Regression, Decision Tree, and Random Forest (`notebooks/04_...`, `05_...`, `06_...`).
- [ ] **Milestone 5:** Comparative generalization audit and statistical significance analysis (`notebooks/07_evaluation_comparison.ipynb`).
- [ ] **Milestone 6:** Final report, methodology consolidation, and interactive results website (`website/`).
