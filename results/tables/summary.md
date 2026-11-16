**Primary seed (42), KDDTest+:**

- **Logistic Regression**: unseen-vs-normal AUC 0.8831, unseen recall @2% test FPR 5.4%, seen-vs-normal AUC 0.8854; at 0.5: FPR 7.24%, unseen recall 29.5%
- **Decision Tree**: unseen-vs-normal AUC 0.7336, unseen recall @2% test FPR 14.6%, seen-vs-normal AUC 0.9465; at 0.5: FPR 2.99%, unseen recall 35.0%
- **Random Forest**: unseen-vs-normal AUC 0.9417, unseen recall @2% test FPR 9.3%, seen-vs-normal AUC 0.9752; at 0.5: FPR 2.72%, unseen recall 24.6%
- **XGBoost**: unseen-vs-normal AUC 0.9466, unseen recall @2% test FPR 7.9%, seen-vs-normal AUC 0.9629; at 0.5: FPR 2.57%, unseen recall 28.3%

**Across 5 seeds (mean ± SD):**

- **Logistic Regression**: unseen-vs-normal AUC 0.8831 ± 0.0001; unseen recall @2% test FPR 5.4% ± 0.0
- **Decision Tree**: unseen-vs-normal AUC 0.7456 ± 0.0277; unseen recall @2% test FPR 16.6% ± 4.7
- **Random Forest**: unseen-vs-normal AUC 0.9410 ± 0.0037; unseen recall @2% test FPR 8.4% ± 1.4
- **XGBoost**: unseen-vs-normal AUC 0.9432 ± 0.0048; unseen recall @2% test FPR 6.9% ± 1.4

**Paired bootstrap Δ AUC (unseen vs normal), Holm-adjusted p:**

- logistic_regression_vs_decision_tree: +0.1495 [0.1396, 0.1598], p_holm = 0.026
- logistic_regression_vs_random_forest: -0.0586 [-0.0626, -0.0545], p_holm = 0.026
- logistic_regression_vs_xgboost: -0.0635 [-0.0676, -0.0595], p_holm = 0.026
- decision_tree_vs_random_forest: -0.2081 [-0.2177, -0.1981], p_holm = 0.026
- decision_tree_vs_xgboost: -0.2130 [-0.2228, -0.2028], p_holm = 0.026
- random_forest_vs_xgboost: -0.0049 [-0.0071, -0.0028], p_holm = 0.026
