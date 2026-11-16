| test | pair | p_raw | p_holm | significant_holm_05 | effect | ci_95 |
|---|---|---|---|---|---|---|
| mcnemar_full | logistic_regression_vs_decision_tree | 7.31e-122 | 2.56e-120 | True | 551 |  |
| mcnemar_full | logistic_regression_vs_random_forest | 3.05e-64 | 1.04e-62 | True | 286 |  |
| mcnemar_full | logistic_regression_vs_xgboost | 1.21e-131 | 4.35e-130 | True | 596 |  |
| mcnemar_full | decision_tree_vs_random_forest | 6.28e-15 | 1.88e-13 | True | 60.8 |  |
| mcnemar_full | decision_tree_vs_xgboost | 0.323 | 0.612 | False | 0.978 |  |
| mcnemar_full | random_forest_vs_xgboost | 6.29e-24 | 1.95e-22 | True | 102 |  |
| mcnemar_unseen | logistic_regression_vs_decision_tree | 1.57e-13 | 4.56e-12 | True | 54.5 |  |
| mcnemar_unseen | logistic_regression_vs_random_forest | 1.42e-10 | 3.97e-09 | True | 41.1 |  |
| mcnemar_unseen | logistic_regression_vs_xgboost | 0.0671 | 0.434 | False | 3.35 |  |
| mcnemar_unseen | decision_tree_vs_random_forest | 2.6e-42 | 8.59e-41 | True | 186 |  |
| mcnemar_unseen | decision_tree_vs_xgboost | 6.49e-26 | 2.08e-24 | True | 111 |  |
| mcnemar_unseen | random_forest_vs_xgboost | 8.16e-09 | 2.2e-07 | True | 33.2 |  |
| paired_bootstrap:macro_f1 | logistic_regression_vs_decision_tree | 0.001 | 0.026 | True | -0.0441 | [-0.0476, -0.0405] |
| paired_bootstrap:unseen_recall_pp | logistic_regression_vs_decision_tree | 0.001 | 0.026 | True | -5.42 | [-6.7925, -4.0585] |
| paired_bootstrap:auc_unseen_vs_normal | logistic_regression_vs_decision_tree | 0.001 | 0.026 | True | 0.149 | [0.1396, 0.1598] |
| paired_bootstrap:unseen_recall_at_test_fpr_2pct_pp | logistic_regression_vs_decision_tree | 0.001 | 0.026 | True | -8.46 | [-10.1236, -1.1736] |
| paired_bootstrap:macro_f1 | logistic_regression_vs_random_forest | 0.001 | 0.026 | True | -0.0324 | [-0.0362, -0.0287] |
| paired_bootstrap:unseen_recall_pp | logistic_regression_vs_random_forest | 0.001 | 0.026 | True | 4.95 | [3.4294, 6.4316] |
| paired_bootstrap:auc_unseen_vs_normal | logistic_regression_vs_random_forest | 0.001 | 0.026 | True | -0.0586 | [-0.0626, -0.0545] |
| paired_bootstrap:unseen_recall_at_test_fpr_2pct_pp | logistic_regression_vs_random_forest | 0.001 | 0.026 | True | -3.98 | [-5.3167, -2.93] |
| paired_bootstrap:macro_f1 | logistic_regression_vs_xgboost | 0.001 | 0.026 | True | -0.0453 | [-0.0488, -0.0418] |
| paired_bootstrap:unseen_recall_pp | logistic_regression_vs_xgboost | 0.065 | 0.434 | False | 1.21 | [-0.0271, 2.4693] |
| paired_bootstrap:auc_unseen_vs_normal | logistic_regression_vs_xgboost | 0.001 | 0.026 | True | -0.0635 | [-0.0676, -0.0595] |
| paired_bootstrap:unseen_recall_at_test_fpr_2pct_pp | logistic_regression_vs_xgboost | 0.142 | 0.568 | False | -2.21 | [-3.3692, 0.1837] |
| paired_bootstrap:macro_f1 | decision_tree_vs_random_forest | 0.001 | 0.026 | True | 0.0116 | [0.0088, 0.0144] |
| paired_bootstrap:unseen_recall_pp | decision_tree_vs_random_forest | 0.001 | 0.026 | True | 10.4 | [8.9025, 11.7142] |
| paired_bootstrap:auc_unseen_vs_normal | decision_tree_vs_random_forest | 0.001 | 0.026 | True | -0.208 | [-0.2177, -0.1981] |
| paired_bootstrap:unseen_recall_at_test_fpr_2pct_pp | decision_tree_vs_random_forest | 0.187 | 0.568 | False | 4.48 | [-2.3644, 6.5498] |
| paired_bootstrap:macro_f1 | decision_tree_vs_xgboost | 0.306 | 0.612 | False | -0.0013 | [-0.0038, 0.0013] |
| paired_bootstrap:unseen_recall_pp | decision_tree_vs_xgboost | 0.001 | 0.026 | True | 6.63 | [5.4718, 7.8021] |
| paired_bootstrap:auc_unseen_vs_normal | decision_tree_vs_xgboost | 0.001 | 0.026 | True | -0.213 | [-0.2228, -0.2028] |
| paired_bootstrap:unseen_recall_at_test_fpr_2pct_pp | decision_tree_vs_xgboost | 0.062 | 0.434 | False | 6.24 | [-0.3224, 9.3866] |
| paired_bootstrap:macro_f1 | random_forest_vs_xgboost | 0.001 | 0.026 | True | -0.0129 | [-0.0155, -0.0105] |
| paired_bootstrap:unseen_recall_pp | random_forest_vs_xgboost | 0.001 | 0.026 | True | -3.73 | [-4.969, -2.4965] |
| paired_bootstrap:auc_unseen_vs_normal | random_forest_vs_xgboost | 0.001 | 0.026 | True | -0.0049 | [-0.0071, -0.0028] |
| paired_bootstrap:unseen_recall_at_test_fpr_2pct_pp | random_forest_vs_xgboost | 0.002 | 0.026 | True | 1.77 | [0.7737, 3.7721] |
