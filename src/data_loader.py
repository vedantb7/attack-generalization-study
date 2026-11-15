"""
data_loader.py
--------------
Module for loading, schema definition, and category mapping for the NSL-KDD dataset.
"""

from pathlib import Path
from typing import Tuple, Dict, List, Optional, Union
import pandas as pd

# The canonical 43 column names for the NSL-KDD dataset (41 features + label + difficulty_level)
COLUMN_NAMES: List[str] = [
    'duration', 'protocol_type', 'service', 'flag', 'src_bytes', 'dst_bytes',
    'land', 'wrong_fragment', 'urgent', 'hot', 'num_failed_logins',
    'logged_in', 'num_compromised', 'root_shell', 'su_attempted',
    'num_root', 'num_file_creations', 'num_shells', 'num_access_files',
    'num_outbound_cmds', 'is_host_login', 'is_guest_login', 'count',
    'srv_count', 'serror_rate', 'srv_serror_rate', 'rerror_rate',
    'srv_rerror_rate', 'same_srv_rate', 'diff_srv_rate',
    'srv_diff_host_rate', 'dst_host_count', 'dst_host_srv_count',
    'dst_host_same_srv_rate', 'dst_host_diff_srv_rate',
    'dst_host_same_src_port_rate', 'dst_host_srv_diff_host_rate',
    'dst_host_serror_rate', 'dst_host_srv_serror_rate',
    'dst_host_rerror_rate', 'dst_host_srv_rerror_rate',
    'label', 'difficulty_level'
]

# The canonical 41 predictor feature names (excluding label and difficulty_level)
FEATURE_COLUMNS: List[str] = COLUMN_NAMES[:41]

# Mapping of all 39 individual attack labels to the 4 standard DARPA/KDD attack categories + Normal
ATTACK_MAPPING: Dict[str, str] = {
    'normal': 'Normal',
    # Denial of Service (DoS)
    'neptune': 'DoS', 'back': 'DoS', 'land': 'DoS', 'pod': 'DoS', 'smurf': 'DoS',
    'teardrop': 'DoS', 'mailbomb': 'DoS', 'apache2': 'DoS', 'processtable': 'DoS',
    'udpstorm': 'DoS',
    # Surveillance / Probe
    'ipsweep': 'Probe', 'nmap': 'Probe', 'portsweep': 'Probe', 'satan': 'Probe',
    'mscan': 'Probe', 'saint': 'Probe',
    # Remote to Local (R2L)
    'ftp_write': 'R2L', 'guess_passwd': 'R2L', 'imap': 'R2L', 'multihop': 'R2L',
    'phf': 'R2L', 'spy': 'R2L', 'warezclient': 'R2L', 'warezmaster': 'R2L',
    'sendmail': 'R2L', 'named': 'R2L', 'snmpgetattack': 'R2L', 'snmpguess': 'R2L',
    'xlock': 'R2L', 'xsnoop': 'R2L', 'worm': 'R2L', 'httptunnel': 'R2L',
    # User to Root (U2R)
    'buffer_overflow': 'U2R', 'loadmodule': 'U2R', 'perl': 'U2R', 'rootkit': 'U2R',
    'sqlattack': 'U2R', 'xterm': 'U2R', 'ps': 'U2R'
}

# Feature groupings by network domain / inspection level
FEATURE_GROUPS: Dict[str, List[str]] = {
    'basic': [
        'duration', 'protocol_type', 'service', 'flag', 'src_bytes',
        'dst_bytes', 'land', 'wrong_fragment', 'urgent', 'hot'
    ],
    'content': [
        'num_failed_logins', 'logged_in', 'num_compromised', 'root_shell',
        'su_attempted', 'num_root', 'num_file_creations', 'num_shells',
        'num_access_files', 'num_outbound_cmds', 'is_host_login', 'is_guest_login'
    ],
    'time_traffic': [
        'count', 'srv_count', 'serror_rate', 'srv_serror_rate',
        'rerror_rate', 'srv_rerror_rate', 'same_srv_rate', 'diff_srv_rate',
        'srv_diff_host_rate'
    ],
    'host_traffic': [
        'dst_host_count', 'dst_host_srv_count', 'dst_host_same_srv_rate',
        'dst_host_diff_srv_rate', 'dst_host_same_src_port_rate',
        'dst_host_srv_diff_host_rate', 'dst_host_serror_rate',
        'dst_host_srv_serror_rate', 'dst_host_rerror_rate',
        'dst_host_srv_rerror_rate'
    ],
    'targets_and_meta': ['label', 'difficulty_level']
}

# Project root directory and default dataset paths
PROJECT_ROOT: Path = Path(__file__).resolve().parent.parent
DEFAULT_TRAIN_PATH: Path = PROJECT_ROOT / 'dataset' / 'raw' / 'KDDTrain+.csv'
DEFAULT_TEST_PATH: Path = PROJECT_ROOT / 'dataset' / 'raw' / 'KDDTest+.csv'


def _has_header(path: Path) -> bool:
    """True when the file's first field is the 'duration' column name.

    `dataset/add_headers.py` adds a header row to the copies in `dataset/`;
    the pristine files in `dataset/raw/` stay headerless.
    """
    with open(path, "rb") as f:
        return f.read(9) == b"duration,"


def _read_nsl_kdd_csv(path: Path) -> pd.DataFrame:
    """Read a headered or headerless NSL-KDD CSV into the canonical 43 columns.

    Headered files name the label column `class`; it is renamed to `label`
    so in-memory column names are identical for both file variants.
    """
    if _has_header(path):
        df = pd.read_csv(path, header=0).rename(columns={"class": "label"})
        if list(df.columns) != COLUMN_NAMES:
            raise ValueError(f"Unexpected header in {path}: {list(df.columns)}")
        return df
    return pd.read_csv(path, header=None, names=COLUMN_NAMES)


def load_nsl_kdd(
    train_path: Optional[Union[str, Path]] = DEFAULT_TRAIN_PATH,
    test_path: Optional[Union[str, Path]] = DEFAULT_TEST_PATH,
    add_derived_targets: bool = True
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Load NSL-KDD train and test datasets from CSV files with standard schema.

    Parameters
    ----------
    train_path : str or Path, optional
        Path to KDDTrain+.csv file. Defaults to PROJECT_ROOT / 'dataset' / 'raw' / 'KDDTrain+.csv'.
    test_path : str or Path, optional
        Path to KDDTest+.csv file. Defaults to PROJECT_ROOT / 'dataset' / 'raw' / 'KDDTest+.csv'.
    add_derived_targets : bool, default=True
        Whether to add 'is_intrusion' (binary) and 'attack_category' (5-class).

    Returns
    -------
    Tuple[pd.DataFrame, pd.DataFrame]
        Tuple of (train_df, test_df).

    Raises
    ------
    FileNotFoundError
        If the specified training or testing file does not exist.
    ValueError
        If unmapped attack labels are detected when add_derived_targets is True.
    """
    train_path = Path(train_path) if train_path is not None else DEFAULT_TRAIN_PATH
    test_path = Path(test_path) if test_path is not None else DEFAULT_TEST_PATH

    if not train_path.exists():
        raise FileNotFoundError(f"Training dataset not found: {train_path}")
    if not test_path.exists():
        raise FileNotFoundError(f"Testing dataset not found: {test_path}")

    train_df = _read_nsl_kdd_csv(train_path)
    test_df = _read_nsl_kdd_csv(test_path)

    if add_derived_targets:
        # Validate that all attack labels exist in ATTACK_MAPPING
        unmapped_train = set(train_df['label'].unique()) - set(ATTACK_MAPPING.keys())
        unmapped_test = set(test_df['label'].unique()) - set(ATTACK_MAPPING.keys())

        if unmapped_train or unmapped_test:
            error_details = []
            if unmapped_train:
                error_details.append(f"training set: {sorted(unmapped_train)}")
            if unmapped_test:
                error_details.append(f"testing set: {sorted(unmapped_test)}")
            raise ValueError(
                f"Found unmapped attack label(s) not in ATTACK_MAPPING ({'; '.join(error_details)})."
            )

        for df in (train_df, test_df):
            df['is_intrusion'] = (df['label'] != 'normal').astype(int)
            df['attack_category'] = df['label'].map(ATTACK_MAPPING)

    return train_df, test_df
