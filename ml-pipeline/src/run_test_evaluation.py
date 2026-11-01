import os
import json
import csv
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F

from model import KanjiCNN

PROCESSED_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "processed")
MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
REPORTS_DIR = os.path.join(os.path.dirname(__file__), "..", "reports")
os.makedirs(REPORTS_DIR, exist_ok=True)

CHECKPOINT_PATH = os.path.join(MODELS_DIR, "best_kanji_cnn.pth")
TEST_DATA_PATH = os.path.join(PROCESSED_DIR, "test.npz")
CHAR_MAP_PATH = os.path.join(PROCESSED_DIR, "char_map.json")

def run_evaluation():
    print("=" * 70)
    print("KanjiCNN Held-Out Test Set Evaluation")
    print("=" * 70)

    # 1. Load Character Mapping
    with open(CHAR_MAP_PATH, "r", encoding="utf-8") as f:
        char_map = json.load(f)
    num_classes = char_map["num_classes"]
    idx_to_char = {int(k): v for k, v in char_map["idx_to_char"].items()}
    char_to_idx = char_map["char_to_idx"]

    # 2. Load Model Checkpoint
    device = torch.device("cpu")
    print(f"Loading checkpoint from: {CHECKPOINT_PATH}")
    checkpoint = torch.load(CHECKPOINT_PATH, map_location=device)
    
    assert checkpoint["num_classes"] == num_classes, f"Class mismatch: {checkpoint['num_classes']} vs {num_classes}"
    assert checkpoint["char_to_idx"] == char_to_idx, "Character index mapping mismatch!"
    
    model = KanjiCNN(num_classes=num_classes).to(device)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()
    print(f"Loaded KanjiCNN (Best Checkpoint from Epoch {checkpoint.get('epoch')})")

    # 3. Load Test Dataset
    print(f"Loading test set from: {TEST_DATA_PATH}")
    test_data = np.load(TEST_DATA_PATH)
    test_images_np = test_data["images"]
    test_labels_np = test_data["labels"]
    num_samples = len(test_labels_np)
    print(f"Total test samples: {num_samples:,} (Expected: 3,402)")
    assert num_samples == 3402, f"Expected 3,402 test samples, got {num_samples}"

    test_images = torch.from_numpy(test_images_np).float().unsqueeze(1) / 255.0
    test_labels = torch.from_numpy(test_labels_np).long()

    # 4. Run Evaluation in Batches
    batch_size = 128
    criterion = nn.CrossEntropyLoss(reduction="sum")

    total_loss = 0.0
    top1_correct = 0
    top5_correct = 0

    confusion_matrix = np.zeros((num_classes, num_classes), dtype=np.int64)
    per_class_correct = np.zeros(num_classes, dtype=np.int64)
    per_class_total = np.zeros(num_classes, dtype=np.int64)

    confused_pairs = {}  # (true_char, pred_char) -> count

    with torch.no_grad():
        for start_idx in range(0, num_samples, batch_size):
            end_idx = min(start_idx + batch_size, num_samples)
            batch_imgs = test_images[start_idx:end_idx].to(device)
            batch_lbls = test_labels[start_idx:end_idx].to(device)

            logits = model(batch_imgs)
            loss = criterion(logits, batch_lbls)
            total_loss += loss.item()

            # Top-1 predictions
            preds = logits.argmax(dim=1)
            
            # Top-5 predictions
            top5_preds = logits.topk(5, dim=1)[1]
            targets_expanded = batch_lbls.view(-1, 1).expand_as(top5_preds)
            batch_top5 = (top5_preds == targets_expanded).any(dim=1).sum().item()
            top5_correct += batch_top5

            for true_idx, pred_idx in zip(batch_lbls.cpu().numpy(), preds.cpu().numpy()):
                confusion_matrix[true_idx, pred_idx] += 1
                per_class_total[true_idx] += 1
                if true_idx == pred_idx:
                    top1_correct += 1
                    per_class_correct[true_idx] += 1
                else:
                    true_c = idx_to_char[true_idx]
                    pred_c = idx_to_char[pred_idx]
                    pair = (true_c, pred_c)
                    confused_pairs[pair] = confused_pairs.get(pair, 0) + 1

    test_loss = total_loss / num_samples
    test_top1_acc = (top1_correct / num_samples) * 100.0
    test_top5_acc = (top5_correct / num_samples) * 100.0

    print("-" * 70)
    print(f"Test Loss:           {test_loss:.4f}")
    print(f"Test Top-1 Accuracy: {test_top1_acc:.2f}% ({top1_correct}/{num_samples} exact matches)")
    print(f"Test Top-5 Accuracy: {test_top5_acc:.2f}% ({top5_correct}/{num_samples} in top 5 suggestions)")
    print("-" * 70)

    # 5. Compile Per-Class Metrics
    per_class_results = []
    for idx in range(num_classes):
        char = idx_to_char[idx]
        total = int(per_class_total[idx])
        correct = int(per_class_correct[idx])
        acc = (correct / total * 100.0) if total > 0 else 0.0
        is_hiragana = '\u3040' <= char <= '\u309f'
        per_class_results.append({
            "class_index": idx,
            "character": char,
            "category": "Hiragana" if is_hiragana else "N5 Kanji",
            "total_samples": total,
            "correct_samples": correct,
            "accuracy_pct": round(acc, 2)
        })

    # Sort by accuracy ascending (lowest first)
    sorted_by_acc = sorted(per_class_results, key=lambda x: x["accuracy_pct"])
    print("\nCharacters with Lowest Test Accuracy:")
    for item in sorted_by_acc[:10]:
        print(f"  '{item['character']}' ({item['category']}): {item['accuracy_pct']:.1f}% ({item['correct_samples']}/{item['total_samples']})")

    print("\nCharacters with Perfect (100%) Test Accuracy:")
    perfect_count = sum(1 for x in per_class_results if x["accuracy_pct"] == 100.0)
    print(f"  {perfect_count} out of {num_classes} characters ({perfect_count/num_classes*100:.1f}%) achieved 100% accuracy on all test samples!")

    # 6. Top Confused Character Pairs
    sorted_confusions = sorted(confused_pairs.items(), key=lambda x: x[1], reverse=True)
    print("\nMost Frequently Confused Character Pairs:")
    top_confused_list = []
    for (true_c, pred_c), cnt in sorted_confusions[:15]:
        print(f"  True: '{true_c}' -> Misclassified as: '{pred_c}' ({cnt} times)")
        top_confused_list.append({"true_char": true_c, "predicted_char": pred_c, "count": cnt})

    # 7. Save Reports
    # A. JSON results
    json_path = os.path.join(REPORTS_DIR, "evaluation_results.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({
            "checkpoint_evaluated": os.path.basename(CHECKPOINT_PATH),
            "checkpoint_epoch": checkpoint.get("epoch"),
            "num_test_samples": num_samples,
            "num_classes": num_classes,
            "test_loss": round(test_loss, 4),
            "test_top1_accuracy_pct": round(test_top1_acc, 2),
            "test_top5_accuracy_pct": round(test_top5_acc, 2),
            "perfect_accuracy_classes": perfect_count,
            "top_confused_pairs": top_confused_list,
            "per_class_results": per_class_results
        }, f, ensure_ascii=False, indent=2)
    print(f"\nSaved JSON metrics to: {json_path}")

    # B. CSV per-class accuracy
    csv_per_class_path = os.path.join(REPORTS_DIR, "per_class_accuracy.csv")
    with open(csv_per_class_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["class_index", "character", "category", "total_samples", "correct_samples", "accuracy_pct"])
        writer.writeheader()
        writer.writerows(per_class_results)
    print(f"Saved per-class CSV to: {csv_per_class_path}")

    # C. CSV confusion matrix
    cm_csv_path = os.path.join(REPORTS_DIR, "confusion_matrix.csv")
    with open(cm_csv_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        header = ["True\\Pred"] + [idx_to_char[i] for i in range(num_classes)]
        writer.writerow(header)
        for i in range(num_classes):
            row = [idx_to_char[i]] + list(confusion_matrix[i])
            writer.writerow(row)
    print(f"Saved confusion matrix CSV to: {cm_csv_path}")

    # D. Markdown Summary Report
    md_path = os.path.join(REPORTS_DIR, "test_evaluation_summary.md")
    with open(md_path, "w", encoding="utf-8") as f:
        f.write("# KanjiCNN Evaluation Report: Held-Out Test Set\n\n")
        f.write(f"- **Evaluated Checkpoint:** `{os.path.basename(CHECKPOINT_PATH)}` (Epoch {checkpoint.get('epoch')})\n")
        f.write(f"- **Test Set Size:** {num_samples:,} images (21 samples/class across 162 classes)\n")
        f.write(f"- **Classes:** 162 (71 Hiragana + 91 JLPT N5 Kanji)\n\n")
        
        f.write("## Overall Metrics\n\n")
        f.write(f"| Metric | Value |\n| :--- | :--- |\n")
        f.write(f"| **Test Top-1 Accuracy** | **{test_top1_acc:.2f}%** ({top1_correct}/{num_samples}) |\n")
        f.write(f"| **Test Top-5 Accuracy** | **{test_top5_acc:.2f}%** ({top5_correct}/{num_samples}) |\n")
        f.write(f"| **Test Cross-Entropy Loss** | **{test_loss:.4f}** |\n")
        f.write(f"| **Perfect Accuracy Classes (100%)** | **{perfect_count} / {num_classes}** ({perfect_count/num_classes*100:.1f}%) |\n\n")

        f.write("## Most Frequently Confused Character Pairs\n\n")
        f.write("| True Character | Misclassified As | Misclassification Count |\n")
        f.write("| :---: | :---: | :---: |\n")
        for item in top_confused_list[:12]:
            f.write(f"| {item['true_char']} | {item['predicted_char']} | {item['count']} |\n")

        f.write("\n## Characters with Lowest Accuracy\n\n")
        f.write("| Character | Category | Accuracy | Correct / Total |\n")
        f.write("| :---: | :---: | :---: | :---: |\n")
        for item in sorted_by_acc[:10]:
            f.write(f"| {item['character']} | {item['category']} | {item['accuracy_pct']:.1f}% | {item['correct_samples']} / {item['total_samples']} |\n")

    print(f"Saved Markdown summary report to: {md_path}")
    print("=" * 70)
    print("Evaluation Complete!")

if __name__ == "__main__":
    run_evaluation()
