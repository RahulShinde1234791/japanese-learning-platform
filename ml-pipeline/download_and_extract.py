import os
import sys
import urllib.request
import tarfile
import time

URL = "https://github.com/ichisadashioko/etlcdb/releases/download/v0.0.5/repacked_etl9b.tar.gz"
DEST_DIR = os.path.join(os.path.dirname(__file__), "data", "raw")
ARCHIVE_PATH = os.path.join(DEST_DIR, "repacked_etl9b.tar.gz")
EXTRACT_DIR = os.path.join(DEST_DIR, "etl9b")

os.makedirs(DEST_DIR, exist_ok=True)

def download_file(url, dest_path):
    print(f"Connecting to {url}...")
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
    with urllib.request.urlopen(req) as resp:
        total_size = int(resp.getheader("Content-Length", 0))
        total_mb = total_size / (1024 * 1024)
        print(f"File size: {total_mb:.2f} MB")
        
        downloaded = 0
        chunk_size = 1024 * 1024  # 1 MB chunks
        start_time = time.time()
        last_print = 0

        with open(dest_path, "wb") as f:
            while True:
                chunk = resp.read(chunk_size)
                if not chunk:
                    break
                f.write(chunk)
                downloaded += len(chunk)
                
                now = time.time()
                if now - last_print > 1.0 or downloaded == total_size:
                    elapsed = max(now - start_time, 0.001)
                    speed = (downloaded / (1024 * 1024)) / elapsed
                    percent = (downloaded / total_size) * 100 if total_size else 0
                    print(f"Progress: {downloaded / (1024*1024):.1f}/{total_mb:.1f} MB ({percent:.1f}%) - {speed:.2f} MB/s")
                    last_print = now

    print(f"Download complete: {dest_path}")

def extract_archive(archive_path, extract_to):
    print(f"Extracting {archive_path} to {extract_to}...")
    os.makedirs(extract_to, exist_ok=True)
    with tarfile.open(archive_path, "r:gz") as tar:
        tar.extractall(path=extract_to)
    print("Extraction complete!")

def inspect_extracted(extract_to):
    print("\n--- Extracted Contents ---")
    total_size = 0
    for root, dirs, files in os.walk(extract_to):
        for f in files:
            fp = os.path.join(root, f)
            sz = os.path.getsize(fp)
            total_size += sz
            rel = os.path.relpath(fp, extract_to)
            print(f"  {rel} ({sz / (1024*1024):.2f} MB)")
    print(f"Total size on disk: {total_size / (1024*1024):.2f} MB")

if __name__ == "__main__":
    if not os.path.exists(ARCHIVE_PATH) or os.path.getsize(ARCHIVE_PATH) < 160 * 1024 * 1024:
        download_file(URL, ARCHIVE_PATH)
    else:
        print(f"Archive already downloaded ({os.path.getsize(ARCHIVE_PATH) / (1024*1024):.2f} MB).")

    if not os.path.exists(EXTRACT_DIR) or len(os.listdir(EXTRACT_DIR)) == 0:
        extract_archive(ARCHIVE_PATH, EXTRACT_DIR)
    else:
        print(f"Already extracted in {EXTRACT_DIR}.")

    inspect_extracted(EXTRACT_DIR)
