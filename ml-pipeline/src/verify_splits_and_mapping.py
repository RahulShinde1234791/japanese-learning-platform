import os
import json
import csv
import torch
from collections import defaultdict

PROCESSED_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "processed")
RAW_METADATA = os.path.join(os.path.dirname(__file__), "..", "data", "raw", "etl9b", "repacked_etl9b", "metadata.tsv")
CHECKPOINT_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "best_kanji_cnn.pth")

def verify_mapping():
    print("--- 1. Verifying Character-to-Index Mapping ---")
    char_map_path = os.path.join(PROCESSED_DIR, "char_map.json")
    with open(char_map_path, "r", encoding="utf-8") as f:
        disk_map = json.load(f)

    checkpoint = torch.load(CHECKPOINT_PATH, map_location="cpu")

    num_classes_disk = disk_map["num_classes"]
    num_classes_ckpt = checkpoint["num_classes"]
    print(f"Classes in char_map.json: {num_classes_disk}")
    print(f"Classes in checkpoint:     {num_classes_ckpt}")
    assert num_classes_disk == num_classes_ckpt == 162, "Class counts mismatch!"

    char_to_idx_disk = disk_map["char_to_idx"]
    char_to_idx_ckpt = checkpoint["char_to_idx"]
    assert char_to_idx_disk == char_to_idx_ckpt, "char_to_idx mismatch!"

    idx_to_char_disk = {str(k): v for k, v in disk_map["idx_to_char"].items()}
    idx_to_char_ckpt = {str(k): v for k, v in checkpoint["idx_to_char"].items()}
    assert idx_to_char_disk == idx_to_char_ckpt, "idx_to_char mismatch!"

    print("Result: Character mapping is 100% identical between char_map.json and checkpoint.\n")

def verify_split_isolation():
    print("--- 2. Verifying Split Isolation & Writer ID Overlap ---")
    # Load char map
    char_map_path = os.path.join(PROCESSED_DIR, "char_map.json")
    with open(char_map_path, "r", encoding="utf-8") as f:
        char_map = json.load(f)
    target_chars = set(char_map["char_to_idx"].keys())

    # Read raw metadata records per char
    char_records = defaultdict(list)
    with open(RAW_METADATA, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f, delimiter="\t")
        for row in reader:
            c = row["char"]
            if c in target_chars:
                char_records[c].append(row)

    train_sheets = set()
    val_sheets = set()
    test_sheets = set()

    train_sources = set()
    val_sources = set()
    test_sources = set()

    for c in sorted(list(target_chars)):
        samples = char_records[c]
        assert len(samples) == 201, f"Character {c} has {len(samples)} samples, expected 201!"
        
        # Slices matching preprocess_and_cache.py
        for r in samples[:160]:
            train_sheets.add(r.get("sheet_number"))
            train_sources.add(r.get("dataset_source"))
        for r in samples[160:180]:
            val_sheets.add(r.get("sheet_number"))
            val_sources.add(r.get("dataset_source"))
        for r in samples[180:]:
            test_sheets.add(r.get("sheet_number"))
            test_sources.add(r.get("dataset_source"))

    print(f"Total train sheets collected: {len(train_sheets)}")
    print(f"Total val sheets collected:   {len(val_sheets)}")
    print(f"Total test sheets collected:  {len(test_sheets)}")

    # Check sheet intersection
    train_val_overlap = train_sheets.intersection(val_sheets)
    train_test_overlap = train_sheets.intersection(test_sheets)
    val_test_overlap = val_sheets.intersection(test_sheets)

    print(f"Train / Val sheet overlap:  {len(train_val_overlap)} sheets")
    print(f"Train / Test sheet overlap: {len(train_test_overlap)} sheets")
    print(f"Val / Test sheet overlap:   {len(val_test_overlap)} sheets")

    # Inspect sample 0, 160, 180 across characters
    sample_a = char_records['あ']
    sample_ichi = char_records['一']
    print(f"\nComparing sheets across characters for sample #0:")
    print(f"  'あ' sample 0 sheet: {sample_a[0].get('sheet_number')} (source: {sample_a[0].get('dataset_source')})")
    print(f"  '一' sample 0 sheet: {sample_ichi[0].get('sheet_number')} (source: {sample_ichi[0].get('dataset_source')})")

    print(f"Comparing sheets across characters for sample #160 (val):")
    print(f"  'あ' sample 160 sheet: {sample_a[160].get('sheet_number')} (source: {sample_a[160].get('dataset_source')})")
    print(f"  '一' sample 160 sheet: {sample_ichi[160].get('sheet_number')} (source: {sample_ichi[160].get('dataset_source')})")

    print(f"Comparing sheets across characters for sample #180 (test):")
    print(f"  'あ' sample 180 sheet: {sample_a[180].get('sheet_number')} (source: {sample_a[180].get('dataset_source')})")
    print(f"  '一' sample 180 sheet: {sample_ichi[180].get('sheet_number')} (source: {sample_ichi[180].get('dataset_source')})")

    # Check whether test images were ever used in train or val files
    test_npz = np.load(os.path.join(PROCESSED_DIR, "test.npz"))
    train_npz = np.load(os.path.join(PROCESSED_DIR, "train.npz"))
    val_npz = np.load(os.path.join(PROCESSED_DIR, "val.npz"))
    print(f"\nProcessed NPZ verification:")
    print(f"  train.npz images: {train_npz['images'].shape}, labels: {train_npz['labels'].shape}")
    print(f"  val.npz images:   {val_npz['images'].shape}, labels: {val_npz['labels'].shape}")
    print(f"  test.npz images:  {test_npz['images'].shape}, labels: {test_npz['labels'].shape}")

if __name__ == "__main__":
    import numpy as np
    verify_mapping()
    verify_split_isolation()
