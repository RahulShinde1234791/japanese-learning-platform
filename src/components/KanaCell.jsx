import { useState } from "react";

function KanaCell({ cell }) {
  const [isHovering, setIsHovering] = useState(false);

  if (!cell) {
    return <div style={styles.empty} aria-hidden="true" />;
  }

  return (
    <button
      type="button"
      style={{
        ...styles.cell,
        ...(isHovering ? styles.cellHover : {}),
      }}
      onBlur={() => setIsHovering(false)}
      onFocus={() => setIsHovering(true)}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <span style={styles.kana}>{cell.kana}</span>
      <span style={styles.romaji}>{cell.romaji}</span>

      {isHovering && (
        <span style={styles.tooltip} role="tooltip">
          {cell.example}
        </span>
      )}
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
    position: "relative",
    transition: "border-color 0.2s ease, transform 0.2s ease, background 0.2s ease",
  },
  cellHover: {
    background: "rgba(30, 41, 59, 0.98)",
    borderColor: "rgba(249, 168, 212, 0.9)",
    transform: "translateY(-3px)",
    zIndex: 3,
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
    color: "#5eead4",
    fontSize: "1rem",
    fontWeight: 700,
    textTransform: "uppercase",
  },
  tooltip: {
    background: "#f8fafc",
    border: "1px solid rgba(15, 23, 42, 0.12)",
    borderRadius: "8px",
    bottom: "calc(100% + 10px)",
    boxShadow: "0 18px 40px rgba(0, 0, 0, 0.35)",
    color: "#0f172a",
    fontSize: "0.85rem",
    fontWeight: 700,
    left: "50%",
    lineHeight: 1.35,
    minWidth: "190px",
    padding: "10px 12px",
    pointerEvents: "none",
    position: "absolute",
    transform: "translateX(-50%)",
    zIndex: 6,
  },
};

export default KanaCell;
