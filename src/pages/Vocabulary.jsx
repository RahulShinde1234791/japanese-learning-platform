import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import VocabularyCard from "../components/VocabularyCard";
import VocabularyForm from "../components/VocabularyForm";
import vocabularyDefaults from "../data/vocabularyDefaults";
import {
  loadVocabulary,
  loadVocabularyFavorites,
  saveVocabulary,
  saveVocabularyFavorites,
} from "../utils/localStorage";

const floatingWords = ["語", "言", "论", "詞", "文", "読", "書", "記", "心", "知", "意", "語彙"];
const kanjiPattern = /\p{Script=Han}/u;

function hasKanjiMeaningFallback(entry) {
  const kanjiChars = Array.from(entry.word || "").filter((char) => kanjiPattern.test(char));
  if (kanjiChars.length < 2 || !entry.meaning) return false;

  return kanjiChars.some((char) => entry.meaning.includes(`${char}:`));
}

function buildExampleSentence(word) {
  if (!word) return "";
  if (word.endsWith("る")) return `${word}ことが好きです。`;
  return `${word}を使います。`;
}

function normalizeVocabularyEntry(entry) {
  return {
    ...entry,
    meaning: hasKanjiMeaningFallback(entry) ? "" : entry.meaning,
    exampleSentence: entry.exampleSentence || buildExampleSentence(entry.word),
  };
}

function Vocabulary() {
  const [entries, setEntries] = useState(() =>
    (loadVocabulary() ?? vocabularyDefaults).map(normalizeVocabularyEntry),
  );
  const [editingEntry, setEditingEntry] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [favorites, setFavorites] = useState(() => loadVocabularyFavorites());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => { saveVocabulary(entries); }, [entries]);
  useEffect(() => { saveVocabularyFavorites(favorites); }, [favorites]);

  const filteredEntries = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    let list = showFavoritesOnly ? entries.filter((e) => favorites.has(e.id)) : entries;
    if (!q) return list;
    return list.filter((e) =>
      [e.word, e.reading, e.meaning, e.exampleSentence, e.notes]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [entries, searchTerm, favorites, showFavoritesOnly]);

  function handleSubmit(formData) {
    if (editingEntry) {
      setEntries((prev) =>
        prev.map((e) => (e.id === editingEntry.id ? { ...formData, id: editingEntry.id } : e)),
      );
      setEditingEntry(null);
      return;
    }
    setEntries((prev) => [{ ...formData, id: Date.now() }, ...prev]);
  }

  function handleDelete(id) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setFavorites((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    if (editingEntry?.id === id) setEditingEntry(null);
  }

  function handleToggleFavorite(id) {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div style={styles.page}>
      {/* Floating words */}
      {floatingWords.map((w, i) => (
        <span
          key={w + i}
          style={{
            ...styles.floatWord,
            left: `${(i * 79) % 91}%`,
            top: `${(i * 131 + 9) % 86}%`,
            animationDelay: `${i * 0.75}s`,
            fontSize: `${1.6 + (i % 4) * 0.7}rem`,
            opacity: 0.035 + (i % 4) * 0.02,
          }}
        >
          {w}
        </span>
      ))}

      <div style={styles.pageContent}>
        <Link to="/" style={styles.backLink}>← Home</Link>

        <header style={styles.header}>
          <p style={styles.heroKicker}>語彙コレクション</p>
          <h1 style={styles.title}>Vocabulary</h1>
          <p style={styles.subtitle}>
            Build your personal word list with readings, meanings, and example sentences.
          </p>
        </header>

      <main style={styles.layout}>
        <aside style={styles.sidebar}>
          <VocabularyForm
            key={editingEntry?.id ?? "new-vocab"}
            editingEntry={editingEntry}
            onCancelEdit={() => setEditingEntry(null)}
            onSubmit={handleSubmit}
          />
        </aside>

        <section style={styles.content}>
          {/* Search & stats */}
          <div style={styles.searchPanel}>
            <div>
              <p style={styles.kicker}>Collection</p>
              <h2 style={styles.sectionTitle}>{entries.length} saved words</h2>
            </div>
            <input
              placeholder="Search words, readings, meanings…"
              style={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter bar */}
          <div style={styles.filterBar}>
            <button
              type="button"
              style={!showFavoritesOnly ? styles.filterActive : styles.filter}
              onClick={() => setShowFavoritesOnly(false)}
            >
              All ({entries.length})
            </button>
            <button
              type="button"
              style={showFavoritesOnly ? styles.filterFavActive : styles.filter}
              onClick={() => setShowFavoritesOnly(true)}
            >
              ⭐ Favorites ({favorites.size})
            </button>
          </div>

          {filteredEntries.length > 0 ? (
            <div style={styles.cardGrid}>
              {filteredEntries.map((entry) => (
                <VocabularyCard
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
              <div style={styles.emptyIcon}>{showFavoritesOnly ? "⭐" : "📖"}</div>
              <h2 style={styles.emptyTitle}>
                {showFavoritesOnly ? "No favorites yet" : "No words found"}
              </h2>
              <p style={styles.emptyCopy}>
                {showFavoritesOnly
                  ? "Star a word card to add it to your favorites."
                  : "Try a different search or add a new word."}
              </p>
            </div>
          )}
        </section>
      </main>
      </div>

      <style>{`
        @keyframes orbFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-38px) scale(1.07); }
        }
        @keyframes wordDrift {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(-5deg); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, rgba(56, 189, 248, 0.14) 0%, transparent 36%), linear-gradient(160deg, #061826 0%, #102646 50%, #14172f 100%)",
    boxSizing: "border-box",
    color: "white",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    overflow: "hidden",
    position: "relative",
  },
  floatWord: {
    position: "absolute",
    color: "#a5b4fc",
    fontWeight: 900,
    pointerEvents: "none",
    userSelect: "none",
    animation: "wordDrift 7s ease-in-out infinite",
    zIndex: 0,
  },
  pageContent: {
    position: "relative",
    zIndex: 1,
    padding: "clamp(20px, 4vw, 40px) clamp(16px, 4vw, 24px) 56px",
  },
  heroKicker: {
    color: "#a5b4fc",
    fontSize: "1.4rem",
    fontWeight: 900,
    letterSpacing: "0.08em",
    marginBottom: "8px",
    opacity: 0.85,
  },
  backLink: {
    color: "#a5b4fc",
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
  sidebar: { position: "sticky", top: "24px" },
  content: { minWidth: 0 },
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
    color: "#a5b4fc",
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
  filter: {
    background: "rgba(30, 41, 59, 0.5)",
    border: "1px solid rgba(148, 163, 184, 0.18)",
    borderRadius: "999px",
    color: "#94a3b8",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "0.88rem",
    fontWeight: 700,
    padding: "8px 18px",
  },
  filterActive: {
    background: "rgba(124, 58, 237, 0.18)",
    border: "1px solid rgba(167, 139, 250, 0.4)",
    borderRadius: "999px",
    color: "#a5b4fc",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "0.88rem",
    fontWeight: 700,
    padding: "8px 18px",
  },
  filterFavActive: {
    background: "rgba(251, 191, 36, 0.14)",
    border: "1px solid rgba(251, 191, 36, 0.35)",
    borderRadius: "999px",
    color: "#fbbf24",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "0.88rem",
    fontWeight: 700,
    padding: "8px 18px",
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
  emptyIcon: { fontSize: "2.4rem", marginBottom: "14px" },
  emptyTitle: {
    color: "white",
    fontSize: "1.4rem",
    margin: "0 0 8px",
    fontFamily: "inherit",
  },
  emptyCopy: { color: "#94a3b8", fontSize: "0.95rem" },
};

export default Vocabulary;
