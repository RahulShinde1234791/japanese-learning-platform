import os
import time
import json
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from torch.optim import AdamW
from torch.optim.lr_scheduler import CosineAnnealingLR
import numpy as np

from model import KanjiCNN

PROCESSED_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "processed")
MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
os.makedirs(MODELS_DIR, exist_ok=True)
CHECKPOINT_PATH = os.path.join(MODELS_DIR, "best_kanji_cnn.pth")
HISTORY_PATH = os.path.join(MODELS_DIR, "training_history.json")

class FastKanjiDataset(Dataset):
    def __init__(self, split="train", augment=False):
        npz_path = os.path.join(PROCESSED_DIR, f"{split}.npz")
        data = np.load(npz_path)
        images_np = data["images"]
        labels_np = data["labels"]

        self.images = torch.from_numpy(images_np).float().unsqueeze(1) / 255.0
        self.labels = torch.from_numpy(labels_np).long()
        self.augment = augment

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, idx):
        img = self.images[idx]
        label = self.labels[idx]

        if self.augment and torch.rand(1).item() > 0.4:
            shift_x = torch.randint(-3, 4, (1,)).item()
            shift_y = torch.randint(-3, 4, (1,)).item()
            img = torch.roll(img, shifts=(shift_y, shift_x), dims=(1, 2))

        return img, label

def compute_top_k_accuracy(logits, targets, k=5):
    top_k_preds = logits.topk(k, dim=1)[1]
    top1_correct = (top_k_preds[:, 0] == targets).sum().item()
    targets_expanded = targets.view(-1, 1).expand_as(top_k_preds)
    topk_correct = (top_k_preds == targets_expanded).any(dim=1).sum().item()
    return top1_correct, topk_correct, targets.size(0)

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

def train_fast(num_epochs=12, batch_size=128, learning_rate=2e-3):
    # Use 4 threads for optimal throughput on Intel hybrid architecture
    torch.set_num_threads(4)
    print("PyTorch configured for 4 threads on Performance cores.", flush=True)

    char_map_path = os.path.join(PROCESSED_DIR, "char_map.json")
    with open(char_map_path, "r", encoding="utf-8") as f:
        char_map = json.load(f)
    num_classes = char_map["num_classes"]

    print("Loading preprocessed datasets into RAM...", flush=True)
    t0 = time.time()
    train_ds = FastKanjiDataset("train", augment=True)
    val_ds = FastKanjiDataset("val", augment=False)
    test_ds = FastKanjiDataset("test", augment=False)
    print(f"Loaded {len(train_ds):,} train, {len(val_ds):,} val, {len(test_ds):,} test in {time.time() - t0:.2f}s", flush=True)

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False)
    test_loader = DataLoader(test_ds, batch_size=batch_size, shuffle=False)

    device = torch.device("cpu")
    model = KanjiCNN(num_classes=num_classes).to(device)
    total_params = sum(p.numel() for p in model.parameters())
    print(f"KanjiCNN initialized: {total_params:,} parameters (~{total_params*4/(1024*1024):.2f} MB)", flush=True)

    criterion = nn.CrossEntropyLoss()
    optimizer = AdamW(model.parameters(), lr=learning_rate, weight_decay=1e-4)
    scheduler = CosineAnnealingLR(optimizer, T_max=num_epochs, eta_min=1e-5)

    best_val_acc = 0.0
    history = {
        "train_loss": [], "train_acc": [],
        "val_loss": [], "val_top1": [], "val_top5": []
    }

    print("\n" + "=" * 78, flush=True)
    print(f"{'Epoch':^7} | {'Train Loss':^10} | {'Train Acc':^9} | {'Val Loss':^9} | {'Val Top-1':^9} | {'Val Top-5':^9} | {'Time':^6}", flush=True)
    print("=" * 78, flush=True)

    for epoch in range(1, num_epochs + 1):
        epoch_start = time.time()
        model.train()

        running_loss = 0.0
        running_correct = 0
        total_train = 0

        for batch_idx, (images, targets) in enumerate(train_loader):
            optimizer.zero_grad()
            logits = model(images)
            loss = criterion(logits, targets)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * targets.size(0)
            preds = logits.argmax(dim=1)
            running_correct += (preds == targets).sum().item()
            total_train += targets.size(0)

            if (batch_idx + 1) % 50 == 0 or (batch_idx + 1) == len(train_loader):
                batch_acc = (running_correct / total_train) * 100.0
                print(f"  [Epoch {epoch:2d}] Batch {batch_idx+1:3d}/{len(train_loader):3d} - Loss: {running_loss/total_train:.4f} - Acc: {batch_acc:.1f}%", flush=True)

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

        print(f"--> Epoch {epoch:2d} Summary: Train {train_acc:5.1f}% | Val Top-1: {val_top1:5.1f}% | Val Top-5: {val_top5:5.1f}% | Took {elapsed:.1f}s", flush=True)
        print("-" * 78, flush=True)

        if val_top1 > best_val_acc:
            best_val_acc = val_top1
            torch.save({
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "val_top1": val_top1,
                "val_top5": val_top5,
                "num_classes": num_classes,
                "char_to_idx": char_map["char_to_idx"],
                "idx_to_char": char_map["idx_to_char"]
            }, CHECKPOINT_PATH)

    print("=" * 78, flush=True)
    print(f"Training completed! Best Validation Top-1: {best_val_acc:.2f}%", flush=True)

    with open(HISTORY_PATH, "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2)

    # Run final test set evaluation
    print("\nRunning final evaluation on Unseen Test Set...", flush=True)
    model.load_state_dict(torch.load(CHECKPOINT_PATH)["model_state_dict"])
    test_loss, test_top1, test_top5 = evaluate(model, test_loader, criterion, device)
    print("=" * 60, flush=True)
    print(f"Final Test Top-1 Accuracy: {test_top1:.2f}%", flush=True)
    print(f"Final Test Top-5 Accuracy: {test_top5:.2f}%", flush=True)
    print("=" * 60, flush=True)

if __name__ == "__main__":
    train_fast(num_epochs=12, batch_size=128, learning_rate=2e-3)
