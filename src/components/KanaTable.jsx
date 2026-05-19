import { useState } from "react";

import KanaCell from "./KanaCell";

const vowelHeaders = ["a", "i", "u", "e", "o"];

function KanaTable({ rows }) {
  const firstCell = rows.flatMap((row) => row.cells).find(Boolean);
  const [selectedCell, setSelectedCell] = useState(firstCell);

  return (
    <section style={styles.layout}>
      {selectedCell && (
        <aside style={styles.detail} aria-live="polite">
          <div style={styles.detailKana}>{selectedCell.kana}</div>
          <div>
            <div style={styles.detailRomaji}>{selectedCell.romaji}</div>
            <p style={styles.detailExample}>{selectedCell.example}</p>
          </div>
        </aside>
      )}

      <div style={styles.tableWrap}>
        <div style={styles.table} role="table" aria-label="Japanese kana chart">
          <div style={styles.headerCorner} role="columnheader">
            row
          </div>
          {vowelHeaders.map((header) => (
            <div key={header} style={styles.headerCell} role="columnheader">
              {header}
            </div>
          ))}

          {rows.map((row) => (
            <div key={row.row} style={styles.rowGroup} role="row">
              <div style={styles.rowHeader} role="rowheader">
                {row.row}
              </div>
              {row.cells.map((cell, index) => (
                <KanaCell
                  key={cell?.kana ?? `${row.row}-${index}`}
                  cell={cell}
                  onSelect={setSelectedCell}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const styles = {
  layout: {
    maxWidth: "1120px",
    margin: "0 auto",
  },
  tableWrap: {
    overflowX: "auto",
    paddingBottom: "8px",
  },
  table: {
    display: "grid",
    gridTemplateColumns: "96px repeat(5, minmax(132px, 1fr))",
    gap: "10px",
    minWidth: "820px",
  },
  rowGroup: {
    display: "contents",
  },
  headerCorner: {
    color: "#94a3b8",
    fontSize: "0.78rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    alignSelf: "center",
  },
  headerCell: {
    color: "#f8fafc",
    background: "rgba(244, 114, 182, 0.16)",
    border: "1px solid rgba(244, 114, 182, 0.24)",
    borderRadius: "8px",
    fontSize: "0.92rem",
    fontWeight: 800,
    letterSpacing: "0.08em",
    padding: "10px",
    textTransform: "uppercase",
  },
  rowHeader: {
    minHeight: "128px",
    borderRadius: "8px",
    background: "rgba(30, 41, 59, 0.74)",
    border: "1px solid rgba(148, 163, 184, 0.18)",
    color: "#e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    writingMode: "vertical-rl",
    textOrientation: "mixed",
  },
  detail: {
    border: "1px solid rgba(244, 114, 182, 0.24)",
    borderRadius: "8px",
    background: "rgba(15, 23, 42, 0.88)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "20px",
    margin: "0 auto 24px",
    maxWidth: "520px",
    padding: "18px 24px",
  },
  detailKana: {
    fontSize: "4.5rem",
    lineHeight: 1,
  },
  detailRomaji: {
    color: "#f9a8d4",
    fontSize: "1.4rem",
    fontWeight: 800,
    marginBottom: "8px",
    textTransform: "uppercase",
  },
  detailExample: {
    color: "#cbd5e1",
    fontSize: "1rem",
    lineHeight: 1.5,
  },
};

export default KanaTable;
