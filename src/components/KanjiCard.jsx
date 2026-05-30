import { useState } from "react";

import StrokeOrder from "./StrokeOrder";

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
          <div style={styles.kanjiHeader}>
            <div style={styles.kanji}>{entry.kanji}</div>
            <span style={styles.levelBadge}>{entry.jlptLevel || "Unknown"}</span>
          </div>
          <div style={styles.meaning}>{entry.meaning}</div>
        </div>

        <div style={styles.actions}>
          {/* Favourite star */}
          <button
            type="button"
            title={isFavorite ? "Remove from favorites" : "Add to favorites"}
            style={{
              ...styles.starButton,
              ...(isFavorite ? styles.starButtonActive : {}),
            }}
            className={starAnimating ? "star-pop" : ""}
            onAnimationEnd={() => setStarAnimating(false)}
            onClick={handleToggleFavorite}
          >
            {isFavorite ? "⭐" : "☆"}
          </button>

          <button type="button" style={styles.editButton} onClick={() => onEdit(entry)}>
            Edit
          </button>
          <button
            type="button"
            style={styles.deleteButton}
            onClick={() => onDelete(entry.id)}
          >
            Delete
          </button>
        </div>
      </div>

      <dl style={styles.metaGrid}>
        <div style={styles.metaItem}>
          <dt style={styles.label}>Onyomi</dt>
          <dd style={styles.value}>{entry.onyomi || "—"}</dd>
        </div>
        <div style={styles.metaItem}>
          <dt style={styles.label}>Kunyomi</dt>
          <dd style={styles.value}>{entry.kunyomi || "—"}</dd>
        </div>
      </dl>

      <p style={styles.example}>{entry.example}</p>
      {entry.notes && <p style={styles.notes}>{entry.notes}</p>}

      {/* Stroke order toggle */}
      <button
        type="button"
        style={showStrokes ? styles.strokeButtonActive : styles.strokeButton}
        onClick={() => setShowStrokes((prev) => !prev)}
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
    padding: "22px",
    textAlign: "left",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    transition: "border-color 0.2s ease",
  },
  topRow: {
    alignItems: "flex-start",
    display: "flex",
    gap: "16px",
    justifyContent: "space-between",
  },
  kanjiBlock: {
    minWidth: 0,
  },
  kanjiHeader: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
  },
  kanji: {
    color: "#f8fafc",
    fontSize: "clamp(2.8rem, 8vw, 4rem)",
    fontWeight: 800,
    lineHeight: 1,
  },
  levelBadge: {
    background: "rgba(20, 184, 166, 0.14)",
    border: "1px solid rgba(94, 234, 212, 0.3)",
    borderRadius: "999px",
    color: "#99f6e4",
    fontSize: "0.76rem",
    fontWeight: 900,
    padding: "5px 9px",
  },
  meaning: {
    color: "#fbbf24",
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
  starButton: {
    background: "rgba(71, 85, 105, 0.2)",
    border: "1px solid rgba(148, 163, 184, 0.2)",
    borderRadius: "8px",
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: "1.1rem",
    fontWeight: 800,
    padding: "7px 11px",
    transition: "background 0.2s, color 0.2s",
    lineHeight: 1,
  },
  starButtonActive: {
    background: "rgba(251, 191, 36, 0.15)",
    border: "1px solid rgba(251, 191, 36, 0.35)",
    color: "#fbbf24",
  },
  editButton: {
    background: "rgba(96, 165, 250, 0.18)",
    border: "1px solid rgba(147, 197, 253, 0.35)",
    borderRadius: "8px",
    color: "#bfdbfe",
    cursor: "pointer",
    fontWeight: 800,
    padding: "8px 12px",
    fontFamily: "inherit",
  },
  deleteButton: {
    background: "rgba(244, 63, 94, 0.16)",
    border: "1px solid rgba(251, 113, 133, 0.32)",
    borderRadius: "8px",
    color: "#fecdd3",
    cursor: "pointer",
    fontWeight: 800,
    padding: "8px 12px",
    fontFamily: "inherit",
  },
  metaGrid: {
    display: "grid",
    gap: "10px",
    gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
    margin: "22px 0 0",
  },
  metaItem: {
    background: "rgba(30, 41, 59, 0.68)",
    border: "1px solid rgba(148, 163, 184, 0.16)",
    borderRadius: "8px",
    padding: "12px",
  },
  label: {
    color: "#94a3b8",
    fontSize: "0.72rem",
    fontWeight: 800,
    letterSpacing: "0.08em",
    marginBottom: "6px",
    textTransform: "uppercase",
  },
  value: {
    color: "#f8fafc",
    fontSize: "0.97rem",
    margin: 0,
    wordBreak: "break-word",
  },
  example: {
    color: "#e2e8f0",
    fontSize: "1rem",
    lineHeight: 1.5,
    marginTop: "18px",
  },
  notes: {
    color: "#cbd5e1",
    fontSize: "0.95rem",
    lineHeight: 1.5,
    marginTop: "12px",
  },
  strokeButton: {
    marginTop: "16px",
    width: "100%",
    background: "rgba(30, 41, 59, 0.5)",
    border: "1px solid rgba(148, 163, 184, 0.18)",
    borderRadius: "8px",
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: "0.82rem",
    fontWeight: 700,
    letterSpacing: "0.04em",
    padding: "9px 14px",
    transition: "background 0.2s, color 0.2s, border-color 0.2s",
    fontFamily: "inherit",
  },
  strokeButtonActive: {
    marginTop: "16px",
    width: "100%",
    background: "rgba(59, 130, 246, 0.12)",
    border: "1px solid rgba(147, 197, 253, 0.28)",
    borderRadius: "8px",
    color: "#93c5fd",
    cursor: "pointer",
    fontSize: "0.82rem",
    fontWeight: 700,
    letterSpacing: "0.04em",
    padding: "9px 14px",
    transition: "background 0.2s, color 0.2s, border-color 0.2s",
    fontFamily: "inherit",
  },
  strokeWrapper: {
    animation: "fadeSlideIn 0.25s ease",
  },
};

export default KanjiCard;
