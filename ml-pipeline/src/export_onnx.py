import os
import json
import torch
from model import KanjiCNN

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
PROCESSED_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "processed")
CHECKPOINT_PATH = os.path.join(MODELS_DIR, "best_kanji_cnn.pth")
ONNX_EXPORT_PATH = os.path.join(MODELS_DIR, "kanji_cnn.onnx")

PUBLIC_MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "public", "model")

def export_to_onnx():
    if not os.path.exists(CHECKPOINT_PATH):
        raise FileNotFoundError(f"Checkpoint not found at: {CHECKPOINT_PATH}")

    char_map_path = os.path.join(PROCESSED_DIR, "char_map.json")
    with open(char_map_path, "r", encoding="utf-8") as f:
        char_map = json.load(f)
    num_classes = char_map["num_classes"]

    print(f"Loading best checkpoint from {CHECKPOINT_PATH}...")
    checkpoint = torch.load(CHECKPOINT_PATH, map_location="cpu")

    model = KanjiCNN(num_classes=num_classes)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()

    # Dummy input representing single 64x64 grayscale drawing from web canvas: [1, 1, 64, 64]
    dummy_input = torch.randn(1, 1, 64, 64, dtype=torch.float32)

    print(f"Exporting model to ONNX: {ONNX_EXPORT_PATH}...")
    torch.onnx.export(
        model,
        dummy_input,
        ONNX_EXPORT_PATH,
        export_params=True,
        opset_version=14,
        do_constant_folding=True,
        input_names=["input"],
        output_names=["logits"],
        dynamic_axes={
            "input": {0: "batch_size"},
            "logits": {0: "batch_size"}
        }
    )
    file_size_mb = os.path.getsize(ONNX_EXPORT_PATH) / (1024 * 1024)
    print(f"ONNX export succeeded! File size: {file_size_mb:.2f} MB")

    # Copy to public/model/ for web app
    os.makedirs(PUBLIC_MODEL_DIR, exist_ok=True)
    import shutil
    web_onnx = os.path.join(PUBLIC_MODEL_DIR, "kanji_cnn.onnx")
    web_map = os.path.join(PUBLIC_MODEL_DIR, "char_map.json")
    shutil.copy2(ONNX_EXPORT_PATH, web_onnx)
    shutil.copy2(char_map_path, web_map)
    print(f"Copied model and char_map to public folder for React app: {PUBLIC_MODEL_DIR}")

if __name__ == "__main__":
    export_to_onnx()
