"""
test_data_pipeline.py
----------------------
Comprehensive test suite for NSL-KDD shared data and preprocessing pipeline.
Compatible with standard library `unittest` and `pytest`.
"""

from pathlib import Path
import tempfile
import unittest
import numpy as np
import pandas as pd
import joblib

from src.data_loader import (
    COLUMN_NAMES,
    FEATURE_COLUMNS,
    ATTACK_MAPPING,
    FEATURE_GROUPS,
    PROJECT_ROOT,
    load_nsl_kdd,
)
from src.preprocessing import (
    CATEGORICAL_FEATURES,
    DISALLOWED_COLUMNS,
    DEFAULT_PREPROCESSOR_PATH,
    get_feature_columns,
    split_features_target,
    create_preprocessor,
    save_preprocessor,
    load_preprocessor,
)


class TestDataLoader(unittest.TestCase):
    """Test suite for src.data_loader."""

    @classmethod
    def setUpClass(cls):
        cls.train_df, cls.test_df = load_nsl_kdd()

    def test_default_loading_shapes(self):
        self.assertEqual(self.train_df.shape, (125973, 45))
        self.assertEqual(self.test_df.shape, (22543, 45))

    def test_column_inventory(self):
        for col in COLUMN_NAMES:
            self.assertIn(col, self.train_df.columns)
            self.assertIn(col, self.test_df.columns)
        self.assertIn("is_intrusion", self.train_df.columns)
        self.assertIn("attack_category", self.train_df.columns)

    def test_raw_loading_without_derived_targets(self):
        train_raw, test_raw = load_nsl_kdd(add_derived_targets=False)
        self.assertEqual(train_raw.shape, (125973, 43))
        self.assertEqual(test_raw.shape, (22543, 43))
        self.assertEqual(list(train_raw.columns), COLUMN_NAMES)
        self.assertEqual(list(test_raw.columns), COLUMN_NAMES)

    def test_binary_label_distribution(self):
        self.assertEqual((self.train_df["is_intrusion"] == 0).sum(), 67343)
        self.assertEqual((self.train_df["is_intrusion"] == 1).sum(), 58630)
        self.assertEqual((self.test_df["is_intrusion"] == 0).sum(), 9710)
        self.assertEqual((self.test_df["is_intrusion"] == 1).sum(), 12833)

    def test_attack_category_mapping(self):
        expected_categories = {"Normal", "DoS", "Probe", "R2L", "U2R"}
        self.assertEqual(set(self.train_df["attack_category"].unique()), expected_categories)
        self.assertEqual(set(self.test_df["attack_category"].unique()), expected_categories)
        self.assertFalse(self.train_df["attack_category"].isna().any())
        self.assertFalse(self.test_df["attack_category"].isna().any())

    def test_unseen_attack_preservation(self):
        train_labels = set(self.train_df["label"].unique())
        test_labels = set(self.test_df["label"].unique())
        unseen_attacks = sorted(test_labels - train_labels)

        self.assertEqual(len(unseen_attacks), 17)
        expected_unseen = [
            "apache2", "httptunnel", "mailbomb", "mscan", "named",
            "processtable", "ps", "saint", "sendmail", "snmpgetattack",
            "snmpguess", "sqlattack", "udpstorm", "worm", "xlock",
            "xsnoop", "xterm"
        ]
        self.assertEqual(unseen_attacks, expected_unseen)
        for attack in unseen_attacks:
            self.assertGreater((self.test_df["label"] == attack).sum(), 0)

    def test_unmapped_attack_raises_value_error(self):
        with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as tmp:
            row = ["0"] * 41 + ["fake_alien_attack", "20"]
            tmp.write(",".join(row) + "\n")
            tmp_path = tmp.name

        try:
            with self.assertRaises(ValueError) as ctx:
                load_nsl_kdd(train_path=tmp_path)
            self.assertIn("fake_alien_attack", str(ctx.exception))
        finally:
            Path(tmp_path).unlink(missing_ok=True)

    def test_missing_file_raises_file_not_found(self):
        with self.assertRaises(FileNotFoundError):
            load_nsl_kdd(train_path="definitely_non_existent_file.csv")


class TestPreprocessing(unittest.TestCase):
    """Test suite for src.preprocessing."""

    @classmethod
    def setUpClass(cls):
        cls.train_df, cls.test_df = load_nsl_kdd()

    def test_feature_columns_and_helpers(self):
        feature_cols = get_feature_columns()
        self.assertEqual(len(feature_cols), 41)
        self.assertEqual(feature_cols, COLUMN_NAMES[:41])
        self.assertNotIn("label", feature_cols)
        self.assertNotIn("difficulty_level", feature_cols)

    def test_split_features_target(self):
        X_train, y_train = split_features_target(self.train_df, target_col="is_intrusion")
        self.assertEqual(X_train.shape, (125973, 41))
        self.assertEqual(y_train.shape, (125973,))
        self.assertEqual(list(X_train.columns), FEATURE_COLUMNS)
        self.assertEqual((y_train == 0).sum(), 67343)

    def test_disallowed_columns_in_preprocessor(self):
        with self.assertRaises(ValueError) as ctx:
            create_preprocessor(self.train_df)
        self.assertIn("Forbidden target or metadata column", str(ctx.exception))

        with self.assertRaises(ValueError) as ctx:
            bad_df = self.train_df[FEATURE_COLUMNS[:40] + ["label"]]
            create_preprocessor(bad_df)
        self.assertIn("Forbidden target or metadata column", str(ctx.exception))

    def test_invalid_feature_count_raises_value_error(self):
        with self.assertRaises(ValueError) as ctx:
            create_preprocessor(self.train_df[FEATURE_COLUMNS[:30]])
        self.assertIn("Expected exactly 41 input features", str(ctx.exception))

    def test_fit_transform_and_dimensions(self):
        X_train, _ = split_features_target(self.train_df)
        X_test, _ = split_features_target(self.test_df)

        preprocessor = create_preprocessor(X_train)

        # Train fit_transform
        X_train_proc = preprocessor.fit_transform(X_train)
        # Test transform only (no data leakage)
        X_test_proc = preprocessor.transform(X_test)

        self.assertEqual(X_train_proc.shape, (125973, 122))
        self.assertEqual(X_test_proc.shape, (22543, 122))
        self.assertEqual(X_train_proc.shape[1], X_test_proc.shape[1])

        # Check for NaN / Inf
        self.assertFalse(np.isnan(X_train_proc).any())
        self.assertFalse(np.isinf(X_train_proc).any())
        self.assertFalse(np.isnan(X_test_proc).any())
        self.assertFalse(np.isinf(X_test_proc).any())

        # Check that original DataFrames remain unchanged
        self.assertEqual(X_train.shape, (125973, 41))
        self.assertEqual(X_test.shape, (22543, 41))

    def test_one_hot_encoding_unseen_categories(self):
        X_train, _ = split_features_target(self.train_df)
        X_test, _ = split_features_target(self.test_df)

        preprocessor = create_preprocessor(X_train)
        preprocessor.fit(X_train)

        # Inject unseen categories into test samples
        X_test_unseen = X_test.head(5).copy()
        X_test_unseen.loc[0, "service"] = "completely_new_service"
        X_test_unseen.loc[1, "flag"] = "NOVEL_FLAG"
        X_test_unseen.loc[2, "protocol_type"] = "quantum_protocol"

        # Transforming with unseen categories must succeed without error (handle_unknown='ignore')
        X_test_proc = preprocessor.transform(X_test_unseen)
        self.assertEqual(X_test_proc.shape, (5, 122))
        self.assertFalse(np.isnan(X_test_proc).any())

    def test_persistence_and_notebook_compatibility(self):
        X_train, _ = split_features_target(self.train_df)
        X_test, _ = split_features_target(self.test_df)

        # Load the preprocessor saved by notebooks/02_preprocessing.ipynb (scalars/preprocessor.joblib)
        saved_prep = load_preprocessor(DEFAULT_PREPROCESSOR_PATH)
        X_train_saved = saved_prep.transform(X_train)
        X_test_saved = saved_prep.transform(X_test)

        # Fit a new preprocessor
        new_prep = create_preprocessor(X_train)
        X_train_new = new_prep.fit_transform(X_train)
        X_test_new = new_prep.transform(X_test)

        # Verify bit-for-bit equivalence
        np.testing.assert_allclose(X_train_saved, X_train_new, atol=1e-12)
        np.testing.assert_allclose(X_test_saved, X_test_new, atol=1e-12)

        # Test save and reload in temporary location
        with tempfile.NamedTemporaryFile(suffix=".joblib", delete=False) as tmp:
            tmp_path = Path(tmp.name)

        try:
            save_preprocessor(new_prep, tmp_path)
            reloaded_prep = load_preprocessor(tmp_path)
            X_test_reloaded = reloaded_prep.transform(X_test)
            np.testing.assert_allclose(X_test_new, X_test_reloaded, atol=1e-12)
        finally:
            tmp_path.unlink(missing_ok=True)


if __name__ == "__main__":
    unittest.main()
