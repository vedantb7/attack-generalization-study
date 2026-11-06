from pathlib import Path
import os
import sys
import random
import yaml
import numpy as np

PROJECT_ROOT = Path(__file__).resolve().parents[1]

# Ensure PROJECT_ROOT is in sys.path so imports work seamlessly everywhere
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

def load_config(path: str = "config.yaml") -> dict:
    with open(PROJECT_ROOT / path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)

def set_seed(seed: int) -> None:
    random.seed(seed)
    os.environ["PYTHONHASHSEED"] = str(seed)
    np.random.seed(seed)
    # scikit-learn / xgboost: ALSO pass random_state=seed to every estimator and splitter.
