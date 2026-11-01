import os
import csv
import io
import json
import numpy as np
from PIL import Image

RAW_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "raw", "etl9b", "repacked_etl9b")
PROCESSED_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "processed")
METADATA_FILE = os.path.join(RAW_DIR, "metadata.tsv")
IMAGES_FILE = os.path.join(RAW_DIR, "images.bin")

N5_KANJI = set(
    "一二三四五六七八九十百千万日月火水木金土前後右左上中下"
    "大小多少南北東西口目耳手足父母子本人男女人友年生先"
    "学学校語何入出外間気天雨道白長半北南西東店話買聞読書食飲立行来休"
    "川山車名午後毎電魚駅花万今分半週"
)

def build_subset():
    os.makedirs(PROCESSED_DIR, exist_ok=True)
    print("Scanning metadata to identify classes...")

    # Identify all Hiragana + N5 Kanji present in the dataset
    all_chars = set()
    with open(METADATA_FILE, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f, delimiter="\t")
        for row in reader:
            all_chars.add(row["char"])

    hiragana = [c for c in all_chars if '\u3040' <= c <= '\u309f']
    n5_kanji = [c for c in N5_KANJI if c in all_chars]
    target_chars = sorted(list(set(hiragana + n5_kanji)))

    print(f"Selected {len(target_chars)} classes ({len(hiragana)} Hiragana + {len(n5_kanji)} N5 Kanji).")

    # Build and save character mapping
    char_to_idx = {c: i for i, c in enumerate(target_chars)}
    idx_to_char = {i: c for i, c in enumerate(target_chars)}
    
    char_map_path = os.path.join(PROCESSED_DIR, "char_map.json")
    with open(char_map_path, "w", encoding="utf-8") as f:
        json.dump({
            "num_classes": len(target_chars),
            "char_to_idx": char_to_idx,
            "idx_to_char": idx_to_char,
            "characters": target_chars
        }, f, ensure_ascii=False, indent=2)
    print(f"Saved character mapping to {char_map_path}")

    # Group records per character to guarantee balanced stratified split
    from collections import defaultdict
    char_records = defaultdict(list)

    with open(METADATA_FILE, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f, delimiter="\t")
        for row in reader:
            c = row["char"]
            if c in char_to_idx:
                char_records[c].append(row)

    train_records = []
    val_records = []
    test_records = []

    # For each character, split 201 samples:
    # 0..159: Train (160 samples per class, ~80%)
    # 160..179: Val (20 samples per class, ~10%)
    # 180..200: Test (21 samples per class, ~10%)
    for c in target_chars:
        samples = char_records[c]
        train_records.extend(samples[:160])
        val_records.extend(samples[160:180])
        test_records.extend(samples[180:])

    print(f"\nSplit distribution:")
    print(f" Train: {len(train_records):,} samples (~{len(train_records)/len(target_chars):.1f} per class)")
    print(f" Val:   {len(val_records):,} samples (~{len(val_records)/len(target_chars):.1f} per class)")
    print(f" Test:  {len(test_records):,} samples (~{len(test_records)/len(target_chars):.1f} per class)")

    def extract_tensors(records, name):
        print(f"\nProcessing {name} set ({len(records)} images)...")
        images = np.zeros((len(records), 64, 64), dtype=np.uint8)
        labels = np.zeros(len(records), dtype=np.int64)

        with open(IMAGES_FILE, "rb") as bin_f:
            for i, rec in enumerate(records):
                start = int(rec["seek_start"])
                end = int(rec["seek_end"])
                bin_f.seek(start)
                raw_bytes = bin_f.read(end - start)
                
                # Open PNG
                img = Image.open(io.BytesIO(raw_bytes))
                arr = np.array(img, dtype=np.uint8)
                
                # If boolean, convert True -> 255, False -> 0
                if arr.max() <= 1:
                    arr = arr * 255

                # Dimensions are (63, 64) -> pad 1 row to make 64x64 square
                h, w = arr.shape
                if h == 63 and w == 64:
                    # Pad 1 row at bottom
                    padded = np.pad(arr, ((0, 1), (0, 0)), mode="constant", constant_values=0)
                else:
                    # Generic center-pad or resize to 64x64
                    padded = np.zeros((64, 64), dtype=np.uint8)
                    padded[:min(h, 64), :min(w, 64)] = arr[:min(h, 64), :min(w, 64)]

                images[i] = padded
                labels[i] = char_to_idx[rec["char"]]

                if (i + 1) % 5000 == 0 or (i + 1) == len(records):
                    print(f"  Processed {i + 1}/{len(records)} images...")

        out_path = os.path.join(PROCESSED_DIR, f"{name}.npz")
        np.savez_compressed(out_path, images=images, labels=labels)
        print(f" Saved {out_path} ({os.path.getsize(out_path) / (1024*1024):.2f} MB)")

    extract_tensors(train_records, "train")
    extract_tensors(val_records, "val")
    extract_tensors(test_records, "test")

    print("\nPreprocessing and caching completed successfully!")

if __name__ == "__main__":
    build_subset()
