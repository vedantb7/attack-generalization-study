# 📚 Project References & Benchmark Literature

**Course:** ES 335: Machine Learning (IIT Gandhinagar)  
**Project:** Signature Memorization vs. Unseen Attack Generalization in Network Intrusion Detection  

---

## 1. Primary Benchmark Citations

1. **Tavallaee, M., Bagheri, E., Lu, W., & Ghorbani, A. A. (2009).**  
   *A Detailed Analysis of the KDD CUP 99 Data Set.*  
   Proceedings of the 2009 IEEE Symposium on Computational Intelligence for Security and Defense Applications (CISDA), Ottawa, ON, Canada, pp. 1–6.  
   *Significance:* Establishes the NSL-KDD dataset by removing redundant and duplicate records (~78% in train, ~75% in test) from KDD Cup 1999, creating balanced subsets (`KDDTrain+` and `KDDTest+`) with assigned difficulty levels.

2. **KDD Cup 1999 Dataset Archive (1999).**  
   *DARPA Intrusion Detection Evaluation Data.*  
   Information and Computer Science, University of California, Irvine.  
   URL: [http://kdd.ics.uci.edu/databases/kddcup99/kddcup99.html](http://kdd.ics.uci.edu/databases/kddcup99/kddcup99.html)  
   *Significance:* Original foundational DARPA/Lincoln Labs intrusion detection dataset from which the 41 network traffic features were derived.

---

## 2. Methodology & Intrusion Detection Literature

3. **Sommer, R., & Paxson, V. (2010).**  
   *Outside the Closed World: On Using Machine Learning for Network Intrusion Detection.*  
   2010 IEEE Symposium on Security and Privacy (S&P), Oakland, CA, USA, pp. 305–316.  
   *Significance:* Highlights the severe disparity between closed-world ML benchmark performance and real-world network traffic generalization, emphasizing why high accuracy on known attacks does not imply robustness to zero-day signatures.

4. **Ring, M., Wunderlich, S., Scheuring, D., Landes, D., & Hotho, A. (2019).**  
   *A Survey of Network-Based Intrusion Detection Data Sets.*  
   *Computers & Security*, 86, pp. 147–167.  
   *Significance:* Provides a comprehensive comparative analysis of modern vs. legacy network anomaly detection datasets, examining class imbalance, feature granularity, and synthetic network evaluation.

5. **Lakhina, A., Crovella, M., & Diot, C. (2005).**  
   *Mining Anomalies Using Traffic Feature Distributions.*  
   ACM SIGCOMM Computer Communication Review, 35(4), pp. 217–228.  
   *Significance:* Foundational perspective on distribution-based network anomaly profiling versus signature-based matching.

---

## 3. Machine Learning Algorithms & Optimization

6. **Breiman, L., Friedman, J. H., Olshen, R. A., & Stone, C. J. (1984).**  
   *Classification and Regression Trees.*  
   Wadsworth & Brooks/Cole Advanced Books & Software, Monterey, CA.  
   *Significance:* Foundational CART algorithm for greedy recursive binary partitioning, impurity minimization (Gini and entropy), and cost-complexity pruning.

7. **Breiman, L. (2001).**  
   *Random Forests.*  
   *Machine Learning*, 45(1), pp. 5–32.  
   *Significance:* Introduces bootstrap aggregation with random feature subspace sampling, establishing ensemble variance reduction over single decision trees.

8. **Akiba, T., Sano, S., Yanase, T., Ohta, T., & Koyama, M. (2019).**  
   *Optuna: A Next-generation Hyperparameter Optimization Framework.*  
   Proceedings of the 25th ACM SIGKDD International Conference on Knowledge Discovery & Data Mining (KDD '19), pp. 2623–2631.  
   *Significance:* Tree-structured Parzen Estimator (TPE) Bayesian hyperparameter search used for automated hyperparameter tuning under 5-fold cross-validation.

9. **Chen, T., & Guestrin, C. (2016).**  
    *XGBoost: A Scalable Tree Boosting System.*  
    Proceedings of the 22nd ACM SIGKDD International Conference on Knowledge Discovery and Data Mining, pp. 785–794.  
    *Significance:* Gradient-boosted tree ensemble used as the second high-capacity model (`notebooks/07_xgboost.ipynb`).

---

## 4. Statistical Testing & Resampling Methodology

10. **McNemar, Q. (1947).**  
   *Note on the sampling error of the difference between correlated proportions or percentages.*  
   *Psychometrika*, 12(2), pp. 153–157.  
   *Significance:* Non-parametric statistical hypothesis test on paired nominal data used to determine whether classifier disagreements on the official test set are statistically significant.

11. **Edwards, A. L. (1948).**  
    *Note on the "correction for continuity" in testing the significance of the difference between correlated proportions.*  
    *Psychometrika*, 13(3), pp. 185–187.  
    *Significance:* Derives the continuity-corrected McNemar test statistic ($\chi^2 = (|b - c| - 1)^2 / (b + c)$) ensuring conservative $p$-values when discordance counts are small.

12. **Efron, B., & Tibshirani, R. J. (1993).**  
    *An Introduction to the Bootstrap.*  
    Monographs on Statistics and Applied Probability 57, Chapman & Hall/CRC, New York.  
    *Significance:* Resampling methodology used to compute 95% percentile bootstrap confidence intervals (2,000 resamples of test rows, and of unseen attack types for the cluster bootstrap) for test metrics and unseen-attack recall.

13. **Holm, S. (1979).**  
    *A simple sequentially rejective multiple test procedure.*  
    *Scandinavian Journal of Statistics*, 6(2), pp. 65–70.  
    *Significance:* Step-down family-wise error correction applied to the 36 two-sided tests reported in `notebooks/08_evaluation_comparison.ipynb`.

---

## 5. Tooling & Software Frameworks

14. **Pedregosa, F., Varoquaux, G., Gramfort, A., Michel, V., Thirion, B., Grisel, O., Blondel, M., et al. (2011).**  
    *Scikit-learn: Machine Learning in Python.*  
    *Journal of Machine Learning Research*, 12, pp. 2825–2830.

15. **McKinney, W. (2010).**  
    *Data Structures for Statistical Computing in Python.*  
    Proceedings of the 9th Python in Science Conference (SciPy 2010), pp. 56–61.
