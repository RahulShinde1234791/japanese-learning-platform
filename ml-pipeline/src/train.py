import os
import time
import json
import torch
import torch.nn as nn
from torch.optim import AdamW
from torch.optim.lr_scheduler import CosineAnnealingLR

from model import KanjiCNN
from dataset import get_dataloaders, load_char_mapping

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
os.makedirs(MODELS_DIR, exist_ok=True)
CHECKPOINT_PATH = os.path.join(MODELS_DIR, "best_kanji_cnn.pth")
HISTORY_PATH = os.path.join(MODELS_DIR, "training_history.json")

def compute_top_k_accuracy(logits, targets, k=5):
    """
    Computes top-1 and top-k accuracy for a batch.
    """
    batch_size = targets.size(0)
    top_k_preds = logits.topk(k, dim=1)[1]
    
    # Top-1
    top1_correct = (top_k_preds[:, 0] == targets).sum().item()
    
    # Top-k
    targets_expanded = targets.view(-1, 1).expand_as(top_k_preds)
    topk_correct = (top_k_preds == targets_expanded).any(dim=1).sum().item()

    return top1_correct, topk_correct, batch_size

def evaluate(model, val_loader, criterion, device):
    model.eval()
    total_loss = 0.0
    total_top1 = 0
    total_top5 = 0
    total_samples = 0

    with torch.no_grad():
        for images, targets in val_loader:
            images = images.to(device)
            targets = targets.to(device)

            logits = model(images)
            loss = criterion(logits, targets)

            total_loss += loss.item() * targets.size(0)
            top1, top5, count = compute_top_k_accuracy(logits, targets, k=5)
            total_top1 += top1
            total_top5 += top5
            total_samples += count

    avg_loss = total_loss / total_samples
    top1_acc = (total_top1 / total_samples) * 100.0
    top5_acc = (total_top5 / total_samples) * 100.0

    return avg_loss, top1_acc, top5_acc

def train(num_epochs=10, batch_size=64, learning_rate=1e-3):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    char_map = load_char_mapping()
    num_classes = char_map["num_classes"]
    print(f"Total character classes: {num_classes}")

    train_loader, val_loader, test_loader = get_dataloaders(batch_size=batch_size)
    print(f"Dataset: {len(train_loader.dataset):,} train, {len(val_loader.dataset):,} val, {len(test_loader.dataset):,} test")

    model = KanjiCNN(num_classes=num_classes).to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = AdamW(model.parameters(), lr=learning_rate, weight_decay=1e-4)
    scheduler = CosineAnnealingLR(optimizer, T_max=num_epochs, eta_min=1e-5)

    best_val_acc = 0.0
    history = {
        "train_loss": [], "train_acc": [],
        "val_loss": [], "val_top1": [], "val_top5": []
    }

    print("\n" + "=" * 78)
    print(f"{'Epoch':^7} | {'Train Loss':^10} | {'Train Acc':^9} | {'Val Loss':^9} | {'Val Top-1':^9} | {'Val Top-5':^9} | {'Time':^6}")
    print("=" * 78)

    for epoch in range(1, num_epochs + 1):
        epoch_start = time.time()
        model.train()

        running_loss = 0.0
        running_correct = 0
        total_train = 0

        for images, targets in train_loader:
            images = images.to(device)
            targets = targets.to(device)

            optimizer.zero_grad()
            logits = model(images)
            loss = criterion(logits, targets)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * targets.size(0)
            preds = logits.argmax(dim=1)
            running_correct += (preds == targets).sum().item()
            total_train += targets.size(0)

        scheduler.step()

        train_loss = running_loss / total_train
        train_acc = (running_correct / total_train) * 100.0

        val_loss, val_top1, val_top5 = evaluate(model, val_loader, criterion, device)
        elapsed = time.time() - epoch_start

        history["train_loss"].append(round(train_loss, 4))
        history["train_acc"].append(round(train_acc, 2))
        history["val_loss"].append(round(val_loss, 4))
        history["val_top1"].append(round(val_top1, 2))
        history["val_top5"].append(round(val_top5, 2))

        print(f"{epoch:^7} | {train_loss:^10.4f} | {train_acc:^8.2f}% | {val_loss:^9.4f} | {val_top1:^8.2f}% | {val_top5:^8.2f}% | {elapsed:^5.1f}s")

        # Save best checkpoint
        if val_top1 > best_val_acc:
            best_val_acc = val_top1
            torch.save({
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "optimizer_state_dict": optimizer.state_dict(),
                "val_top1": val_top1,
                "val_top5": val_top5,
                "num_classes": num_classes,
                "char_to_idx": char_map["char_to_idx"],
                "idx_to_char": char_map["idx_to_char"]
            }, CHECKPOINT_PATH)

    print("=" * 78)
    print(f"Training completed! Best Validation Top-1 Accuracy: {best_val_acc:.2f}%")
    print(f"Saved best model checkpoint to: {CHECKPOINT_PATH}")

    with open(HISTORY_PATH, "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2)

    return model, test_loader

if __name__ == "__main__":
    train(num_epochs=10, batch_size=64, learning_rate=1e-3)
