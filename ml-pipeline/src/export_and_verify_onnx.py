import os
import json
import numpy as np
import torch
import onnx
import onnxruntime as ort

from model import KanjiCNN

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
PROCESSED_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "processed")
REPORTS_DIR = os.path.join(os.path.dirname(__file__), "..", "reports")
os.makedirs(REPORTS_DIR, exist_ok=True)

CHECKPOINT_PATH = os.path.join(MODELS_DIR, "best_kanji_cnn.pth")
ONNX_OUTPUT_PATH = os.path.join(MODELS_DIR, "kanji_cnn.onnx")
CHAR_MAP_PATH = os.path.join(PROCESSED_DIR, "char_map.json")
TEST_DATA_PATH = os.path.join(PROCESSED_DIR, "test.npz")

def export_and_verify():
    print("=" * 70)
    print("TASK B: ONNX EXPORT AND NUMERICAL VERIFICATION")
    print("=" * 70)

    # 1. Load Char Map & Checkpoint
    with open(CHAR_MAP_PATH, "r", encoding="utf-8") as f:
        char_map = json.load(f)
    num_classes = char_map["num_classes"]
    print(f"Number of classes: {num_classes}")

    print(f"Loading PyTorch checkpoint from: {CHECKPOINT_PATH}")
    checkpoint = torch.load(CHECKPOINT_PATH, map_location="cpu")
    print(f"Checkpoint metadata: Epoch={checkpoint.get('epoch')}, Val Top-1={checkpoint.get('val_top1'):.2f}%")

    model = KanjiCNN(num_classes=num_classes)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()

    # 2. Prepare Dummy Input & Export to ONNX
    dummy_input = torch.randn(1, 1, 64, 64, dtype=torch.float32)
    print(f"Dummy input shape: {dummy_input.shape} (dtype: {dummy_input.dtype})")

    print(f"Exporting model to ONNX: {ONNX_OUTPUT_PATH}...")
    torch.onnx.export(
        model,
        dummy_input,
        ONNX_OUTPUT_PATH,
        export_params=True,
        opset_version=14,
        do_constant_folding=True,
        dynamo=False,
        input_names=["input"],
        output_names=["logits"],
        dynamic_axes={
            "input": {0: "batch_size"},
            "logits": {0: "batch_size"}
        }
    )
    onnx_file_size_bytes = os.path.getsize(ONNX_OUTPUT_PATH)
    onnx_file_size_mb = onnx_file_size_bytes / (1024 * 1024)
    print(f"ONNX export completed! File size: {onnx_file_size_mb:.2f} MB ({onnx_file_size_bytes:,} bytes)")

    # 3. Structural Validation with ONNX Checker
    print("\n--- Structural Verification with ONNX Library ---")
    onnx_model = onnx.load(ONNX_OUTPUT_PATH)
    onnx.checker.check_model(onnx_model)
    print("onnx.checker.check_model(): Passed without errors!")

    # Inspect Graph Inputs and Outputs
    graph = onnx_model.graph
    input_tensor = graph.input[0]
    output_tensor = graph.output[0]

    input_dim = [d.dim_value if d.dim_value > 0 else d.dim_param for d in input_tensor.type.tensor_type.shape.dim]
    output_dim = [d.dim_value if d.dim_value > 0 else d.dim_param for d in output_tensor.type.tensor_type.shape.dim]
    print(f"ONNX Input Name:   '{input_tensor.name}', Shape: {input_dim}")
    print(f"ONNX Output Name:  '{output_tensor.name}', Shape: {output_dim}")

    # 4. Numerical Comparison: PyTorch vs ONNX Runtime on Test Batch
    print("\n--- Numerical Verification: PyTorch vs ONNX Runtime ---")
    test_npz = np.load(TEST_DATA_PATH)
    batch_size = 32
    test_images_sample = test_npz["images"][:batch_size]  # uint8 (32, 64, 64)
    test_labels_sample = test_npz["labels"][:batch_size]

    # Convert to float tensor [32, 1, 64, 64]
    input_torch = torch.from_numpy(test_images_sample).float().unsqueeze(1) / 255.0
    input_numpy = input_torch.numpy()

    # PyTorch inference
    with torch.no_grad():
        pytorch_logits = model(input_torch).numpy()
    pytorch_preds = np.argmax(pytorch_logits, axis=1)

    # ONNX Runtime inference
    session = ort.InferenceSession(ONNX_OUTPUT_PATH, providers=["CPUExecutionProvider"])
    onnx_inputs = {"input": input_numpy}
    onnx_outputs = session.run(["logits"], onnx_inputs)
    onnx_logits = onnx_outputs[0]
    onnx_preds = np.argmax(onnx_logits, axis=1)

    # Compute numerical differences
    abs_diff = np.abs(pytorch_logits - onnx_logits)
    max_abs_err = float(np.max(abs_diff))
    mean_abs_err = float(np.mean(abs_diff))
    preds_match = bool(np.array_equal(pytorch_preds, onnx_preds))
    num_matches = int(np.sum(pytorch_preds == onnx_preds))

    print(f"Batch size tested:       {batch_size}")
    print(f"PyTorch output shape:    {pytorch_logits.shape}")
    print(f"ONNX output shape:       {onnx_logits.shape}")
    print(f"Maximum Absolute Error:  {max_abs_err:.2e}")
    print(f"Mean Absolute Error:     {mean_abs_err:.2e}")
    print(f"Prediction Match:        {preds_match} ({num_matches}/{batch_size} exactly identical class predictions)")

    # Test single-image input shape [1, 1, 64, 64] (as will be used in web browser)
    single_img_numpy = input_numpy[:1]
    single_onnx_out = session.run(["logits"], {"input": single_img_numpy})[0]
    single_pred_idx = int(np.argmax(single_onnx_out, axis=1)[0])
    true_char = char_map["idx_to_char"][str(test_labels_sample[0])]
    pred_char = char_map["idx_to_char"][str(single_pred_idx)]
    print(f"Single image test [1, 1, 64, 64]: Predicted='{pred_char}', True='{true_char}', Match={pred_char == true_char}")

    # 5. Save Export & Verification Report
    export_report = {
        "onnx_model_path": os.path.relpath(ONNX_OUTPUT_PATH, start=os.path.dirname(MODELS_DIR)),
        "file_size_bytes": onnx_file_size_bytes,
        "file_size_mb": round(onnx_file_size_mb, 2),
        "input_name": input_tensor.name,
        "input_shape": [str(d) for d in input_dim],
        "output_name": output_tensor.name,
        "output_shape": [str(d) for d in output_dim],
        "opset_version": 14,
        "test_batch_size": batch_size,
        "max_absolute_error": max_abs_err,
        "mean_absolute_error": mean_abs_err,
        "all_predictions_matched": preds_match,
        "single_sample_inference": {
            "true_character": true_char,
            "predicted_character": pred_char,
            "match": pred_char == true_char
        }
    }
    report_json_path = os.path.join(REPORTS_DIR, "onnx_export_verification.json")
    with open(report_json_path, "w", encoding="utf-8") as f:
        json.dump(export_report, f, ensure_ascii=False, indent=2)
    print(f"Saved ONNX verification report to: {report_json_path}")
    print("=" * 70)
    print("Task B Export and Verification Complete!")

if __name__ == "__main__":
    export_and_verify()
