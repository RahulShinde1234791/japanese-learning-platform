import os
import csv
from PIL import Image
import io
import numpy as np

METADATA_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "raw", "etl9b", "repacked_etl9b", "metadata.tsv")
IMAGES_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "raw", "etl9b", "repacked_etl9b", "images.bin")

# Common JLPT N5 Kanji list (~103 kanji)
N5_KANJI = list(
    "一二三四五六七八九十百千万日月火水木金土前後右左上中下"
    "大小多少南北東西口目耳手足父母子本人男女人友年生先"
    "学学校語何入出外間気天雨道白長半北南西東店話買聞読書食飲立行来休"
    "川山車名午後毎電魚駅花万今分半週"
)

def inspect_chars():
    unique_chars = set()
    with open(METADATA_FILE, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f, delimiter="\t")
        for row in reader:
            unique_chars.add(row["char"])

    # Hiragana: Unicode range 0x3041 to 0x3096
    hiragana_in_dataset = sorted([c for c in unique_chars if '\u3040' <= c <= '\u309f'])
    n5_in_dataset = sorted([c for c in set(N5_KANJI) if c in unique_chars])
    missing_n5 = [c for c in set(N5_KANJI) if c not in unique_chars]

    print(f"Hiragana found in ETL9B: {len(hiragana_in_dataset)} characters")
    print(f"Sample Hiragana: {''.join(hiragana_in_dataset[:20])}")
    print(f"\nJLPT N5 Kanji found in ETL9B: {len(n5_in_dataset)} / {len(set(N5_KANJI))}")
    print(f"Sample N5 Kanji: {''.join(n5_in_dataset[:20])}")
    if missing_n5:
        print(f"Missing N5 Kanji ({len(missing_n5)}): {''.join(missing_n5)}")

    subset_chars = sorted(list(set(hiragana_in_dataset + n5_in_dataset)))
    print(f"\nTotal classes in Option 3 subset: {len(subset_chars)}")
    return subset_chars

def inspect_pixel_values():
    with open(METADATA_FILE, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f, delimiter="\t")
        first_row = next(reader)
    
    start = int(first_row["seek_start"])
    end = int(first_row["seek_end"])
    with open(IMAGES_FILE, "rb") as f:
        f.seek(start)
        data = f.read(end - start)
    
    img = Image.open(io.BytesIO(data))
    arr = np.array(img)
    print(f"\nImage Analysis:")
    print(f" Character: '{first_row['char']}'")
    print(f" Dimensions: {arr.shape} (Height, Width)")
    print(f" Data type: {arr.dtype}")
    print(f" Min pixel: {arr.min()}, Max pixel: {arr.max()}, Mean: {arr.mean():.2f}")
    print(f" Corner pixel (0,0): {arr[0, 0]} (Check if background is 0 or 255)")
    print(f" Center pixel: {arr[arr.shape[0]//2, arr.shape[1]//2]}")
    
    # Check if strokes are dark (0) or light (255)
    corners = [arr[0, 0], arr[0, -1], arr[-1, 0], arr[-1, -1]]
    print(f" Four corners: {corners}")
    if np.mean(corners) < 50:
        print(" Background is DARK (near 0) and strokes are LIGHT (near 255).")
    else:
        print(" Background is LIGHT (near 255) and strokes are DARK (near 0).")

if __name__ == "__main__":
    inspect_chars()
    inspect_pixel_values()
