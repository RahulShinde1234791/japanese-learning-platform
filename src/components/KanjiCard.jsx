import { useState } from "react";

import StrokeOrder from "./StrokeOrder";

const JLPT_COLORS = {
  N5: { bg: "rgba(16, 185, 129, 0.18)", border: "rgba(16, 185, 129, 0.45)", text: "#6ee7b7" },
  N4: { bg: "rgba(59, 130, 246, 0.18)", border: "rgba(59, 130, 246, 0.45)", text: "#93c5fd" },
  N3: { bg: "rgba(139, 92, 246, 0.18)", border: "rgba(139, 92, 246, 0.45)", text: "#c4b5fd" },
  N2: { bg: "rgba(245, 158, 11, 0.18)", border: "rgba(245, 158, 11, 0.45)", text: "#fcd34d" },
  N1: { bg: "rgba(239, 68, 68, 0.18)", border: "rgba(239, 68, 68, 0.45)", text: "#fca5a5" },
};

function JlptBadge({ level }) {
  if (!level) return null;
  const colors = JLPT_COLORS[level] ?? {};
  return (
    <span
      style={{
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: "6px",
        color: colors.text,
        fontSize: "0.72rem",
        fontWeight: 900,
        letterSpacing: "0.06em",
        padding: "3px 8px",
        textTransform: "uppercase",
      }}
    >
      {level}
    </span>
  );
}

function KanjiCard({ entry, isFavorite, onDelete, onEdit, onToggleFavorite }) {
  const [showStrokes, setShowStrokes] = useState(false);
  const [starAnimating, setStarAnimating] = useState(false);

  function handleToggleFavorite() {
    onToggleFavorite(entry.id);
    setStarAnimating(true);
  }

  return (
    <article style={styles.card}>
      <div style={styles.topRow}>
        <div style={styles.kanjiBlock}>
          <div style={styles.kanjiRow}>
            <span style={styles.kanji}>{entry.kanji}</span>
            <JlptBadge level={entry.jlpt} />
          </div>
          <div style={styles.meaning}>{entry.meaning}</div>
        </div>

        <div style={styles.actions}>
          <button
            type="button"
            title={isFavorite ? "Remove from favorites" : "Add to favorites"}
            style={isFavorite ? styles.starActive : styles.star}
            className={starAnimating ? "star-pop" : ""}
            onAnimationEnd={() => setStarAnimating(false)}
            onClick={handleToggleFavorite}
          >
            {isFavorite ? "⭐" : "☆"}
          </button>
          <button type="button" style={styles.editBtn} onClick={() => onEdit(entry)}>
            Edit
          </button>
          <button type="button" style={styles.deleteBtn} onClick={() => onDelete(entry.id)}>
            Delete
          </button>
        </div>
      </div>

      <dl style={styles.metaGrid}>
        <div style={styles.metaItem}>
          <dt style={styles.metaLabel}>Onyomi</dt>
          <dd style={styles.metaValue}>{entry.onyomi || "—"}</dd>
        </div>
        <div style={styles.metaItem}>
          <dt style={styles.metaLabel}>Kunyomi</dt>
          <dd style={styles.metaValue}>{entry.kunyomi || "—"}</dd>
        </div>
      </dl>

      {entry.notes && <p style={styles.notes}>{entry.notes}</p>}

      <button
        type="button"
        style={showStrokes ? styles.strokeBtnActive : styles.strokeBtn}
        onClick={() => setShowStrokes((v) => !v)}
      >
        {showStrokes ? "Hide Strokes ▲" : "Show Strokes ▼"}
      </button>

      {showStrokes && (
        <div style={styles.strokeWrapper}>
          <StrokeOrder kanji={entry.kanji} />
        </div>
      )}
    </article>
  );
}

const styles = {
  card: {
    background: "rgba(15, 23, 42, 0.82)",
    border: "1px solid rgba(226, 232, 240, 0.14)",
    borderRadius: "12px",
    boxShadow: "0 18px 36px rgba(0, 0, 0, 0.26)",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    padding: "22px",
    textAlign: "left",
  },
  topRow: {
    alignItems: "flex-start",
    display: "flex",
    gap: "16px",
    justifyContent: "space-between",
  },
  kanjiBlock: { minWidth: 0 },
  kanjiRow: {
    alignItems: "center",
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  kanji: {
    color: "#f8fafc",
    fontSize: "clamp(2.6rem, 8vw, 4rem)",
    fontWeight: 800,
    lineHeight: 1,
  },
  meaning: {
    color: "#f9a8d4",
    fontSize: "1rem",
    fontWeight: 800,
    marginTop: "10px",
    lineHeight: 1.4,
  },
  actions: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    flexShrink: 0,
  },
  star: {
    background: "rgba(71, 85, 105, 0.2)",
    border: "1px solid rgba(148, 163, 184, 0.2)",
    borderRadius: "8px",
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: "1.1rem",
    lineHeight: 1,
    padding: "7px 11px",
  },
  starActive: {
    background: "rgba(251, 191, 36, 0.15)",
    border: "1px solid rgba(251, 191, 36, 0.35)",
    borderRadius: "8px",
    color: "#fbbf24",
    cursor: "pointer",
    fontSize: "1.1rem",
    lineHeight: 1,
    padding: "7px 11px",
  },
  editBtn: {
    background: "rgba(96, 165, 250, 0.18)",
    border: "1px solid rgba(147, 197, 253, 0.35)",
    borderRadius: "8px",
    color: "#bfdbfe",
    cursor: "pointer",
    fontFamily: "inherit",
    fontWeight: 800,
    padding: "8px 12px",
  },
  deleteBtn: {
    background: "rgba(244, 63, 94, 0.16)",
    border: "1px solid rgba(251, 113, 133, 0.32)",
    borderRadius: "8px",
    color: "#fecdd3",
    cursor: "pointer",
    fontFamily: "inherit",
    fontWeight: 800,
    padding: "8px 12px",
  },
  metaGrid: {
    display: "grid",
    gap: "10px",
    gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
    margin: "20px 0 0",
  },
  metaItem: {
    background: "rgba(30, 41, 59, 0.68)",
    border: "1px solid rgba(148, 163, 184, 0.16)",
    borderRadius: "8px",
    padding: "12px",
  },
  metaLabel: {
    color: "#94a3b8",
    fontSize: "0.72rem",
    fontWeight: 800,
    letterSpacing: "0.08em",
    marginBottom: "6px",
    textTransform: "uppercase",
  },
  metaValue: {
    color: "#f8fafc",
    fontSize: "0.97rem",
    margin: 0,
    wordBreak: "break-word",
  },
  notes: {
    color: "#cbd5e1",
    fontSize: "0.9rem",
    lineHeight: 1.55,
    marginTop: "14px",
  },
  strokeBtn: {
    marginTop: "16px",
    width: "100%",
    background: "rgba(30, 41, 59, 0.5)",
    border: "1px solid rgba(148, 163, 184, 0.18)",
    borderRadius: "8px",
    color: "#94a3b8",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "0.82rem",
    fontWeight: 700,
    letterSpacing: "0.04em",
    padding: "9px 14px",
  },
  strokeBtnActive: {
    marginTop: "16px",
    width: "100%",
    background: "rgba(59, 130, 246, 0.12)",
    border: "1px solid rgba(147, 197, 253, 0.28)",
    borderRadius: "8px",
    color: "#93c5fd",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "0.82rem",
    fontWeight: 700,
    letterSpacing: "0.04em",
    padding: "9px 14px",
  },
  strokeWrapper: {
    animation: "fadeSlideIn 0.25s ease",
  },
};

export default KanjiCard;
