| model | roc_auc | pr_auc | auc_seen_vs_normal | auc_unseen_vs_normal | unseen_recall@test_fpr_1pct | unseen_recall@test_fpr_2pct | unseen_recall@test_fpr_5pct | macro_f1 | false_positive_rate | seen_recall | unseen_recall | generalization_drop_pp |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Majority Baseline | 0.5000 | 0.5693 | 0.5000 | 0.5000 | 0.0000 | 0.0000 | 0.0000 | 0.3011 | 0.0000 | 0.0000 | 0.0000 | 0.0000 |
| Logistic Regression | 0.8848 | 0.9156 | 0.8854 | 0.8831 | 0.0523 | 0.0539 | 0.0720 | 0.7358 | 0.0724 | 0.7152 | 0.2955 | 41.9700 |
| Decision Tree | 0.8843 | 0.9115 | 0.9465 | 0.7336 | 0.0667 | 0.1459 | 0.3563 | 0.7799 | 0.0299 | 0.7558 | 0.3496 | 40.6200 |
| Random Forest | 0.9654 | 0.9684 | 0.9752 | 0.9417 | 0.0717 | 0.0931 | 0.6333 | 0.7683 | 0.0272 | 0.7679 | 0.2461 | 52.1800 |
| XGBoost | 0.9581 | 0.9660 | 0.9629 | 0.9466 | 0.0515 | 0.0795 | 0.8216 | 0.7812 | 0.0257 | 0.7821 | 0.2832 | 49.8900 |
