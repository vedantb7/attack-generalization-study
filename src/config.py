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


def set_all_seeds(seed: int | None = None) -> np.random.Generator:
    """Seed Python, NumPy and the hash seed from config.yaml (or `seed`).

    PYTHONHASHSEED only fully applies to interpreters started after it is set,
    so notebooks are also executed with PYTHONHASHSEED exported. Every
    scikit-learn estimator/splitter and the Optuna sampler must still receive
    `random_state=seed` explicitly. Returns a seeded NumPy Generator.
    """
    if seed is None:
        seed = int(load_config()["seed"])
    set_seed(seed)
    return np.random.default_rng(seed)
