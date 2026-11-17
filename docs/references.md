# 📚 Project References

**Course:** ES 335: Machine Learning (IIT Gandhinagar)  
**Project:** Signature Memorization vs. Unseen Attack Generalization in Network Intrusion Detection  

---

## 1. Dataset

1. **Tavallaee, M., Bagheri, E., Lu, W., & Ghorbani, A. A. (2009).**  
   *A Detailed Analysis of the KDD CUP 99 Data Set.*  
   Proceedings of the 2009 IEEE Symposium on Computational Intelligence for Security and Defense Applications (CISDA), Ottawa, ON, Canada, pp. 1–6.  
   *Significance:* Establishes the NSL-KDD dataset by removing redundant and duplicate records (~78% in train, ~75% in test) from KDD Cup 1999, creating balanced subsets (`KDDTrain+` and `KDDTest+`) with assigned difficulty levels.

2. **Canadian Institute for Cybersecurity, University of New Brunswick.**  
   *NSL-KDD Dataset.*  
   Original source: [https://www.unb.ca/cic/datasets/nsl.html](https://www.unb.ca/cic/datasets/nsl.html) (the download is no longer offered there).  
   Copy used in this project: Kaggle mirror [https://www.kaggle.com/datasets/hassan06/nslkdd/data](https://www.kaggle.com/datasets/hassan06/nslkdd/data) (`KDDTrain+.txt`, `KDDTest+.txt`).

---

## 2. Statistical Testing

3. **McNemar, Q. (1947).**  
   *Note on the sampling error of the difference between correlated proportions or percentages.*  
   *Psychometrika*, 12(2), pp. 153–157.  
   *Significance:* Non-parametric test on paired nominal data, used to determine whether classifier disagreements on the official test set are statistically significant.

4. **Holm, S. (1979).**  
   *A simple sequentially rejective multiple test procedure.*  
   *Scandinavian Journal of Statistics*, 6(2), pp. 65–70.  
   *Significance:* Step-down family-wise error correction applied to the 36 two-sided tests reported in `notebooks/08_evaluation_comparison.ipynb`.
