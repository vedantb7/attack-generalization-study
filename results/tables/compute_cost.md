| model | tuning_minutes_seed42 | tuning_minutes_all_seeds | final_fit_seconds | batch_us_per_flow | batch_us_iqr | single_flow_ms | single_flow_ms_iqr | model_size_kb | unseen_auc | known_cv_auc |
|---|---|---|---|---|---|---|---|---|---|---|
| Logistic Regression | 4.1500 | 12.5800 | 2.9840 | 1.3700 | [1.28, 2.18] | 3.4500 | [3.1, 3.85] | 4.2000 | 0.8831 | 0.9924 |
| Decision Tree | 0.9400 | 4.4200 | 1.5450 | 0.9700 | [0.95, 1.04] | 3.3300 | [3.13, 3.63] | 5.1000 | 0.7336 | 0.9988 |
| Random Forest | 6.8200 | 42.1700 | 3.9830 | 5.3000 | [4.5, 5.91] | 45.9600 | [39.78, 50.06] | 2920.2000 | 0.9417 | 1.0000 |
| XGBoost | 4.1300 | 21.1700 | 2.0050 | 2.4100 | [1.99, 3.35] | 17.9800 | [5.08, 22.14] | 92.2000 | 0.9466 | 0.9998 |
