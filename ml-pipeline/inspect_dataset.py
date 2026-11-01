import os
import csv
import io

DATA_DIR = os.path.join(os.path.dirname(__file__), "data", "raw", "etl9b", "repacked_etl9b")
METADATA_FILE = os.path.join(DATA_DIR, "metadata.tsv")
IMAGES_FILE = os.path.join(DATA_DIR, "images.bin")

def inspect_without_deps():
    print(f"Inspecting {METADATA_FILE}...")
    char_counts = {}
    total_records = 0
    first_rows = []

    with open(METADATA_FILE, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f, delimiter="\t")
        for row in reader:
            total_records += 1
            c = row.get("char")
            char_counts[c] = char_counts.get(c, 0) + 1
            if len(first_rows) < 5:
                first_rows.append(row)

    print(f"\nTotal Records: {total_records:,}")
    print(f"Unique Characters (Classes): {len(char_counts):,}")
    sample_chars = list(char_counts.keys())[:30]
    print(f"Sample characters: {''.join(sample_chars)}")
    
    counts = list(char_counts.values())
    print(f"Samples per character: min={min(counts)}, max={max(counts)}, average={sum(counts)/len(counts):.1f}")
    
    print("\nFirst 3 Records in Metadata:")
    for i, r in enumerate(first_rows[:3]):
        print(f" Record {i}: {r}")

    # Inspect first image payload
    first = first_rows[0]
    start = int(first["seek_start"])
    end = int(first["seek_end"])
    size = end - start
    print(f"\nChecking first image binary payload ({size} bytes):")
    with open(IMAGES_FILE, "rb") as f:
        f.seek(start)
        header = f.read(16)
        print(" First 16 bytes (hex):", header.hex())
        if header.startswith(b"\x89PNG\r\n\x1a\n"):
            print(" Payload format: Standard PNG image!")
        elif header.startswith(b"\xff\xd8"):
            print(" Payload format: JPEG image!")

if __name__ == "__main__":
    inspect_without_deps()
