// Generated authoritative experimental data for ES 335 Intrusion Detection Research Website
// Source files: results/metrics/*.json, results/predictions/*_predictions.csv

export interface ModelInfo {
  id: 'baseline' | 'lr' | 'dt' | 'rf';
  name: string;
  shortName: string;
  type: string;
  role: string;
  description: string;
  cvMacroF1: number;
  cvStd?: number;
  latencyUs: number;
  hyperparameters: Record<string, string | number | boolean | null>;
}

export interface OverallMetricRow {
  metric: string;
  key: string;
  unit: string;
  description: string;
  higherIsBetter: boolean;
  baseline: number;
  lr: number;
  dt: number;
  rf: number;
  baselineDisplay: string;
  lrDisplay: string;
  dtDisplay: string;
  rfDisplay: string;
}

export interface ConfusionMatrix {
  tn: number;
  fp: number;
  fn: number;
  tp: number;
  total: number;
  precision: number;
  recall: number;
  fpr: number;
  fnr: number;
  specificity: number;
}

export interface AttackCategoryData {
  category: string;
  total: number;
  baselineRecall: number;
  lrRecall: number;
  dtRecall: number;
  rfRecall: number;
  baselineDetected: number;
  lrDetected: number;
  dtDetected: number;
  rfDetected: number;
}

export interface UnseenAttackRecord {
  name: string;
  category: 'DoS' | 'Probe' | 'R2L' | 'U2R';
  count: number;
  results: {
    baseline: { detected: number; missed: number; recall: number };
    lr: { detected: number; missed: number; recall: number };
    dt: { detected: number; missed: number; recall: number };
    rf: { detected: number; missed: number; recall: number };
  };
}

export const MODELS: ModelInfo[] = [
  {
    id: 'baseline',
    name: 'Majority-Class Baseline',
    shortName: 'Baseline',
    type: 'Heuristic Floor',
    role: 'Zero-rule theoretical floor predicting the training majority class (Normal: 53.46%).',
    description: 'Predicts constant non-intrusion (Normal=0). Establishes the absolute baseline floor on the inverted test distribution (where Attack=56.93%).',
    cvMacroF1: 0.3483,
    latencyUs: 0.04,
    hyperparameters: { strategy: 'constant_most_frequent', constant: 0 }
  },
  {
    id: 'lr',
    name: 'Logistic Regression',
    shortName: 'Logistic Reg.',
    type: 'Regularized Linear',
    role: 'Interpretable linear benchmark testing whether high-dimensional global linear hyperplanes generalize to unseen attacks.',
    description: 'Optuna-tuned with balanced class weights. Smooth linear decision surface captures volumetric traffic rates but incurs higher false positives on stealthy patterns.',
    cvMacroF1: 0.9757,
    cvStd: 0.0010,
    latencyUs: 1.34,
    hyperparameters: {
      C: 82.05,
      penalty: 'l2',
      class_weight: 'balanced',
      solver: 'lbfgs',
      max_iter: 500
    }
  },
  {
    id: 'dt',
    name: 'Decision Tree (CART)',
    shortName: 'Decision Tree',
    type: 'Interpretable Non-linear',
    role: 'Interpretable tree model testing whether orthogonal axis-aligned partition rules retain generalization to novel feature distributions.',
    description: 'Optuna-tuned with Gini impurity, max_depth=30, min_samples_leaf=2. Achieved the highest unseen attack recall and lowest overall generalization drop.',
    cvMacroF1: 0.9979,
    cvStd: 0.0002,
    latencyUs: 0.82,
    hyperparameters: {
      criterion: 'gini',
      max_depth: 30,
      min_samples_split: 2,
      min_samples_leaf: 2,
      max_features: null,
      class_weight: 'balanced'
    }
  },
  {
    id: 'rf',
    name: 'Random Forest',
    shortName: 'Random Forest',
    type: 'Ensemble Non-linear',
    role: 'High-capacity ensemble benchmark testing whether aggregating randomized feature subtrees mitigates signature memorization.',
    description: 'Ensemble of 75 deep trees with sqrt feature subspacing. Saturates in-distribution cross-validation (0.9987) and achieves highest precision, but suffers a 52.66 pp collapse on unseen attacks.',
    cvMacroF1: 0.9987,
    cvStd: 0.0004,
    latencyUs: 4.34,
    hyperparameters: {
      n_estimators: 75,
      criterion: 'gini',
      max_depth: null,
      min_samples_split: 3,
      min_samples_leaf: 1,
      max_features: 'sqrt',
      class_weight: null,
      bootstrap: true
    }
  }
];

export const OVERALL_METRICS: OverallMetricRow[] = [
  {
    metric: 'Accuracy',
    key: 'accuracy',
    unit: '%',
    description: 'Proportion of all 22,543 test flows correctly classified.',
    higherIsBetter: true,
    baseline: 43.07,
    lr: 75.64,
    dt: 83.22,
    rf: 76.36,
    baselineDisplay: '43.07%',
    lrDisplay: '75.64%',
    dtDisplay: '83.22%',
    rfDisplay: '76.36%'
  },
  {
    metric: 'Macro-F1 (95% CI)',
    key: 'macro_f1',
    unit: 'score',
    description: 'Unweighted harmonic mean of F1 across Normal and Attack classes.',
    higherIsBetter: true,
    baseline: 0.3011,
    lr: 0.7560,
    dt: 0.8322,
    rf: 0.7623,
    baselineDisplay: '0.3011',
    lrDisplay: '0.7560 [0.750, 0.761]',
    dtDisplay: '0.8322 [0.827, 0.837]',
    rfDisplay: '0.7623 [0.757, 0.767]'
  },
  {
    metric: 'Attack Recall',
    key: 'attack_recall',
    unit: '%',
    description: 'Percentage of all actual attack connections successfully detected (12,833 total).',
    higherIsBetter: true,
    baseline: 0.00,
    lr: 62.92,
    dt: 73.91,
    rf: 60.52,
    baselineDisplay: '0.00%',
    lrDisplay: '62.92%',
    dtDisplay: '73.91%',
    rfDisplay: '60.52%'
  },
  {
    metric: 'Attack Precision',
    key: 'attack_precision',
    unit: '%',
    description: 'Percentage of predicted attack alarms that were genuine intrusions.',
    higherIsBetter: true,
    baseline: 0.00,
    lr: 91.68,
    dt: 95.61,
    rf: 96.72,
    baselineDisplay: '0.00%',
    lrDisplay: '91.68%',
    dtDisplay: '95.61%',
    rfDisplay: '96.72%'
  },
  {
    metric: 'Attack F1',
    key: 'attack_f1',
    unit: 'score',
    description: 'Harmonic mean of precision and recall for intrusion detection.',
    higherIsBetter: true,
    baseline: 0.0000,
    lr: 0.7462,
    dt: 0.8337,
    rf: 0.7446,
    baselineDisplay: '0.0000',
    lrDisplay: '0.7462',
    dtDisplay: '0.8337',
    rfDisplay: '0.7446'
  },
  {
    metric: 'False Positive Rate (FPR)',
    key: 'fpr',
    unit: '%',
    description: 'Percentage of normal benign connections misclassified as intrusions (Alert Fatigue).',
    higherIsBetter: false,
    baseline: 0.00,
    lr: 7.55,
    dt: 4.48,
    rf: 2.71,
    baselineDisplay: '0.00% (0)',
    lrDisplay: '7.55% (733)',
    dtDisplay: '4.48% (435)',
    rfDisplay: '2.71% (263)'
  },
  {
    metric: 'False Negative Rate (FNR)',
    key: 'fnr',
    unit: '%',
    description: 'Percentage of actual intrusions that bypassed detection completely.',
    higherIsBetter: false,
    baseline: 100.00,
    lr: 37.08,
    dt: 26.09,
    rf: 39.48,
    baselineDisplay: '100.00% (12,833)',
    lrDisplay: '37.08% (4,759)',
    dtDisplay: '26.09% (3,348)',
    rfDisplay: '39.48% (5,066)'
  },
  {
    metric: 'Specificity (True Negative Rate)',
    key: 'specificity',
    unit: '%',
    description: 'Percentage of benign normal traffic correctly passed through without alerts.',
    higherIsBetter: true,
    baseline: 100.00,
    lr: 92.45,
    dt: 95.52,
    rf: 97.29,
    baselineDisplay: '100.00%',
    lrDisplay: '92.45%',
    dtDisplay: '95.52%',
    rfDisplay: '97.29%'
  }
];

export const CONFUSION_MATRICES: Record<string, ConfusionMatrix> = {
  baseline: { tn: 9710, fp: 0, fn: 12833, tp: 0, total: 22543, precision: 0.0, recall: 0.0, fpr: 0.0, fnr: 100.0, specificity: 100.0 },
  lr: { tn: 8977, fp: 733, fn: 4759, tp: 8074, total: 22543, precision: 91.68, recall: 62.92, fpr: 7.55, fnr: 37.08, specificity: 92.45 },
  dt: { tn: 9275, fp: 435, fn: 3348, tp: 9485, total: 22543, precision: 95.61, recall: 73.91, fpr: 4.48, fnr: 26.09, specificity: 95.52 },
  rf: { tn: 9447, fp: 263, fn: 5066, tp: 7767, total: 22543, precision: 96.72, recall: 60.52, fpr: 2.71, fnr: 39.48, specificity: 97.29 }
};

export const ATTACK_CATEGORIES: AttackCategoryData[] = [
  {
    category: 'DoS (Denial of Service)',
    total: 7458,
    baselineRecall: 0.0,
    lrRecall: 82.22,
    dtRecall: 85.43,
    rfRecall: 79.47,
    baselineDetected: 0,
    lrDetected: 6132,
    dtDetected: 6371,
    rfDetected: 5927
  },
  {
    category: 'Probe (Surveillance)',
    total: 2421,
    baselineRecall: 0.0,
    lrRecall: 78.11,
    dtRecall: 83.02,
    rfRecall: 72.86,
    baselineDetected: 0,
    lrDetected: 1891,
    dtDetected: 2010,
    rfDetected: 1764
  },
  {
    category: 'R2L (Remote to Local)',
    total: 2887,
    baselineRecall: 0.0,
    lrRecall: 1.04,
    dtRecall: 37.48,
    rfRecall: 2.36,
    baselineDetected: 0,
    lrDetected: 30,
    dtDetected: 1082,
    rfDetected: 68
  },
  {
    category: 'U2R (User to Root)',
    total: 67,
    baselineRecall: 0.0,
    lrRecall: 31.34,
    dtRecall: 32.84,
    rfRecall: 11.94,
    baselineDetected: 0,
    lrDetected: 21,
    dtDetected: 22,
    rfDetected: 8
  }
];

export const GENERALIZATION_DATA = {
  totalSeen: 9083,
  totalUnseen: 3750,
  seenRecall: {
    baseline: 0.0,
    lr: 71.52,
    dt: 82.40,
    rf: 75.91,
    lrCI: [70.51, 72.41],
    dtCI: [81.58, 83.15],
    rfCI: [75.01, 76.70]
  },
  unseenRecall: {
    baseline: 0.0,
    lr: 42.08,
    dt: 53.36,
    rf: 23.25,
    lrCI: [40.57, 43.70],
    dtCI: [51.82, 54.96],
    rfCI: [21.90, 24.62]
  },
  generalizationDropPp: {
    baseline: 0.0,
    lr: 29.44,
    dt: 29.04,
    rf: 52.66,
    lrCI: [27.67, 31.27],
    dtCI: [27.21, 30.74],
    rfCI: [50.99, 54.24]
  },
  macroAvgUnseenRecall: {
    baseline: 0.0,
    lr: 17.42,
    dt: 47.98,
    rf: 19.68
  },
  sampleWeightedUnseenRecall: {
    baseline: 0.0,
    lr: 42.08,
    dt: 53.36,
    rf: 23.25
  }
};

export const UNSEEN_ATTACKS: UnseenAttackRecord[] = [
  {
    "name": "mscan",
    "category": "Probe",
    "count": 996,
    "results": {
      "baseline": {
        "detected": 0,
        "missed": 996,
        "recall": 0.0
      },
      "lr": {
        "detected": 523,
        "missed": 473,
        "recall": 52.51
      },
      "dt": {
        "detected": 589,
        "missed": 407,
        "recall": 59.14
      },
      "rf": {
        "detected": 344,
        "missed": 652,
        "recall": 34.54
      }
    }
  },
  {
    "name": "apache2",
    "category": "DoS",
    "count": 737,
    "results": {
      "baseline": {
        "detected": 0,
        "missed": 737,
        "recall": 0.0
      },
      "lr": {
        "detected": 730,
        "missed": 7,
        "recall": 99.05
      },
      "dt": {
        "detected": 334,
        "missed": 403,
        "recall": 45.32
      },
      "rf": {
        "detected": 195,
        "missed": 542,
        "recall": 26.46
      }
    }
  },
  {
    "name": "processtable",
    "category": "DoS",
    "count": 685,
    "results": {
      "baseline": {
        "detected": 0,
        "missed": 685,
        "recall": 0.0
      },
      "lr": {
        "detected": 7,
        "missed": 678,
        "recall": 1.02
      },
      "dt": {
        "detected": 235,
        "missed": 450,
        "recall": 34.31
      },
      "rf": {
        "detected": 8,
        "missed": 677,
        "recall": 1.17
      }
    }
  },
  {
    "name": "snmpguess",
    "category": "R2L",
    "count": 331,
    "results": {
      "baseline": {
        "detected": 0,
        "missed": 331,
        "recall": 0.0
      },
      "lr": {
        "detected": 2,
        "missed": 329,
        "recall": 0.6
      },
      "dt": {
        "detected": 327,
        "missed": 4,
        "recall": 98.79
      },
      "rf": {
        "detected": 0,
        "missed": 331,
        "recall": 0.0
      }
    }
  },
  {
    "name": "saint",
    "category": "Probe",
    "count": 319,
    "results": {
      "baseline": {
        "detected": 0,
        "missed": 319,
        "recall": 0.0
      },
      "lr": {
        "detected": 305,
        "missed": 14,
        "recall": 95.61
      },
      "dt": {
        "detected": 317,
        "missed": 2,
        "recall": 99.37
      },
      "rf": {
        "detected": 314,
        "missed": 5,
        "recall": 98.43
      }
    }
  },
  {
    "name": "mailbomb",
    "category": "DoS",
    "count": 293,
    "results": {
      "baseline": {
        "detected": 0,
        "missed": 293,
        "recall": 0.0
      },
      "lr": {
        "detected": 0,
        "missed": 293,
        "recall": 0.0
      },
      "dt": {
        "detected": 63,
        "missed": 230,
        "recall": 21.5
      },
      "rf": {
        "detected": 0,
        "missed": 293,
        "recall": 0.0
      }
    }
  },
  {
    "name": "snmpgetattack",
    "category": "R2L",
    "count": 178,
    "results": {
      "baseline": {
        "detected": 0,
        "missed": 178,
        "recall": 0.0
      },
      "lr": {
        "detected": 1,
        "missed": 177,
        "recall": 0.56
      },
      "dt": {
        "detected": 0,
        "missed": 178,
        "recall": 0.0
      },
      "rf": {
        "detected": 0,
        "missed": 178,
        "recall": 0.0
      }
    }
  },
  {
    "name": "httptunnel",
    "category": "R2L",
    "count": 133,
    "results": {
      "baseline": {
        "detected": 0,
        "missed": 133,
        "recall": 0.0
      },
      "lr": {
        "detected": 4,
        "missed": 129,
        "recall": 3.01
      },
      "dt": {
        "detected": 110,
        "missed": 23,
        "recall": 82.71
      },
      "rf": {
        "detected": 1,
        "missed": 132,
        "recall": 0.75
      }
    }
  },
  {
    "name": "named",
    "category": "R2L",
    "count": 17,
    "results": {
      "baseline": {
        "detected": 0,
        "missed": 17,
        "recall": 0.0
      },
      "lr": {
        "detected": 1,
        "missed": 16,
        "recall": 5.88
      },
      "dt": {
        "detected": 5,
        "missed": 12,
        "recall": 29.41
      },
      "rf": {
        "detected": 2,
        "missed": 15,
        "recall": 11.76
      }
    }
  },
  {
    "name": "ps",
    "category": "U2R",
    "count": 15,
    "results": {
      "baseline": {
        "detected": 0,
        "missed": 15,
        "recall": 0.0
      },
      "lr": {
        "detected": 0,
        "missed": 15,
        "recall": 0.0
      },
      "dt": {
        "detected": 9,
        "missed": 6,
        "recall": 60.0
      },
      "rf": {
        "detected": 2,
        "missed": 13,
        "recall": 13.33
      }
    }
  },
  {
    "name": "sendmail",
    "category": "R2L",
    "count": 14,
    "results": {
      "baseline": {
        "detected": 0,
        "missed": 14,
        "recall": 0.0
      },
      "lr": {
        "detected": 1,
        "missed": 13,
        "recall": 7.14
      },
      "dt": {
        "detected": 1,
        "missed": 13,
        "recall": 7.14
      },
      "rf": {
        "detected": 0,
        "missed": 14,
        "recall": 0.0
      }
    }
  },
  {
    "name": "xterm",
    "category": "U2R",
    "count": 13,
    "results": {
      "baseline": {
        "detected": 0,
        "missed": 13,
        "recall": 0.0
      },
      "lr": {
        "detected": 4,
        "missed": 9,
        "recall": 30.77
      },
      "dt": {
        "detected": 4,
        "missed": 9,
        "recall": 30.77
      },
      "rf": {
        "detected": 3,
        "missed": 10,
        "recall": 23.08
      }
    }
  },
  {
    "name": "xlock",
    "category": "R2L",
    "count": 9,
    "results": {
      "baseline": {
        "detected": 0,
        "missed": 9,
        "recall": 0.0
      },
      "lr": {
        "detected": 0,
        "missed": 9,
        "recall": 0.0
      },
      "dt": {
        "detected": 2,
        "missed": 7,
        "recall": 22.22
      },
      "rf": {
        "detected": 0,
        "missed": 9,
        "recall": 0.0
      }
    }
  },
  {
    "name": "xsnoop",
    "category": "R2L",
    "count": 4,
    "results": {
      "baseline": {
        "detected": 0,
        "missed": 4,
        "recall": 0.0
      },
      "lr": {
        "detected": 0,
        "missed": 4,
        "recall": 0.0
      },
      "dt": {
        "detected": 1,
        "missed": 3,
        "recall": 25.0
      },
      "rf": {
        "detected": 1,
        "missed": 3,
        "recall": 25.0
      }
    }
  },
  {
    "name": "worm",
    "category": "R2L",
    "count": 2,
    "results": {
      "baseline": {
        "detected": 0,
        "missed": 2,
        "recall": 0.0
      },
      "lr": {
        "detected": 0,
        "missed": 2,
        "recall": 0.0
      },
      "dt": {
        "detected": 0,
        "missed": 2,
        "recall": 0.0
      },
      "rf": {
        "detected": 0,
        "missed": 2,
        "recall": 0.0
      }
    }
  },
  {
    "name": "sqlattack",
    "category": "U2R",
    "count": 2,
    "results": {
      "baseline": {
        "detected": 0,
        "missed": 2,
        "recall": 0.0
      },
      "lr": {
        "detected": 0,
        "missed": 2,
        "recall": 0.0
      },
      "dt": {
        "detected": 2,
        "missed": 0,
        "recall": 100.0
      },
      "rf": {
        "detected": 0,
        "missed": 2,
        "recall": 0.0
      }
    }
  },
  {
    "name": "udpstorm",
    "category": "DoS",
    "count": 2,
    "results": {
      "baseline": {
        "detected": 0,
        "missed": 2,
        "recall": 0.0
      },
      "lr": {
        "detected": 0,
        "missed": 2,
        "recall": 0.0
      },
      "dt": {
        "detected": 2,
        "missed": 0,
        "recall": 100.0
      },
      "rf": {
        "detected": 2,
        "missed": 0,
        "recall": 100.0
      }
    }
  }
];

export const STATISTICAL_COMPARISON = {
  mcnemarFullTestSet: [
    {
      pair: 'Logistic Regression vs. Decision Tree',
      disagreements: 3223,
      chi2: 905.14,
      pVal: '< 1e-198',
      significant: true,
      winner: 'Decision Tree'
    },
    {
      pair: 'Logistic Regression vs. Random Forest',
      disagreements: 1919,
      chi2: 13.68,
      pVal: '0.000217',
      significant: true,
      winner: 'Random Forest (higher precision) / LR (higher recall)'
    },
    {
      pair: 'Decision Tree vs. Random Forest',
      disagreements: 2026,
      chi2: 1178.20,
      pVal: '< 1e-257',
      significant: true,
      winner: 'Decision Tree'
    }
  ],
  mcnemarUnseenSubset: [
    {
      pair: 'Logistic Regression vs. Decision Tree',
      disagreements: 1605,
      lrBetter: 591,
      dtBetter: 1014,
      chi2: 110.96,
      pVal: '< 1e-25',
      significant: true,
      winner: 'Decision Tree'
    },
    {
      pair: 'Logistic Regression vs. Random Forest',
      disagreements: 928,
      lrBetter: 817,
      rfBetter: 111,
      chi2: 535.59,
      pVal: '< 1e-118',
      significant: true,
      winner: 'Logistic Regression'
    },
    {
      pair: 'Decision Tree vs. Random Forest',
      disagreements: 1245,
      dtBetter: 1187,
      rfBetter: 58,
      chi2: 1022.00,
      pVal: '< 1e-223',
      significant: true,
      winner: 'Decision Tree'
    }
  ],
  pairedBootstrap: [
    {
      comparison: 'DT − RF',
      metric: 'Macro-F1',
      diff: '+0.0699',
      ci95: '[+0.0662, +0.0739]',
      probLessOrEqualZero: 0.0000
    },
    {
      comparison: 'DT − RF',
      metric: 'Unseen Attack Recall',
      diff: '+30.13 pp',
      ci95: '[+28.62, +31.75 pp]',
      probLessOrEqualZero: 0.0000
    },
    {
      comparison: 'LR − RF',
      metric: 'Macro-F1',
      diff: '-0.0064',
      ci95: '[-0.0100, -0.0029]',
      probLessOrEqualZero: 0.0000
    },
    {
      comparison: 'LR − RF',
      metric: 'Unseen Attack Recall',
      diff: '+18.79 pp',
      ci95: '[+17.31, +20.25 pp]',
      probLessOrEqualZero: 0.0000
    },
    {
      comparison: 'DT − LR',
      metric: 'Macro-F1',
      diff: '+0.0763',
      ci95: '[+0.0715, +0.0807]',
      probLessOrEqualZero: 0.0000
    },
    {
      comparison: 'DT − LR',
      metric: 'Unseen Attack Recall',
      diff: '+11.34 pp',
      ci95: '[+9.25, +13.43 pp]',
      probLessOrEqualZero: 0.0000
    }
  ]
};

export const DATASET_SPECIFICATION = {
  name: 'NSL-KDD Benchmark',
  citation: 'Tavallaee et al. (CISDA 2009)',
  trainRows: 125973,
  testRows: 22543,
  rawFeatures: 41,
  encodedFeatures: 122,
  trainNormal: 67343,
  trainNormalPct: 53.46,
  trainAttack: 58630,
  trainAttackPct: 46.54,
  testNormal: 9710,
  testNormalPct: 43.07,
  testAttack: 12833,
  testAttackPct: 56.93,
  seenAttacksInTest: 9083,
  seenAttacksInTestPct: 70.78,
  unseenAttacksInTest: 3750,
  unseenAttacksInTestPct: 29.22,
  totalUnseenTypes: 17,
  featureGroups: [
    { name: 'Basic Features', count: 10, description: 'Direct packet metadata: duration, protocol_type, service, flag, src_bytes, dst_bytes, land, wrong_fragment, urgent.' },
    { name: 'Content Features', count: 12, description: 'Application payload telemetry: hot, num_failed_logins, logged_in, num_compromised, root_shell, su_attempted, etc.' },
    { name: 'Time-Traffic Features', count: 9, description: 'Past 2-second connection rates: count, srv_count, serror_rate, srv_serror_rate, rerror_rate, same_srv_rate, diff_srv_rate, etc.' },
    { name: 'Host-Traffic Features', count: 10, description: 'Past 100 destination host connection windows: dst_host_count, dst_host_srv_count, dst_host_same_srv_rate, etc.' }
  ]
};