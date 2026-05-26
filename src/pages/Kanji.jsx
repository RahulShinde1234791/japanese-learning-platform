import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import KanjiCard from "../components/KanjiCard";
import KanjiForm from "../components/KanjiForm";
import kanjiDefaults from "../data/kanjiDefaults";
import { loadFavorites, loadKanji, saveFavorites, saveKanji } from "../utils/localStorage";

function Kanji() {
  const [kanjiEntries, setKanjiEntries] = useState(() => loadKanji() ?? kanjiDefaults);
  const [editingEntry, setEditingEntry] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [favorites, setFavorites] = useState(() => loadFavorites());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    saveKanji(kanjiEntries);
  }, [kanjiEntries]);

  useEffect(() => {
    saveFavorites(favorites);
  }, [favorites]);

  const filteredEntries = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    let entries = kanjiEntries;

    if (showFavoritesOnly) {
      entries = entries.filter((entry) => favorites.has(entry.id));
    }

    if (!normalizedSearch) {
      return entries;
    }

    return entries.filter((entry) =>
      [entry.kanji, entry.meaning, entry.onyomi, entry.kunyomi, entry.example, entry.notes]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [kanjiEntries, searchTerm, favorites, showFavoritesOnly]);

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
    setFavorites((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    if (editingEntry?.id === id) {
      setEditingEntry(null);
    }
  }

  function handleToggleFavorite(id) {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const favoritesCount = favorites.size;

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
          {/* Search & stats panel */}
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

          {/* Favorites filter bar */}
          <div style={styles.filterBar}>
            <button
              type="button"
              style={!showFavoritesOnly ? styles.filterButtonActive : styles.filterButton}
              onClick={() => setShowFavoritesOnly(false)}
            >
              All ({kanjiEntries.length})
            </button>
            <button
              type="button"
              style={showFavoritesOnly ? styles.filterButtonFavActive : styles.filterButton}
              onClick={() => setShowFavoritesOnly(true)}
            >
              ⭐ Favorites ({favoritesCount})
            </button>
          </div>

          {filteredEntries.length > 0 ? (
            <div style={styles.cardGrid}>
              {filteredEntries.map((entry) => (
                <KanjiCard
                  key={entry.id}
                  entry={entry}
                  isFavorite={favorites.has(entry.id)}
                  onDelete={handleDelete}
                  onEdit={setEditingEntry}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          ) : (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>
                {showFavoritesOnly ? "⭐" : "🔍"}
              </div>
              <h2 style={styles.emptyTitle}>
                {showFavoritesOnly ? "No favorites yet" : "No kanji found"}
              </h2>
              <p style={styles.emptyCopy}>
                {showFavoritesOnly
                  ? "Star a kanji card to add it to your favorites."
                  : "Try a different search or add a new entry."}
              </p>
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
    fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    padding: "clamp(20px, 4vw, 40px) clamp(16px, 4vw, 24px) 56px",
  },
  backLink: {
    color: "#f9a8d4",
    display: "inline-flex",
    fontWeight: 700,
    marginBottom: "28px",
    textDecoration: "none",
    fontSize: "0.95rem",
  },
  header: {
    margin: "0 auto 36px",
    maxWidth: "860px",
    textAlign: "center",
  },
  title: {
    color: "white",
    fontSize: "clamp(2.2rem, 6vw, 5rem)",
    lineHeight: 1.1,
    margin: "0 0 10px",
    fontFamily: "inherit",
  },
  subtitle: {
    color: "#cbd5e1",
    fontSize: "clamp(0.95rem, 2.5vw, 1.1rem)",
    lineHeight: 1.6,
  },
  layout: {
    alignItems: "start",
    display: "grid",
    gap: "24px",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
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
    borderRadius: "10px",
    display: "flex",
    flexWrap: "wrap",
    gap: "18px",
    justifyContent: "space-between",
    marginBottom: "12px",
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
    fontFamily: "inherit",
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
  filterBar: {
    display: "flex",
    gap: "10px",
    marginBottom: "18px",
    flexWrap: "wrap",
  },
  filterButton: {
    background: "rgba(30, 41, 59, 0.5)",
    border: "1px solid rgba(148, 163, 184, 0.18)",
    borderRadius: "999px",
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: "0.88rem",
    fontWeight: 700,
    padding: "8px 18px",
    transition: "all 0.18s ease",
    fontFamily: "inherit",
  },
  filterButtonActive: {
    background: "rgba(236, 72, 153, 0.18)",
    border: "1px solid rgba(236, 72, 153, 0.4)",
    borderRadius: "999px",
    color: "#f9a8d4",
    cursor: "pointer",
    fontSize: "0.88rem",
    fontWeight: 700,
    padding: "8px 18px",
    transition: "all 0.18s ease",
    fontFamily: "inherit",
  },
  filterButtonFavActive: {
    background: "rgba(251, 191, 36, 0.14)",
    border: "1px solid rgba(251, 191, 36, 0.35)",
    borderRadius: "999px",
    color: "#fbbf24",
    cursor: "pointer",
    fontSize: "0.88rem",
    fontWeight: 700,
    padding: "8px 18px",
    transition: "all 0.18s ease",
    fontFamily: "inherit",
  },
  cardGrid: {
    display: "grid",
    gap: "16px",
    gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 1fr))",
  },
  emptyState: {
    background: "rgba(15, 23, 42, 0.76)",
    border: "1px solid rgba(226, 232, 240, 0.14)",
    borderRadius: "12px",
    padding: "48px 20px",
    textAlign: "center",
  },
  emptyIcon: {
    fontSize: "2.4rem",
    marginBottom: "14px",
  },
  emptyTitle: {
    color: "white",
    fontSize: "1.4rem",
    margin: "0 0 8px",
    fontFamily: "inherit",
  },
  emptyCopy: {
    color: "#94a3b8",
    fontSize: "0.95rem",
  },
};

export default Kanji;
