import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import KanjiCard from "../components/KanjiCard";
import KanjiForm from "../components/KanjiForm";
import kanjiDefaults from "../data/kanjiDefaults";
import { loadKanji, saveKanji } from "../utils/localStorage";

function Kanji() {
  const [kanjiEntries, setKanjiEntries] = useState(() => loadKanji() ?? kanjiDefaults);
  const [editingEntry, setEditingEntry] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    saveKanji(kanjiEntries);
  }, [kanjiEntries]);

  const filteredEntries = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return kanjiEntries;
    }

    return kanjiEntries.filter((entry) =>
      [entry.kanji, entry.meaning, entry.onyomi, entry.kunyomi, entry.example, entry.notes]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [kanjiEntries, searchTerm]);

  function handleSubmit(formData) {
    if (editingEntry) {
      setKanjiEntries((currentEntries) =>
        currentEntries.map((entry) =>
          entry.id === editingEntry.id ? { ...formData, id: editingEntry.id } : entry,
        ),
      );
      setEditingEntry(null);
      return;
    }

    setKanjiEntries((currentEntries) => [
      { ...formData, id: Date.now() },
      ...currentEntries,
    ]);
  }

  function handleDelete(id) {
    setKanjiEntries((currentEntries) => currentEntries.filter((entry) => entry.id !== id));
    if (editingEntry?.id === id) {
      setEditingEntry(null);
    }
  }

  return (
    <div style={styles.page}>
      <Link to="/" style={styles.backLink}>
        ← Home
      </Link>

      <header style={styles.header}>
        <h1 style={styles.title}>Kanji Notes</h1>
        <p style={styles.subtitle}>
          Build a personal kanji notebook with meanings, readings, examples, and study notes.
        </p>
      </header>

      <main style={styles.layout}>
        <aside style={styles.sidebar}>
          <KanjiForm
            key={editingEntry?.id ?? "new-kanji"}
            editingEntry={editingEntry}
            onCancelEdit={() => setEditingEntry(null)}
            onSubmit={handleSubmit}
          />
        </aside>

        <section style={styles.content}>
          <div style={styles.searchPanel}>
            <div>
              <p style={styles.kicker}>Collection</p>
              <h2 style={styles.sectionTitle}>{kanjiEntries.length} saved kanji</h2>
            </div>

            <input
              placeholder="Search kanji, readings, meanings..."
              style={styles.searchInput}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          {filteredEntries.length > 0 ? (
            <div style={styles.cardGrid}>
              {filteredEntries.map((entry) => (
                <KanjiCard
                  key={entry.id}
                  entry={entry}
                  onDelete={handleDelete}
                  onEdit={setEditingEntry}
                />
              ))}
            </div>
          ) : (
            <div style={styles.emptyState}>
              <h2 style={styles.emptyTitle}>No kanji found</h2>
              <p style={styles.emptyCopy}>Try a different search or add a new entry.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top right, rgba(245, 158, 11, 0.18), transparent 30%), radial-gradient(circle at top left, rgba(236, 72, 153, 0.18), transparent 34%), #020617",
    boxSizing: "border-box",
    color: "white",
    fontFamily: "Arial, sans-serif",
    padding: "40px 20px 56px",
  },
  backLink: {
    color: "#f9a8d4",
    display: "inline-flex",
    fontWeight: 700,
    marginBottom: "28px",
    textDecoration: "none",
  },
  header: {
    margin: "0 auto 36px",
    maxWidth: "860px",
    textAlign: "center",
  },
  title: {
    color: "white",
    fontSize: "clamp(2.5rem, 6vw, 5rem)",
    lineHeight: 1.1,
    margin: "0 0 10px",
  },
  subtitle: {
    color: "#cbd5e1",
    fontSize: "1.1rem",
    lineHeight: 1.6,
  },
  layout: {
    alignItems: "start",
    display: "grid",
    gap: "24px",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))",
    margin: "0 auto",
    maxWidth: "1240px",
  },
  sidebar: {
    position: "sticky",
    top: "24px",
  },
  content: {
    minWidth: 0,
  },
  searchPanel: {
    alignItems: "center",
    background: "rgba(15, 23, 42, 0.7)",
    border: "1px solid rgba(226, 232, 240, 0.14)",
    borderRadius: "8px",
    display: "flex",
    flexWrap: "wrap",
    gap: "18px",
    justifyContent: "space-between",
    marginBottom: "18px",
    padding: "18px",
  },
  kicker: {
    color: "#f9a8d4",
    fontSize: "0.78rem",
    fontWeight: 900,
    letterSpacing: "0.08em",
    marginBottom: "4px",
    textTransform: "uppercase",
  },
  sectionTitle: {
    color: "white",
    fontSize: "1.45rem",
    fontWeight: 900,
    margin: 0,
  },
  searchInput: {
    background: "rgba(15, 23, 42, 0.9)",
    border: "1px solid rgba(148, 163, 184, 0.24)",
    borderRadius: "8px",
    boxSizing: "border-box",
    color: "white",
    font: "inherit",
    maxWidth: "420px",
    outline: "none",
    padding: "12px 14px",
    width: "100%",
  },
  cardGrid: {
    display: "grid",
    gap: "16px",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  },
  emptyState: {
    background: "rgba(15, 23, 42, 0.76)",
    border: "1px solid rgba(226, 232, 240, 0.14)",
    borderRadius: "8px",
    padding: "36px 20px",
    textAlign: "center",
  },
  emptyTitle: {
    color: "white",
    fontSize: "1.5rem",
    margin: "0 0 8px",
  },
  emptyCopy: {
    color: "#cbd5e1",
  },
};

export default Kanji;
