import KanaCell from "./KanaCell";

const vowelHeaders = ["a", "i", "u", "e", "o"];

function KanaTable({ rows }) {
  return (
    <section style={styles.layout}>
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
                <KanaCell key={cell?.kana ?? `${row.row}-${index}`} cell={cell} />
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
};

export default KanaTable;
