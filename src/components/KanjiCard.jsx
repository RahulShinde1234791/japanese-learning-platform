function KanjiCard({ entry, onDelete, onEdit }) {
  return (
    <article style={styles.card}>
      <div style={styles.topRow}>
        <div>
          <div style={styles.kanji}>{entry.kanji}</div>
          <div style={styles.meaning}>{entry.meaning}</div>
        </div>

        <div style={styles.actions}>
          <button type="button" style={styles.editButton} onClick={() => onEdit(entry)}>
            Edit
          </button>
          <button type="button" style={styles.deleteButton} onClick={() => onDelete(entry.id)}>
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
    </article>
  );
}

const styles = {
  card: {
    background: "rgba(15, 23, 42, 0.82)",
    border: "1px solid rgba(226, 232, 240, 0.14)",
    borderRadius: "8px",
    boxShadow: "0 18px 36px rgba(0, 0, 0, 0.26)",
    padding: "22px",
    textAlign: "left",
  },
  topRow: {
    alignItems: "flex-start",
    display: "flex",
    gap: "16px",
    justifyContent: "space-between",
  },
  kanji: {
    color: "#f8fafc",
    fontSize: "4rem",
    fontWeight: 800,
    lineHeight: 1,
  },
  meaning: {
    color: "#f9a8d4",
    fontSize: "1.08rem",
    fontWeight: 800,
    marginTop: "10px",
  },
  actions: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  editButton: {
    background: "rgba(96, 165, 250, 0.18)",
    border: "1px solid rgba(147, 197, 253, 0.35)",
    borderRadius: "8px",
    color: "#bfdbfe",
    cursor: "pointer",
    fontWeight: 800,
    padding: "8px 12px",
  },
  deleteButton: {
    background: "rgba(244, 63, 94, 0.16)",
    border: "1px solid rgba(251, 113, 133, 0.32)",
    borderRadius: "8px",
    color: "#fecdd3",
    cursor: "pointer",
    fontWeight: 800,
    padding: "8px 12px",
  },
  metaGrid: {
    display: "grid",
    gap: "10px",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
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
    fontSize: "1rem",
    margin: 0,
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
};

export default KanjiCard;
