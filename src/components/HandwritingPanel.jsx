import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Loads an external script dynamically if not already loaded.
 */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = (err) => reject(err);
    document.body.appendChild(script);
  });
}

const japaneseRegex = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u;

/**
 * Recognizes Japanese handwriting strokes via Google's neural handwriting API.
 */
async function recognizeWithGoogle(pattern, width = 300, height = 300) {
  if (!pattern || pattern.length === 0) return [];

  const ink = pattern.map((stroke, sIdx) => {
    const xs = stroke.map((p) => Math.round(p[0]));
    const ys = stroke.map((p) => Math.round(p[1]));
    const ts = stroke.map((_, i) => sIdx * 500 + i * 20);
    return [xs, ys, ts];
  });

  const payload = {
    app_version: 0.4,
    api_level: "537.36",
    device: "537.36",
    input_type: "0",
    options: "enable_pre_space",
    requests: [
      {
        writing_guide: { writing_area_width: width, writing_area_height: height },
        ink: ink,
        language: "ja",
      },
    ],
  };

  const response = await fetch(
    "https://inputtools.google.com/request?itc=ja-t-i0-handwrit&app=translate",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    throw new Error(`Handwriting API returned status ${response.status}`);
  }

  const data = await response.json();
  if (data[0] === "SUCCESS" && data[1]?.[0]?.[1]) {
    const rawCandidates = data[1][0][1];
    // Prioritize Japanese characters (Kanji, Hiragana, Katakana)
    const jpOnly = rawCandidates.filter((char) => japaneseRegex.test(char));
    const nonJp = rawCandidates.filter((char) => !japaneseRegex.test(char));
    return [...new Set([...jpOnly, ...nonJp])].slice(0, 12);
  }

  return [];
}

/**
 * Fallback local pattern recognition using KanjiCanvas.
 */
function recognizeWithLocalCanvas(canvasId) {
  if (!window.KanjiCanvas) return [];

  if (window.refPatterns && window.KanjiCanvas.refPatterns?.length === 0) {
    window.KanjiCanvas.refPatterns = window.refPatterns;
  }

  const result = window.KanjiCanvas.recognize(canvasId);
  if (!result) return [];

  return result
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 10);
}

export default function HandwritingPanel({
  onSearch,
  onAddKanji,
  onAddVocab,
  onClose,
}) {
  const canvasId = "kanjiHandwritingCanvas";
  const [engineMode, setEngineMode] = useState("neural"); // "neural" or "local"
  const [candidates, setCandidates] = useState([]);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [strokeCount, setStrokeCount] = useState(0);
  const [autoRecognize, setAutoRecognize] = useState(true);
  const debounceTimerRef = useRef(null);
  const canvasRef = useRef(null);

  // Initialize KanjiCanvas on mount as fallback and stroke tracker
  useEffect(() => {
    let isMounted = true;

    async function initEngine() {
      try {
        await loadScript("/kanji-canvas.min.js");
        await loadScript("/ref-patterns.js");

        if (window.refPatterns && window.KanjiCanvas) {
          window.KanjiCanvas.refPatterns = window.refPatterns;
        }

        if (isMounted && window.KanjiCanvas) {
          window.KanjiCanvas.init(canvasId);
        }
      } catch (err) {
        console.warn("Local stroke database unavailable, using online recognition", err);
      }
    }

    initEngine();

    return () => {
      isMounted = false;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  // Main recognition executor
  const performRecognition = useCallback(async () => {
    if (!window.KanjiCanvas) return;
    const pattern = window.KanjiCanvas[`recordedPattern_${canvasId}`];

    if (!pattern || pattern.length === 0) {
      setCandidates([]);
      return;
    }

    setIsRecognizing(true);
    try {
      let results = [];

      // Try Google neural handwriting first (handles any stroke order, variations, compound kanji)
      try {
        results = await recognizeWithGoogle(pattern, 300, 300);
      } catch (networkErr) {
        console.warn("Online handwriting recognition failed, falling back to local database", networkErr);
      }

      // If online returned nothing or failed, use local KanjiCanvas
      if (!results || results.length === 0) {
        results = recognizeWithLocalCanvas(canvasId);
        setEngineMode("local");
      } else {
        setEngineMode("neural");
      }

      setCandidates(results);
    } catch (err) {
      console.error("Recognition error:", err);
    } finally {
      setIsRecognizing(false);
    }
  }, [canvasId]);

  // Triggers recognition after stroke completion with slight debounce
  function handlePointerUp() {
    setStrokeCount((c) => c + 1);

    if (autoRecognize) {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        performRecognition();
      }, 350);
    }
  }

  function handleUndo() {
    if (!window.KanjiCanvas) return;
    window.KanjiCanvas.deleteLast(canvasId);
    const newCount = Math.max(0, strokeCount - 1);
    setStrokeCount(newCount);

    if (newCount === 0) {
      setCandidates([]);
    } else if (autoRecognize) {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        performRecognition();
      }, 300);
    }
  }

  function handleClear() {
    if (!window.KanjiCanvas) return;
    window.KanjiCanvas.erase(canvasId);
    setCandidates([]);
    setStrokeCount(0);
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.titleRow}>
          <div>
            <h3 style={styles.title}>Handwriting Recognition</h3>
            <span style={styles.engineBadge}>
              {engineMode === "neural" ? "Cloud Service (Prototype)" : "Local Heuristic (KanjiCanvas)"}
            </span>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={styles.closeBtn}
            title="Close handwriting pad"
          >
            ✕
          </button>
        )}
      </div>

      <p style={styles.subtitle}>
        Draw any kanji or kana character to find matching candidates.
      </p>

      {/* Drawing Area & Canvas */}
      <div style={styles.canvasWrapper}>
        <div style={styles.gridOverlay} aria-hidden="true">
          <div style={styles.gridHorizontal} />
          <div style={styles.gridVertical} />
          <div style={styles.diagonal1} />
          <div style={styles.diagonal2} />
        </div>

        <canvas
          id={canvasId}
          ref={canvasRef}
          width={300}
          height={300}
          onPointerUp={handlePointerUp}
          style={styles.canvas}
        />
      </div>

      {/* Control Buttons */}
      <div style={styles.actionsBar}>
        <button
          type="button"
          onClick={performRecognition}
          disabled={isRecognizing}
          style={{
            ...styles.btn,
            ...styles.btnPrimary,
            opacity: isRecognizing ? 0.7 : 1,
          }}
        >
          {isRecognizing ? "Recognizing..." : "Recognize Now"}
        </button>

        <button
          type="button"
          onClick={handleUndo}
          disabled={strokeCount === 0}
          style={{
            ...styles.btn,
            ...styles.btnSecondary,
            opacity: strokeCount === 0 ? 0.5 : 1,
          }}
        >
          Undo Stroke
        </button>

        <button
          type="button"
          onClick={handleClear}
          style={{ ...styles.btn, ...styles.btnSecondary }}
        >
          Clear Canvas
        </button>

        <label style={styles.toggleLabel}>
          <input
            type="checkbox"
            checked={autoRecognize}
            onChange={(e) => setAutoRecognize(e.target.checked)}
            style={styles.checkbox}
          />
          Live Auto-Detect
        </label>
      </div>

      {/* Candidates Result Strip */}
      <div style={styles.candidatesBox}>
        <div style={styles.candidatesHeader}>
          <span style={styles.candidatesLabel}>
            Recognized Characters:
          </span>
          {isRecognizing && <span style={styles.thinkingDot}>● Analyzing strokes...</span>}
        </div>

        {candidates.length > 0 ? (
          <div style={styles.candidateChips}>
            {candidates.map((char) => (
              <div key={char} style={styles.chipGroup}>
                <button
                  type="button"
                  onClick={() => onSearch && onSearch(char)}
                  style={styles.charBadge}
                  title={`Search for "${char}" in collection`}
                >
                  <span style={styles.charText}>{char}</span>
                  <span style={styles.charAction}>Search</span>
                </button>

                <div style={styles.charQuickActions}>
                  {onAddKanji && (
                    <button
                      type="button"
                      onClick={() => onAddKanji(char)}
                      style={styles.miniBtn}
                      title={`Add "${char}" to Kanji collection`}
                    >
                      +Kanji
                    </button>
                  )}
                  {onAddVocab && (
                    <button
                      type="button"
                      onClick={() => onAddVocab(char)}
                      style={styles.miniBtn}
                      title={`Look up "${char}" as Vocabulary`}
                    >
                      +Vocab
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={styles.emptyPrompt}>
            {strokeCount === 0
              ? "Draw in the square above to start live recognition."
              : isRecognizing
              ? "Analyzing your handwriting..."
              : "No match detected. Try drawing again or click Recognize."}
          </p>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: "rgba(15, 23, 42, 0.92)",
    border: "1px solid rgba(244, 114, 182, 0.35)",
    borderRadius: "16px",
    padding: "22px",
    marginBottom: "20px",
    boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.5), 0 0 15px rgba(244, 114, 182, 0.15)",
    backdropFilter: "blur(14px)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "6px",
  },
  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  icon: {
    fontSize: "1.6rem",
  },
  title: {
    margin: 0,
    fontSize: "1.25rem",
    fontWeight: "800",
    color: "#fdf2f8",
    letterSpacing: "0.02em",
  },
  engineBadge: {
    fontSize: "0.72rem",
    fontWeight: "700",
    color: "#6ee7b7",
    letterSpacing: "0.04em",
  },
  closeBtn: {
    background: "rgba(255, 255, 255, 0.08)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    color: "#e2e8f0",
    fontSize: "1.1rem",
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.2s ease",
  },
  subtitle: {
    color: "#cbd5e1",
    fontSize: "0.88rem",
    margin: "4px 0 16px 0",
    lineHeight: 1.5,
  },
  canvasWrapper: {
    position: "relative",
    width: "300px",
    height: "300px",
    margin: "0 auto 16px",
    borderRadius: "14px",
    overflow: "hidden",
    boxShadow: "0 0 25px rgba(244, 114, 182, 0.2), inset 0 0 20px rgba(0,0,0,0.8)",
    border: "2px solid rgba(244, 114, 182, 0.45)",
    background: "#080c16",
  },
  gridOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "none",
    zIndex: 1,
  },
  gridHorizontal: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    height: "1px",
    borderTop: "1px dashed rgba(244, 114, 182, 0.3)",
  },
  gridVertical: {
    position: "absolute",
    left: "50%",
    top: 0,
    bottom: 0,
    width: "1px",
    borderLeft: "1px dashed rgba(244, 114, 182, 0.3)",
  },
  diagonal1: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundImage: "linear-gradient(to bottom right, transparent 49.6%, rgba(244, 114, 182, 0.08) 50%, transparent 50.4%)",
  },
  diagonal2: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundImage: "linear-gradient(to top right, transparent 49.6%, rgba(244, 114, 182, 0.08) 50%, transparent 50.4%)",
  },
  canvas: {
    display: "block",
    width: "300px",
    height: "300px",
    cursor: "crosshair",
    touchAction: "none",
  },
  actionsBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "16px",
  },
  btn: {
    padding: "9px 18px",
    borderRadius: "8px",
    fontSize: "0.9rem",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.15s ease",
    border: "none",
    fontFamily: "inherit",
  },
  btnPrimary: {
    background: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
    color: "#ffffff",
    boxShadow: "0 4px 14px rgba(236, 72, 153, 0.35)",
  },
  btnSecondary: {
    background: "rgba(30, 41, 59, 0.8)",
    border: "1px solid rgba(148, 163, 184, 0.25)",
    color: "#f1f5f9",
  },
  toggleLabel: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    color: "#cbd5e1",
    fontSize: "0.85rem",
    fontWeight: "600",
    cursor: "pointer",
    userSelect: "none",
    marginLeft: "4px",
  },
  checkbox: {
    accentColor: "#ec4899",
    cursor: "pointer",
  },
  candidatesBox: {
    paddingTop: "14px",
    borderTop: "1px solid rgba(244, 114, 182, 0.2)",
  },
  candidatesHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "10px",
  },
  candidatesLabel: {
    color: "#f9a8d4",
    fontSize: "0.9rem",
    fontWeight: "800",
  },
  thinkingDot: {
    color: "#f472b6",
    fontSize: "0.8rem",
    fontWeight: "600",
    animation: "pulse 1.2s infinite",
  },
  candidateChips: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
  },
  chipGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    background: "rgba(30, 41, 59, 0.85)",
    border: "1px solid rgba(244, 114, 182, 0.35)",
    borderRadius: "10px",
    padding: "6px 8px",
    alignItems: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
    transition: "transform 0.15s ease, border-color 0.15s ease",
  },
  charBadge: {
    background: "transparent",
    border: "none",
    color: "#ffffff",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "2px 4px",
  },
  charText: {
    fontSize: "2rem",
    fontWeight: "800",
    lineHeight: "1.15",
    color: "#ffffff",
  },
  charAction: {
    fontSize: "0.68rem",
    color: "#f472b6",
    fontWeight: "700",
    marginTop: "2px",
  },
  charQuickActions: {
    display: "flex",
    gap: "4px",
    width: "100%",
    marginTop: "2px",
  },
  miniBtn: {
    flex: 1,
    background: "rgba(244, 114, 182, 0.16)",
    border: "1px solid rgba(244, 114, 182, 0.35)",
    borderRadius: "4px",
    color: "#fdf2f8",
    fontSize: "0.68rem",
    fontWeight: "700",
    padding: "3px 4px",
    cursor: "pointer",
    transition: "background 0.2s ease",
  },
  emptyPrompt: {
    color: "#94a3b8",
    fontSize: "0.88rem",
    margin: "8px 0",
    fontStyle: "italic",
    textAlign: "center",
  },
};
