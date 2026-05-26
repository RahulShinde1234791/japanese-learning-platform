import { useEffect, useRef, useState } from "react";

/**
 * Converts a kanji character to a zero-padded 5-digit hex codepoint string,
 * which is the filename format used by KanjiVG.
 * e.g. "山" → "05c71"
 */
function toKanjiVGFilename(char) {
  return char.codePointAt(0).toString(16).padStart(5, "0");
}

function StrokeOrder({ kanji }) {
  const [svgContent, setSvgContent] = useState(null);
  const [status, setStatus] = useState("loading"); // "loading" | "ready" | "error"
  const containerRef = useRef(null);

  useEffect(() => {
    if (!kanji) return;

    setStatus("loading");
    setSvgContent(null);

    const hex = toKanjiVGFilename(kanji.trim()[0]);
    const url = `https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/${hex}.svg`;

    const controller = new AbortController();

    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.text();
      })
      .then((text) => {
        // Strip XML declaration and extract inner SVG content
        const cleaned = text
          .replace(/<\?xml[^?]*\?>/g, "")
          .replace(/<!--[\s\S]*?-->/g, "")
          .trim();
        setSvgContent(cleaned);
        setStatus("ready");
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setStatus("error");
        }
      });

    return () => controller.abort();
  }, [kanji]);

  // Inject per-stroke animation after SVG is rendered
  useEffect(() => {
    if (status !== "ready" || !containerRef.current) return;

    const svgEl = containerRef.current.querySelector("svg");
    if (!svgEl) return;

    // Style the SVG itself
    svgEl.setAttribute("width", "160");
    svgEl.setAttribute("height", "160");
    svgEl.style.overflow = "visible";

    // Find all stroke paths (KanjiVG puts strokes inside groups with id="kvg:...")
    const paths = svgEl.querySelectorAll("path");
    paths.forEach((path, i) => {
      const length = path.getTotalLength?.() ?? 300;
      path.style.fill = "none";
      path.style.stroke = "#e2e8f0";
      path.style.strokeWidth = "3";
      path.style.strokeLinecap = "round";
      path.style.strokeLinejoin = "round";
      path.style.strokeDasharray = length;
      path.style.strokeDashoffset = length;
      path.style.setProperty("--stroke-len", length);
      path.style.animation = `stroke-draw 0.6s ease forwards`;
      path.style.animationDelay = `${i * 0.18}s`;
    });
  }, [status, svgContent]);

  if (status === "loading") {
    return <div style={styles.shimmer} aria-label="Loading stroke order..." />;
  }

  if (status === "error") {
    return (
      <div style={styles.errorBox}>
        <span style={styles.errorIcon}>✕</span>
        <span style={styles.errorText}>No stroke data available</span>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <p style={styles.label}>Stroke Order</p>
      <div
        ref={containerRef}
        style={styles.svgContainer}
        // KanjiVG SVGs are trusted static files from a public GitHub repo
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
    </div>
  );
}

const styles = {
  wrapper: {
    marginTop: "18px",
    padding: "16px",
    background: "rgba(30, 41, 59, 0.55)",
    border: "1px solid rgba(148, 163, 184, 0.16)",
    borderRadius: "10px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
  },
  label: {
    color: "#94a3b8",
    fontSize: "0.72rem",
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    margin: 0,
  },
  svgContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "160px",
    height: "160px",
  },
  shimmer: {
    marginTop: "18px",
    width: "100%",
    height: "96px",
    borderRadius: "10px",
    background:
      "linear-gradient(90deg, rgba(30,41,59,0.4) 25%, rgba(51,65,85,0.6) 50%, rgba(30,41,59,0.4) 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.4s infinite",
  },
  errorBox: {
    marginTop: "18px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 16px",
    background: "rgba(30, 41, 59, 0.4)",
    border: "1px solid rgba(148, 163, 184, 0.14)",
    borderRadius: "10px",
    color: "#64748b",
    fontSize: "0.88rem",
  },
  errorIcon: {
    color: "#475569",
    fontWeight: 800,
  },
  errorText: {
    color: "#64748b",
  },
};

export default StrokeOrder;
