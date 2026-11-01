import os
import torch
import torch.nn as nn
from model import KanjiCNN
from dataset import get_dataloaders, load_char_mapping
from train import compute_top_k_accuracy

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
CHECKPOINT_PATH = os.path.join(MODELS_DIR, "best_kanji_cnn.pth")

def evaluate_test_set():
    if not os.path.exists(CHECKPOINT_PATH):
        raise FileNotFoundError(f"Model checkpoint not found: {CHECKPOINT_PATH}")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Loading checkpoint from {CHECKPOINT_PATH}...")
    checkpoint = torch.load(CHECKPOINT_PATH, map_location=device)

    char_map = load_char_mapping()
    num_classes = checkpoint["num_classes"]
    model = KanjiCNN(num_classes=num_classes).to(device)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()

    _, _, test_loader = get_dataloaders(batch_size=64)
    print(f"Evaluating on Test Set ({len(test_loader.dataset):,} unseen handwritten samples)...")

    criterion = nn.CrossEntropyLoss()
    total_loss = 0.0
    total_top1 = 0
    total_top5 = 0
    total_samples = 0

    class_correct = {i: 0 for i in range(num_classes)}
    class_total = {i: 0 for i in range(num_classes)}

    with torch.no_grad():
        for images, targets in test_loader:
            images = images.to(device)
            targets = targets.to(device)

            logits = model(images)
            loss = criterion(logits, targets)

            total_loss += loss.item() * targets.size(0)
            top1, top5, count = compute_top_k_accuracy(logits, targets, k=5)
            total_top1 += top1
            total_top5 += top5
            total_samples += count

            preds = logits.argmax(dim=1)
            for p, t in zip(preds, targets):
                if p == t:
                    class_correct[t.item()] += 1
                class_total[t.item()] += 1

    test_loss = total_loss / total_samples
    test_top1 = (total_top1 / total_samples) * 100.0
    test_top5 = (total_top5 / total_samples) * 100.0

    print("=" * 60)
    print("Test Set Final Evaluation Results")
    print("=" * 60)
    print(f"Test Loss:            {test_loss:.4f}")
    print(f"Top-1 Accuracy:       {test_top1:.2f}% (Exact 1st choice match)")
    print(f"Top-5 Accuracy:       {test_top5:.2f}% (Target in Top 5 suggestions)")
    print("=" * 60)

    # Find characters with lowest accuracy for error analysis
    accuracies = []
    for c_idx in range(num_classes):
        acc = (class_correct[c_idx] / class_total[c_idx]) * 100.0 if class_total[c_idx] > 0 else 0
        char_symbol = char_map["idx_to_char"][str(c_idx)]
        accuracies.append((char_symbol, acc, class_correct[c_idx], class_total[c_idx]))

    accuracies.sort(key=lambda x: x[1])
    print("\nMost Challenging Characters in Test Set:")
    for char_sym, acc, corr, tot in accuracies[:8]:
        print(f"  '{char_sym}': {acc:.1f}% ({corr}/{tot} correct)")

    print("\nHighest Accuracy Characters in Test Set:")
    for char_sym, acc, corr, tot in accuracies[-8:]:
        print(f"  '{char_sym}': {acc:.1f}% ({corr}/{tot} correct)")
    print("=" * 60)

if __name__ == "__main__":
    evaluate_test_set()
