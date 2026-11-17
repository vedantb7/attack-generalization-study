| model | known_roc_auc | unseen_roc_auc | known_recall_at_fpr_1pct | unseen_recall_at_fpr_1pct | known_recall_at_fpr_5pct | unseen_recall_at_fpr_5pct | known_attack_recall_at_0.5 | unseen_recall_at_0.5 | known_fpr_at_95_recall | unseen_fpr_at_95_recall | auc_gap | recall_gap_at_fpr_1pct_pp | recall_gap_at_0.5_pp |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Logistic Regression | 0.9924 | 0.8831 | 0.9373 | 0.0523 | 0.9750 | 0.0720 | 0.9529 | 0.2955 | 0.0199 | 0.2294 | 0.1092 | 88.5052 | 65.7391 |
| Decision Tree | 0.9988 | 0.7336 | 0.9782 | 0.0667 | 0.9964 | 0.3563 | 0.9782 | 0.3496 | 0.0037 | 1.0000 | 0.2652 | 91.1570 | 62.8602 |
| Random Forest | 1.0000 | 0.9417 | 0.9999 | 0.0717 | 1.0000 | 0.6333 | 0.9977 | 0.2461 | 0.0000 | 0.1249 | 0.0583 | 92.8147 | 75.1649 |
| XGBoost | 0.9998 | 0.9466 | 0.9977 | 0.0515 | 0.9987 | 0.8216 | 0.9942 | 0.2832 | 0.0000 | 0.1920 | 0.0532 | 94.6197 | 71.0967 |
