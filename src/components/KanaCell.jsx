function KanaCell({ cell, onSelect }) {
  if (!cell) {
    return <div style={styles.empty} aria-hidden="true" />;
  }

  return (
    <button
      type="button"
      style={styles.cell}
      title={`${cell.kana} (${cell.romaji}) - ${cell.example}`}
      onClick={() => onSelect(cell)}
      onFocus={() => onSelect(cell)}
      onMouseEnter={() => onSelect(cell)}
    >
      <span style={styles.kana}>{cell.kana}</span>
      <span style={styles.romaji}>{cell.romaji}</span>
      <span style={styles.example}>{cell.example}</span>
    </button>
  );
}

const baseCell = {
  minHeight: "128px",
  borderRadius: "8px",
  boxSizing: "border-box",
};

const styles = {
  cell: {
    ...baseCell,
    width: "100%",
    border: "1px solid rgba(148, 163, 184, 0.24)",
    background: "rgba(15, 23, 42, 0.88)",
    color: "white",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px 12px",
    transition: "border-color 0.2s ease, transform 0.2s ease, background 0.2s ease",
  },
  empty: {
    ...baseCell,
    border: "1px dashed rgba(148, 163, 184, 0.16)",
    background: "rgba(15, 23, 42, 0.22)",
  },
  kana: {
    fontSize: "clamp(2.4rem, 7vw, 4.2rem)",
    lineHeight: 1,
    marginBottom: "10px",
  },
  romaji: {
    color: "#f9a8d4",
    fontSize: "1rem",
    fontWeight: 700,
    marginBottom: "8px",
    textTransform: "uppercase",
  },
  example: {
    color: "#cbd5e1",
    fontSize: "0.82rem",
    lineHeight: 1.35,
    maxWidth: "18ch",
  },
};

export default KanaCell;
