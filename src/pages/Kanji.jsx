import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import KanjiCard from "../components/KanjiCard";
import KanjiForm from "../components/KanjiForm";
import kanjiDefaults from "../data/kanjiDefaults";
import {
  loadFavorites,
  loadKanji,
  loadVocabulary,
  saveFavorites,
  saveKanji,
  saveVocabulary,
} from "../utils/localStorage";

const jlptLevels = ["N5", "N4", "N3", "N2", "N1"];
const filterOptions = ["All", ...jlptLevels, "Favorites"];

function getJlptRank(level) {
  const rank = jlptLevels.indexOf(level);
  return rank === -1 ? jlptLevels.length : rank;
}

function sortKanjiEntries(entries) {
  return [...entries].sort((first, second) => {
    const rankDifference = getJlptRank(first.jlptLevel) - getJlptRank(second.jlptLevel);
    if (rankDifference !== 0) return rankDifference;

    return (
      (first.kanji || "").localeCompare(second.kanji || "", "ja") ||
      (first.meaning || "").localeCompare(second.meaning || "")
    );
  });
}

function Kanji() {
  const [kanjiEntries, setKanjiEntries] = useState(() => loadKanji() ?? kanjiDefaults);
  const [vocabularyEntries, setVocabularyEntries] = useState(() => loadVocabulary());
  const [suggestedWords, setSuggestedWords] = useState([]);
  const [editingEntry, setEditingEntry] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [favorites, setFavorites] = useState(() => loadFavorites());
  const [activeFilter, setActiveFilter] = useState("All");

  useEffect(() => {
    saveKanji(kanjiEntries);
  }, [kanjiEntries]);

  useEffect(() => {
    saveVocabulary(vocabularyEntries);
  }, [vocabularyEntries]);

  useEffect(() => {
    saveFavorites(favorites);
  }, [favorites]);

  const filteredEntries = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    let entries = kanjiEntries;

    if (activeFilter === "Favorites") {
      entries = entries.filter((entry) => favorites.has(entry.id));
    } else if (jlptLevels.includes(activeFilter)) {
      entries = entries.filter((entry) => entry.jlptLevel === activeFilter);
    }

    if (!normalizedSearch) {
      return sortKanjiEntries(entries);
    }

    return sortKanjiEntries(entries.filter((entry) =>
      [
        entry.kanji,
        entry.jlptLevel,
        entry.meaning,
        entry.onyomi,
        entry.kunyomi,
        entry.example,
        entry.notes,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    ));
  }, [kanjiEntries, searchTerm, favorites, activeFilter]);

  const groupedEntries = useMemo(() => {
    const groups = jlptLevels.map((level) => ({
      level,
      entries: filteredEntries.filter((entry) => entry.jlptLevel === level),
    }));
    const unknownEntries = filteredEntries.filter((entry) => !jlptLevels.includes(entry.jlptLevel));

    return unknownEntries.length > 0
      ? [...groups, { level: "Unknown", entries: unknownEntries }]
      : groups;
  }, [filteredEntries]);

  function handleSubmit(formData) {
    if (formData.vocabularyEntry) {
      const timestamp = Date.now();
      const nextVocabularyEntry = {
        ...formData.vocabularyEntry,
        id: timestamp,
      };

      setVocabularyEntries((currentEntries) => {
        const withoutDuplicate = currentEntries.filter(
          (entry) => entry.word !== nextVocabularyEntry.word,
        );
        return [nextVocabularyEntry, ...withoutDuplicate];
      });

      setKanjiEntries((currentEntries) => {
        const existingKanji = new Set(currentEntries.map((entry) => entry.kanji));
        const newEntries = (formData.generatedKanjiEntries || [])
          .filter((entry) => !existingKanji.has(entry.kanji))
          .map((entry, index) => ({
            ...entry,
            id: timestamp + index + 1,
          }));

        return [...newEntries, ...currentEntries];
      });
      return;
    }

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
      { ...formData, generatedKanjiEntries: undefined, vocabularyEntry: undefined, id: Date.now() },
      ...currentEntries,
    ]);
  }

  function handleDeleteVocabulary(id) {
    setVocabularyEntries((currentEntries) => currentEntries.filter((entry) => entry.id !== id));
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
            onSuggestionsChange={setSuggestedWords}
          />

          <div style={styles.filterPanel}>
            <p style={styles.kicker}>Filter</p>
            <div style={styles.sidebarFilters}>
              {filterOptions.map((filter) => {
                const count =
                  filter === "All"
                    ? kanjiEntries.length
                    : filter === "Favorites"
                      ? favoritesCount
                      : kanjiEntries.filter((entry) => entry.jlptLevel === filter).length;
                const isActive = activeFilter === filter;

                return (
                  <button
                    key={filter}
                    type="button"
                    style={isActive ? styles.sidebarFilterActive : styles.sidebarFilter}
                    onClick={() => setActiveFilter(filter)}
                  >
                    <span>{filter}</span>
                    <span style={styles.filterCount}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
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

          <section style={styles.vocabularyPanel}>
            <div style={styles.panelHeader}>
              <div>
                <p style={styles.kicker}>Vocabulary</p>
                <h2 style={styles.sectionTitle}>{vocabularyEntries.length} saved words</h2>
              </div>
            </div>

            {vocabularyEntries.length > 0 ? (
              <div style={styles.vocabList}>
                {vocabularyEntries.map((entry) => (
                  <article key={entry.id} style={styles.vocabCard}>
                    <div>
                      <div style={styles.vocabTopLine}>
                        <h3 style={styles.vocabWord}>{entry.word}</h3>
                        <span style={styles.vocabBadge}>{entry.jlptLevel || "Unknown"}</span>
                      </div>
                      {entry.reading && <p style={styles.vocabReading}>{entry.reading}</p>}
                      <p style={styles.vocabMeaning}>{entry.meaning || "Meaning unavailable"}</p>
                    </div>
                    <button
                      type="button"
                      style={styles.vocabDeleteButton}
                      onClick={() => handleDeleteVocabulary(entry.id)}
                    >
                      Delete
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <p style={styles.mutedCopy}>Autofill a multi-kanji word to save it here.</p>
            )}

            {suggestedWords.length > 0 && (
              <div style={styles.suggestionsBlock}>
                <h3 style={styles.suggestionsTitle}>Similar words</h3>
                <div style={styles.suggestionList}>
                  {suggestedWords.map((word) => (
                    <div key={`${word.word}-${word.reading}`} style={styles.suggestionChip}>
                      <span style={styles.suggestionWord}>{word.word}</span>
                      {word.reading && <span style={styles.suggestionReading}>{word.reading}</span>}
                      {word.meaning && <span style={styles.suggestionMeaning}>{word.meaning}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {filteredEntries.length > 0 ? (
            <div style={styles.groupStack}>
              {groupedEntries
                .filter((group) => group.entries.length > 0)
                .map((group) => (
                  <section key={group.level} style={styles.levelGroup}>
                    <div style={styles.groupHeader}>
                      <h3 style={styles.groupTitle}>{group.level}</h3>
                      <span style={styles.groupCount}>{group.entries.length}</span>
                    </div>
                    <div style={styles.cardGrid}>
                      {group.entries.map((entry) => (
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
                  </section>
                ))}
            </div>
          ) : (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>{activeFilter === "Favorites" ? "⭐" : "🔍"}</div>
              <h2 style={styles.emptyTitle}>
                {activeFilter === "Favorites" ? "No favorites yet" : "No kanji found"}
              </h2>
              <p style={styles.emptyCopy}>
                {activeFilter === "Favorites"
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
  filterPanel: {
    background: "rgba(15, 23, 42, 0.78)",
    border: "1px solid rgba(226, 232, 240, 0.16)",
    borderRadius: "12px",
    boxShadow: "0 18px 36px rgba(0, 0, 0, 0.24)",
    marginTop: "16px",
    padding: "18px",
  },
  sidebarFilters: {
    display: "grid",
    gap: "8px",
    marginTop: "12px",
  },
  sidebarFilter: {
    alignItems: "center",
    background: "rgba(30, 41, 59, 0.5)",
    border: "1px solid rgba(148, 163, 184, 0.18)",
    borderRadius: "8px",
    color: "#cbd5e1",
    cursor: "pointer",
    display: "flex",
    fontFamily: "inherit",
    fontSize: "0.92rem",
    fontWeight: 800,
    justifyContent: "space-between",
    padding: "10px 12px",
    textAlign: "left",
  },
  sidebarFilterActive: {
    alignItems: "center",
    background: "rgba(20, 184, 166, 0.16)",
    border: "1px solid rgba(94, 234, 212, 0.38)",
    borderRadius: "8px",
    color: "#ccfbf1",
    cursor: "pointer",
    display: "flex",
    fontFamily: "inherit",
    fontSize: "0.92rem",
    fontWeight: 900,
    justifyContent: "space-between",
    padding: "10px 12px",
    textAlign: "left",
  },
  filterCount: {
    color: "#94a3b8",
    fontSize: "0.82rem",
    fontWeight: 900,
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
  vocabularyPanel: {
    background: "rgba(15, 23, 42, 0.72)",
    border: "1px solid rgba(226, 232, 240, 0.14)",
    borderRadius: "10px",
    marginBottom: "22px",
    padding: "18px",
  },
  panelHeader: {
    alignItems: "center",
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "14px",
  },
  vocabList: {
    display: "grid",
    gap: "10px",
  },
  vocabCard: {
    alignItems: "flex-start",
    background: "rgba(30, 41, 59, 0.58)",
    border: "1px solid rgba(148, 163, 184, 0.16)",
    borderRadius: "8px",
    display: "flex",
    gap: "12px",
    justifyContent: "space-between",
    padding: "14px",
  },
  vocabTopLine: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "9px",
  },
  vocabWord: {
    color: "#f8fafc",
    fontFamily: "inherit",
    fontSize: "1.35rem",
    fontWeight: 900,
    lineHeight: 1.1,
    margin: 0,
  },
  vocabBadge: {
    background: "rgba(20, 184, 166, 0.14)",
    border: "1px solid rgba(94, 234, 212, 0.3)",
    borderRadius: "999px",
    color: "#99f6e4",
    fontSize: "0.74rem",
    fontWeight: 900,
    padding: "4px 8px",
  },
  vocabReading: {
    color: "#bfdbfe",
    fontSize: "0.93rem",
    fontWeight: 800,
    margin: "7px 0 0",
  },
  vocabMeaning: {
    color: "#cbd5e1",
    fontSize: "0.95rem",
    lineHeight: 1.45,
    margin: "7px 0 0",
  },
  vocabDeleteButton: {
    background: "rgba(244, 63, 94, 0.16)",
    border: "1px solid rgba(251, 113, 133, 0.32)",
    borderRadius: "8px",
    color: "#fecdd3",
    cursor: "pointer",
    flexShrink: 0,
    fontFamily: "inherit",
    fontWeight: 800,
    padding: "8px 12px",
  },
  mutedCopy: {
    color: "#94a3b8",
    fontSize: "0.95rem",
    margin: 0,
  },
  suggestionsBlock: {
    borderTop: "1px solid rgba(148, 163, 184, 0.14)",
    marginTop: "16px",
    paddingTop: "14px",
  },
  suggestionsTitle: {
    color: "#f8fafc",
    fontFamily: "inherit",
    fontSize: "0.92rem",
    fontWeight: 900,
    margin: "0 0 10px",
  },
  suggestionList: {
    display: "grid",
    gap: "8px",
    gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 210px), 1fr))",
  },
  suggestionChip: {
    background: "rgba(2, 6, 23, 0.42)",
    border: "1px solid rgba(148, 163, 184, 0.14)",
    borderRadius: "8px",
    display: "grid",
    gap: "4px",
    padding: "10px",
  },
  suggestionWord: {
    color: "#f8fafc",
    fontSize: "1rem",
    fontWeight: 900,
  },
  suggestionReading: {
    color: "#93c5fd",
    fontSize: "0.82rem",
    fontWeight: 800,
  },
  suggestionMeaning: {
    color: "#94a3b8",
    fontSize: "0.82rem",
    lineHeight: 1.35,
  },
  groupStack: {
    display: "grid",
    gap: "22px",
  },
  levelGroup: {
    minWidth: 0,
  },
  groupHeader: {
    alignItems: "center",
    display: "flex",
    gap: "10px",
    marginBottom: "10px",
  },
  groupTitle: {
    color: "#f8fafc",
    fontFamily: "inherit",
    fontSize: "1rem",
    fontWeight: 900,
    margin: 0,
  },
  groupCount: {
    background: "rgba(148, 163, 184, 0.14)",
    border: "1px solid rgba(148, 163, 184, 0.18)",
    borderRadius: "999px",
    color: "#cbd5e1",
    fontSize: "0.76rem",
    fontWeight: 900,
    padding: "3px 8px",
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
