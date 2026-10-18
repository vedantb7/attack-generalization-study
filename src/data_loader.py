"""
data_loader.py
--------------
Module for loading, schema definition, and category mapping for the NSL-KDD dataset.
"""

from typing import Tuple, Dict, List
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

# Mapping of all 38 individual attack labels to the 4 standard DARPA/KDD attack categories + Normal
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

def load_nsl_kdd(
    train_path: str = 'dataset/KDDTrain+.csv',
    test_path: str = 'dataset/KDDTest+.csv',
    add_derived_targets: bool = True
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Load NSL-KDD train and test datasets from CSV files with standard schema.

    Parameters
    ----------
    train_path : str
        Path to KDDTrain+.csv file.
    test_path : str
        Path to KDDTest+.csv file.
    add_derived_targets : bool
        Whether to add 'is_intrusion' (binary) and 'attack_category' (5-class).

    Returns
    -------
    Tuple[pd.DataFrame, pd.DataFrame]
        Tuple of (train_df, test_df).
    """
    train_df = pd.read_csv(train_path, names=COLUMN_NAMES)
    test_df = pd.read_csv(test_path, names=COLUMN_NAMES)

    if add_derived_targets:
        for df in (train_df, test_df):
            df['is_intrusion'] = (df['label'] != 'normal').astype(int)
            df['attack_category'] = df['label'].map(ATTACK_MAPPING)

    return train_df, test_df
