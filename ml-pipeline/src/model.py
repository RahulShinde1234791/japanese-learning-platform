import torch
import torch.nn as nn
import torch.nn.functional as F

class KanjiCNN(nn.Module):
    """
    Optimized Custom CNN for Japanese Kanji & Kana recognition.
    Designed for fast CPU training and lightweight, low-latency browser inference (~1 MB).
    
    Architecture:
      - 4 Convolutional blocks (Conv2d + BatchNorm + ReLU + MaxPool)
      - Feature channels scale: 1 -> 16 -> 32 -> 64 -> 128
      - Adaptive average pooling to 2x2 spatial grid (512 features)
      - Dense classification head with Dropout regularization
    """
    def __init__(self, num_classes=162, dropout_rate=0.25):
        super().__init__()
        self.num_classes = num_classes

        # Block 1: 1 -> 16 channels. 64x64 -> 32x32
        self.conv1 = nn.Conv2d(1, 16, kernel_size=3, padding=1, bias=False)
        self.bn1 = nn.BatchNorm2d(16)
        self.pool1 = nn.MaxPool2d(kernel_size=2, stride=2)

        # Block 2: 16 -> 32 channels. 32x32 -> 16x16
        self.conv2 = nn.Conv2d(16, 32, kernel_size=3, padding=1, bias=False)
        self.bn2 = nn.BatchNorm2d(32)
        self.pool2 = nn.MaxPool2d(kernel_size=2, stride=2)

        # Block 3: 32 -> 64 channels. 16x16 -> 8x8
        self.conv3 = nn.Conv2d(32, 64, kernel_size=3, padding=1, bias=False)
        self.bn3 = nn.BatchNorm2d(64)
        self.pool3 = nn.MaxPool2d(kernel_size=2, stride=2)

        # Block 4: 64 -> 128 channels. 8x8 -> 2x2
        self.conv4 = nn.Conv2d(64, 128, kernel_size=3, padding=1, bias=False)
        self.bn4 = nn.BatchNorm2d(128)
        self.pool4 = nn.AdaptiveAvgPool2d((2, 2))

        # Classification Head: 128 * 2 * 2 = 512 features -> num_classes
        self.flatten = nn.Flatten()
        self.dropout1 = nn.Dropout(p=dropout_rate)
        self.fc1 = nn.Linear(128 * 2 * 2, 256)
        self.relu = nn.ReLU(inplace=True)
        self.dropout2 = nn.Dropout(p=dropout_rate * 0.75)
        self.fc2 = nn.Linear(256, num_classes)

    def forward(self, x):
        x = self.pool1(self.relu(self.bn1(self.conv1(x))))
        x = self.pool2(self.relu(self.bn2(self.conv2(x))))
        x = self.pool3(self.relu(self.bn3(self.conv3(x))))
        x = self.pool4(self.relu(self.bn4(self.conv4(x))))

        x = self.flatten(x)
        x = self.dropout1(x)
        x = self.fc1(x)
        x = self.relu(x)
        x = self.dropout2(x)
        logits = self.fc2(x)
        return logits

    def predict_top_k(self, x, k=5):
        self.eval()
        with torch.no_grad():
            logits = self.forward(x)
            probs = F.softmax(logits, dim=-1)
            top_probs, top_indices = torch.topk(probs, k=k, dim=-1)
        return top_probs, top_indices

def count_parameters(model):
    total = sum(p.numel() for p in model.parameters())
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    return total, trainable

if __name__ == "__main__":
    model = KanjiCNN(num_classes=162)
    total_params, trainable_params = count_parameters(model)
    print("=" * 60)
    print(f"KanjiCNN Parameters: {total_params:,} (Trainable: {trainable_params:,})")
    dummy = torch.randn(2, 1, 64, 64)
    out = model(dummy)
    print(f"Input: {dummy.shape} -> Output: {out.shape}")
    print("=" * 60)
