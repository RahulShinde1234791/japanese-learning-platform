import { useState } from "react";

function VocabularyCard({ entry, isFavorite, onDelete, onEdit, onToggleFavorite }) {
  const [starAnimating, setStarAnimating] = useState(false);

  function handleToggleFavorite() {
    onToggleFavorite(entry.id);
    setStarAnimating(true);
  }

  return (
    <article style={styles.card}>
      <div style={styles.topRow}>
        <div style={styles.wordBlock}>
          <div style={styles.word}>{entry.word}</div>
          {entry.reading && <div style={styles.reading}>{entry.reading}</div>}
          <div style={styles.meaning}>{entry.meaning}</div>
          {entry.partOfSpeech && (
            <div style={styles.partOfSpeech}>{entry.partOfSpeech}</div>
          )}
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

      {entry.exampleSentence && (
        <div style={styles.exampleBlock}>
          <span style={styles.exampleLabel}>Example</span>
          <p style={styles.exampleText}>{entry.exampleSentence}</p>
        </div>
      )}

      {entry.notes && <p style={styles.notes}>{entry.notes}</p>}
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
    gap: "12px",
    justifyContent: "space-between",
  },
  wordBlock: { minWidth: 0 },
  word: {
    color: "#f8fafc",
    fontSize: "clamp(1.8rem, 6vw, 2.8rem)",
    fontWeight: 800,
    lineHeight: 1.1,
  },
  reading: {
    color: "#a5b4fc",
    fontSize: "1rem",
    fontWeight: 600,
    marginTop: "6px",
  },
  meaning: {
    color: "#c4b5fd",
    fontSize: "1rem",
    fontWeight: 700,
    marginTop: "8px",
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
  exampleBlock: {
    background: "rgba(124, 58, 237, 0.1)",
    border: "1px solid rgba(167, 139, 250, 0.2)",
    borderRadius: "8px",
    marginTop: "18px",
    padding: "12px 14px",
  },
  exampleLabel: {
    color: "#a78bfa",
    display: "block",
    fontSize: "0.7rem",
    fontWeight: 900,
    letterSpacing: "0.08em",
    marginBottom: "6px",
    textTransform: "uppercase",
  },
  exampleText: {
    color: "#e2e8f0",
    fontSize: "0.95rem",
    lineHeight: 1.6,
    margin: 0,
  },
  notes: {
    color: "#94a3b8",
    fontSize: "0.88rem",
    lineHeight: 1.55,
    marginTop: "12px",
  },
  partOfSpeech: {
    color: "#94a3b8",
    fontSize: "0.82rem",
    fontWeight: 700,
    marginTop: "6px",
  },
};

export default VocabularyCard;
