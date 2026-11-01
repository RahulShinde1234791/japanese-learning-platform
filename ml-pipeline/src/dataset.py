import os
import json
import numpy as np
import torch
from torch.utils.data import Dataset, DataLoader
import torchvision.transforms.v2 as transforms

PROCESSED_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "processed")

class KanjiKanaDataset(Dataset):
    """
    PyTorch Dataset for handwritten Hiragana & JLPT N5 Kanji characters.
    Loads pre-cached 64x64 numpy arrays and yields normalized PyTorch tensors.
    """
    def __init__(self, split="train", augment=False):
        assert split in ("train", "val", "test"), f"Unknown split: {split}"
        self.split = split
        self.augment = augment

        npz_path = os.path.join(PROCESSED_DIR, f"{split}.npz")
        if not os.path.exists(npz_path):
            raise FileNotFoundError(f"Missing cached file: {npz_path}. Run preprocess_and_cache.py first.")

        data = np.load(npz_path)
        # Shape: (N, 64, 64), dtype: uint8 [0, 255]
        self.images = data["images"]
        # Shape: (N,), dtype: int64
        self.labels = data["labels"]

        # Data augmentation for training
        if self.augment:
            self.transform = transforms.Compose([
                transforms.RandomRotation(degrees=(-8, 8)),
                transforms.RandomAffine(degrees=0, translate=(0.06, 0.06), scale=(0.94, 1.06)),
            ])
        else:
            self.transform = None

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, idx):
        # 64x64 uint8 array -> float tensor in range [0.0, 1.0]
        img_np = self.images[idx]
        # Shape: [1, 64, 64]
        img_tensor = torch.from_numpy(img_np).float().unsqueeze(0) / 255.0
        label = self.labels[idx]

        if self.transform is not None:
            img_tensor = self.transform(img_tensor)

        return img_tensor, label

def get_dataloaders(batch_size=64, num_workers=0):
    train_ds = KanjiKanaDataset(split="train", augment=True)
    val_ds = KanjiKanaDataset(split="val", augment=False)
    test_ds = KanjiKanaDataset(split="test", augment=False)

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True, num_workers=num_workers)
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False, num_workers=num_workers)
    test_loader = DataLoader(test_ds, batch_size=batch_size, shuffle=False, num_workers=num_workers)

    return train_loader, val_loader, test_loader

def load_char_mapping():
    path = os.path.join(PROCESSED_DIR, "char_map.json")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

if __name__ == "__main__":
    char_map = load_char_mapping()
    print(f"Loaded character mapping with {char_map['num_classes']} classes.")

    train_loader, val_loader, test_loader = get_dataloaders(batch_size=32)
    print(f"Train batches: {len(train_loader)} (Total images: {len(train_loader.dataset):,})")
    print(f"Val batches:   {len(val_loader)} (Total images: {len(val_loader.dataset):,})")
    print(f"Test batches:  {len(test_loader)} (Total images: {len(test_loader.dataset):,})")

    # Fetch one batch to verify shapes and values
    images, labels = next(iter(train_loader))
    print(f"\nBatch Tensor Shape: {images.shape} (Batch, Channels, Height, Width)")
    print(f"Labels Tensor Shape: {labels.shape}")
    print(f"Tensor dtype: {images.dtype}, min: {images.min():.3f}, max: {images.max():.3f}")
    
    first_char = char_map["idx_to_char"][str(labels[0].item())]
    print(f"First image in batch represents character: '{first_char}' (Class index: {labels[0].item()})")
