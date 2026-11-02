import * as ort from "onnxruntime-web";

// Configure ONNX Runtime Web WASM paths (matching installed onnxruntime-web version)
ort.env.wasm.numThreads = 1;
ort.env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.31.1/dist/";

let sessionPromise = null;
let charMapPromise = null;
let inferenceLock = Promise.resolve();

/**
 * Executes session.run with strict serialization to prevent concurrent WASM/JSEP buffer conflicts.
 */
async function runSessionInferenceSafely(session, feeds) {
  const previousLock = inferenceLock;
  let release;
  inferenceLock = new Promise((res) => { release = res; });

  try {
    await previousLock;
    return await session.run(feeds);
  } finally {
    release();
  }
}

/**
 * Loads the trained KanjiCNN ONNX model and character mapping.
 * Cached so it only loads once per session.
 */
export async function getModelSession() {
  if (!sessionPromise) {
    sessionPromise = (async () => {
      console.log("[KanjiCNN] Loading ONNX model from /model/kanji_cnn.onnx...");
      const session = await ort.InferenceSession.create("/model/kanji_cnn.onnx", {
        executionProviders: ["wasm"],
      });
      console.log("[KanjiCNN] ONNX model session ready!");
      return session;
    })();
  }
  return sessionPromise;
}

export async function getCharMap() {
  if (!charMapPromise) {
    charMapPromise = (async () => {
      const resp = await fetch("/model/char_map.json");
      if (!resp.ok) {
        throw new Error(`Failed to load char_map.json: HTTP ${resp.status}`);
      }
      return await resp.json();
    })();
  }
  return charMapPromise;
}

/**
 * Preprocesses drawn vector strokes into a 64x64 float32 tensor [1, 1, 64, 64].
 * 
 * Pipeline:
 *  1. Calculate bounding box of all strokes.
 *  2. Center and scale stroke geometry to a 48x48 box inside a 64x64 frame.
 *  3. Render anti-aliased white strokes on black background (stroke = 1.0, bg = 0.0).
 *  4. Extract grayscale pixel array matching ETL9B training distribution.
 */
export function preprocessStrokesToTensor(pattern) {
  if (!pattern || pattern.length === 0) return null;

  // 1. Compute bounding box
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let pointCount = 0;

  for (const stroke of pattern) {
    for (const pt of stroke) {
      const [x, y] = pt;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      pointCount++;
    }
  }

  if (pointCount < 2) return null;

  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);
  const maxDim = Math.max(width, height, 15);

  // 2. Setup 64x64 offscreen canvas
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");

  // Pure black background (0.0)
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, 64, 64);

  // Scale character to fit ~50px region (matches ETL9B ~50px average character box)
  const targetSize = 50.0;
  const scale = targetSize / maxDim;
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const offsetX = 32 - centerX * scale;
  const offsetY = 32 - centerY * scale;

  // 3. Render strokes in white (1.0) with rounded line caps
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3.8; // Closely matches ~4px ink thickness of ETL9B handwriting
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (const stroke of pattern) {
    if (!stroke || stroke.length === 0) continue;
    ctx.beginPath();
    ctx.moveTo(stroke[0][0] * scale + offsetX, stroke[0][1] * scale + offsetY);

    for (let i = 1; i < stroke.length; i++) {
      ctx.lineTo(stroke[i][0] * scale + offsetX, stroke[i][1] * scale + offsetY);
    }
    ctx.stroke();
  }

  // 4. Extract pixel intensities into Float32Array [1, 1, 64, 64]
  const imgData = ctx.getImageData(0, 0, 64, 64);
  const floatData = new Float32Array(64 * 64);

  for (let i = 0; i < 64 * 64; i++) {
    // Red channel (grayscale, range 0..255) -> 0.0..1.0
    floatData[i] = imgData.data[i * 4] / 255.0;
  }

  return new ort.Tensor("float32", floatData, [1, 1, 64, 64]);
}

/**
 * Computes softmax probabilities over raw logits.
 */
function softmax(logits) {
  let maxLogit = -Infinity;
  for (let i = 0; i < logits.length; i++) {
    if (logits[i] > maxLogit) maxLogit = logits[i];
  }
  let sumExp = 0;
  const expVals = new Float32Array(logits.length);
  for (let i = 0; i < logits.length; i++) {
    expVals[i] = Math.exp(logits[i] - maxLogit);
    sumExp += expVals[i];
  }
  for (let i = 0; i < logits.length; i++) {
    expVals[i] /= sumExp;
  }
  return expVals;
}

/**
 * Runs client-side recognition using the trained KanjiCNN model.
 * 
 * @param {Array} pattern - Stroke points array from drawing canvas
 * @param {number} topK - Number of top candidate suggestions to return (default: 5)
 * @returns {Promise<Array<{ char: string, confidence: number }>>}
 */
export async function recognizeWithCustomCNN(pattern, topK = 6) {
  const tensor = preprocessStrokesToTensor(pattern);
  if (!tensor) return [];

  try {
    const [session, charMap] = await Promise.all([getModelSession(), getCharMap()]);

    // Run model inference with safe sequential execution
    const outputMap = await runSessionInferenceSafely(session, { input: tensor });
    const logits = outputMap.logits.data; // Float32Array of length 162
    const probs = softmax(logits);

    // Rank classes by probability
    const indexed = [];
    for (let i = 0; i < probs.length; i++) {
      indexed.push({
        index: i,
        confidence: probs[i],
        char: charMap.idx_to_char[i] || charMap.characters[i] || "?",
      });
    }

    indexed.sort((a, b) => b.confidence - a.confidence);
    return indexed.slice(0, topK);
  } catch (err) {
    // If a session error occurs, invalidate the cached session so next call creates a fresh session
    sessionPromise = null;
    throw err;
  }
}
