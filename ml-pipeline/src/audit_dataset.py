import os
import csv
import json
from collections import defaultdict, Counter

RAW_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "raw", "etl9b", "repacked_etl9b")
METADATA_FILE = os.path.join(RAW_DIR, "metadata.tsv")
CHAR_MAP_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "processed", "char_map.json")

def audit_dataset():
    print("=" * 70)
    print("TASK A: AUDIT OF DATASET VARIANT & SPLITTING METHODOLOGY")
    print("=" * 70)

    # 1. Inspect first 10 rows and all columns
    with open(METADATA_FILE, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f, delimiter="\t")
        columns = reader.fieldnames
        first_few = [next(reader) for _ in range(5)]

    print(f"Metadata Columns: {columns}")
    print("Sample row 0:", first_few[0])

    # 2. Dataset Variant & Sources
    with open(CHAR_MAP_PATH, "r", encoding="utf-8") as f:
        char_map = json.load(f)
    target_chars = set(char_map["char_to_idx"].keys())

    all_sources = Counter()
    char_records = defaultdict(list)
    sheet_set_per_char = {}

    with open(METADATA_FILE, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f, delimiter="\t")
        for row in reader:
            src = row["dataset_source"]
            all_sources[src] += 1
            c = row["char"]
            if c in target_chars:
                char_records[c].append(row)

    print("\nDataset Sources in metadata.tsv:")
    for src, count in all_sources.items():
        print(f"  {src}: {count:,} total records in archive")

    # Check images resolution
    widths = set()
    heights = set()
    for row in first_few:
        widths.add(row["width"])
        heights.add(row["height"])
    print(f"Native record dimensions in metadata: width={widths}, height={heights}")

    # 3. Analyze 201 samples per character
    sample_lengths = {c: len(recs) for c, recs in char_records.items()}
    print(f"\nCharacters analyzed: {len(sample_lengths)}")
    print(f"Samples per character: all 201? {all(v == 201 for v in sample_lengths.values())}")

    # Inspect sample 0..200 sequence of dataset_source and sheet_number
    # Check if every character has identical sequence of (dataset_source, sheet_number)
    reference_char = 'あ'
    ref_seq = [(r['dataset_source'], r['sheet_number']) for r in char_records[reference_char]]

    identical_seq_count = 0
    differing_seqs = []
    for c, recs in char_records.items():
        seq = [(r['dataset_source'], r['sheet_number']) for r in recs]
        if seq == ref_seq:
            identical_seq_count += 1
        else:
            differing_seqs.append(c)

    print(f"\nSequence consistency across all {len(char_records)} characters:")
    print(f"  Characters with IDENTICAL (dataset_source, sheet_number) sequence to '{reference_char}': {identical_seq_count} / {len(char_records)}")
    if differing_seqs:
        print(f"  Characters with differing sequence: {len(differing_seqs)} (e.g. {differing_seqs[:5]})")

    # 4. Examine sheet numbering in ETL9B
    print(f"\nBreakdown of 201 sample slots for '{reference_char}':")
    print(f"  Slot 0:   src={ref_seq[0][0]}, sheet={ref_seq[0][1]}")
    print(f"  Slot 39:  src={ref_seq[39][0]}, sheet={ref_seq[39][1]}")
    print(f"  Slot 40:  src={ref_seq[40][0]}, sheet={ref_seq[40][1]}")
    print(f"  Slot 79:  src={ref_seq[79][0]}, sheet={ref_seq[79][1]}")
    print(f"  Slot 80:  src={ref_seq[80][0]}, sheet={ref_seq[80][1]}")
    print(f"  Slot 119: src={ref_seq[119][0]}, sheet={ref_seq[119][1]}")
    print(f"  Slot 120: src={ref_seq[120][0]}, sheet={ref_seq[120][1]}")
    print(f"  Slot 159: src={ref_seq[159][0]}, sheet={ref_seq[159][1]} (End of Train)")
    print(f"  Slot 160: src={ref_seq[160][0]}, sheet={ref_seq[160][1]} (Start of Val)")
    print(f"  Slot 179: src={ref_seq[179][0]}, sheet={ref_seq[179][1]} (End of Val)")
    print(f"  Slot 180: src={ref_seq[180][0]}, sheet={ref_seq[180][1]} (Start of Test)")
    print(f"  Slot 200: src={ref_seq[200][0]}, sheet={ref_seq[200][1]} (End of Test)")

    # 5. Check slot source files
    train_sources = Counter(ref_seq[i][0] for i in range(0, 160))
    val_sources = Counter(ref_seq[i][0] for i in range(160, 180))
    test_sources = Counter(ref_seq[i][0] for i in range(180, 201))
    print(f"\nTrain slot sources (0..159): {dict(train_sources)}")
    print(f"Val slot sources (160..179):   {dict(val_sources)}")
    print(f"Test slot sources (180..200):  {dict(test_sources)}")

if __name__ == "__main__":
    audit_dataset()
