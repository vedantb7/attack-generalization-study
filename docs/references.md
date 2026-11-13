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

## 3. Tooling & Software Frameworks

6. **Pedregosa, F., Varoquaux, G., Gramfort, A., Michel, V., Thirion, B., Grisel, O., Blondel, M., et al. (2011).**  
   *Scikit-learn: Machine Learning in Python.*  
   *Journal of Machine Learning Research*, 12, pp. 2825–2830.

7. **McKinney, W. (2010).**  
   *Data Structures for Statistical Computing in Python.*  
   Proceedings of the 9th Python in Science Conference (SciPy 2010), pp. 56–61.
