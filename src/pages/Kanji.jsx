import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import KanjiCard from "../components/KanjiCard";
import KanjiForm from "../components/KanjiForm";
import VocabularyCard from "../components/VocabularyCard";
import VocabularyForm from "../components/VocabularyForm";
import kanjiDefaults from "../data/kanjiDefaults";
import vocabularyDefaults from "../data/vocabularyDefaults";
import {
  loadKanji,
  loadKanjiFavorites,
  saveKanji,
  saveKanjiFavorites,
  loadVocabulary,
  loadVocabularyFavorites,
  saveVocabulary,
  saveVocabularyFavorites,
} from "../utils/localStorage";

const floatingKanji = ["漢", "字", "学", "日", "人", "山", "水", "火", "木", "金", "土", "月"];
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

function Kanji() {
  const [kanjiEntries, setKanjiEntries] = useState(() => loadKanji() ?? kanjiDefaults);
  const [vocabEntries, setVocabEntries] = useState(() =>
    (loadVocabulary() ?? vocabularyDefaults).map(normalizeVocabularyEntry),
  );
  
  const [activeForm, setActiveForm] = useState("kanji"); // "kanji" or "vocab"
  const [editingEntry, setEditingEntry] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [kanjiFavorites, setKanjiFavorites] = useState(() => loadKanjiFavorites());
  const [vocabFavorites, setVocabFavorites] = useState(() => loadVocabularyFavorites());
  
  const [activeFilter, setActiveFilter] = useState("all"); // "all", "favorites", "N5", "N4", "N3", "N2", "N1"

  useEffect(() => { saveKanji(kanjiEntries); }, [kanjiEntries]);
  useEffect(() => { saveKanjiFavorites(kanjiFavorites); }, [kanjiFavorites]);
  useEffect(() => { saveVocabulary(vocabEntries); }, [vocabEntries]);
  useEffect(() => { saveVocabularyFavorites(vocabFavorites); }, [vocabFavorites]);

  const filteredEntries = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    const isKanjiTab = activeForm === "kanji";

    let entries = isKanjiTab
      ? kanjiEntries.map((entry) => ({ ...entry, type: "kanji" }))
      : vocabEntries.map((entry) => ({ ...entry, type: "vocab" }));

    if (activeFilter === "favorites") {
      entries = isKanjiTab
        ? entries.filter((entry) => kanjiFavorites.has(entry.id))
        : entries.filter((entry) => vocabFavorites.has(entry.id));
    } else if (isKanjiTab && activeFilter !== "all") {
      entries = entries.filter((entry) => entry.jlpt === activeFilter);
    }

    if (q) {
      entries = entries.filter((entry) => {
        if (isKanjiTab) {
          return [
            entry.kanji,
            entry.meaning,
            entry.onyomi,
            entry.kunyomi,
            entry.jlpt,
            entry.notes,
          ]
            .join(" ")
            .toLowerCase()
            .includes(q);
        }

        return [
          entry.word,
          entry.reading,
          entry.meaning,
          entry.exampleSentence,
          entry.notes,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q);
      });
    }

    return entries.sort((a, b) => (b.id || 0) - (a.id || 0));
  }, [
    activeForm,
    kanjiEntries,
    vocabEntries,
    searchTerm,
    kanjiFavorites,
    vocabFavorites,
    activeFilter,
  ]);

  function handleKanjiSubmit(formData) {
    if (editingEntry && editingEntry.type === "kanji") {
      setKanjiEntries((prev) =>
        prev.map((e) => (e.id === editingEntry.id ? { ...formData, id: editingEntry.id } : e)),
      );
      setEditingEntry(null);
      return;
    }
    setKanjiEntries((prev) => [{ ...formData, id: Date.now() }, ...prev]);
  }

  function handleVocabSubmit(formData) {
    if (editingEntry && editingEntry.type === "vocab") {
      setVocabEntries((prev) =>
        prev.map((e) => (e.id === editingEntry.id ? { ...formData, id: editingEntry.id } : e)),
      );
      setEditingEntry(null);
      return;
    }
    setVocabEntries((prev) => [{ ...formData, id: Date.now() }, ...prev]);
  }

  function handleDelete(id, type) {
    if (type === "kanji") {
      setKanjiEntries((prev) => prev.filter((e) => e.id !== id));
      setKanjiFavorites((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } else {
      setVocabEntries((prev) => prev.filter((e) => e.id !== id));
      setVocabFavorites((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
    if (editingEntry?.id === id) setEditingEntry(null);
  }

  function handleToggleFavorite(id, type) {
    if (type === "kanji") {
      setKanjiFavorites((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });
    } else {
      setVocabFavorites((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });
    }
  }

  function startEditing(entry) {
    setActiveForm(entry.type);
    setEditingEntry(entry);
  }

  return (
    <div style={styles.page}>
      <div style={styles.glowOrb1} />
      <div style={styles.glowOrb2} />
      {/* Floating kanji */}
      {floatingKanji.map((k, i) => (
        <span
          key={k}
          style={{
            ...styles.floatKanji,
            left: `${(i * 83) % 92}%`,
            top: `${(i * 127 + 5) % 87}%`,
            animationDelay: `${i * 0.8}s`,
            fontSize: `${2 + (i % 4) * 0.8}rem`,
            opacity: 0.03 + (i % 4) * 0.02,
          }}
        >
          {k}
        </span>
      ))}

      <div style={styles.pageContent}>
        <Link to="/" style={styles.backLink}>← Home</Link>

        <header style={styles.header}>
          <p style={styles.heroKicker}>漢字ノートと語彙</p>
          <h1 style={styles.title}>Kanji & Vocab</h1>
          <p style={styles.subtitle}>
            Build your personal kanji and vocabulary notebook with meanings, readings, and study notes.
          </p>
        </header>

      <div style={styles.pageTabs}>
        <button
          type="button"
          style={activeForm === "kanji" ? styles.pageTabActive : styles.pageTab}
          onClick={() => {
            setActiveForm("kanji");
            setEditingEntry(null);
            setActiveFilter("all");
          }}
        >
          Kanji
        </button>

        <button
          type="button"
          style={activeForm === "vocab" ? styles.pageTabActive : styles.pageTab}
          onClick={() => {
            setActiveForm("vocab");
            setEditingEntry(null);
            setActiveFilter("all");
          }}
        >
          Vocabulary
        </button>
      </div>

      <main style={styles.layout}>
        <aside style={styles.sidebar}>

          {activeForm === "kanji" ? (
            <KanjiForm
              key={editingEntry?.id ?? "new-kanji"}
              editingEntry={editingEntry?.type === "kanji" ? editingEntry : null}
              onCancelEdit={() => setEditingEntry(null)}
              onSubmit={handleKanjiSubmit}
            />
          ) : (
            <VocabularyForm
              key={editingEntry?.id ?? "new-vocab"}
              editingEntry={editingEntry?.type === "vocab" ? editingEntry : null}
              onCancelEdit={() => setEditingEntry(null)}
              onSubmit={handleVocabSubmit}
            />
          )}
        </aside>

        <section style={styles.content}>
          <div style={styles.searchPanel}>
            <div>
              <p style={styles.kicker}>Collection</p>
              <h2 style={styles.sectionTitle}>
                {activeForm === "kanji"
                  ? `${kanjiEntries.length} saved kanji`
                  : `${vocabEntries.length} saved words`}
              </h2>
            </div>
            <input
              placeholder={
                activeForm === "kanji"
                  ? "Search kanji, readings, meanings…"
                  : "Search words, readings, meanings…"
              }
              style={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={styles.filterBar}>
            <button
              type="button"
              style={activeFilter === "all" ? styles.filterActive : styles.filter}
              onClick={() => setActiveFilter("all")}
            >
              All ({activeForm === "kanji" ? kanjiEntries.length : vocabEntries.length})
            </button>
            <button
              type="button"
              style={activeFilter === "favorites" ? styles.filterFavActive : styles.filter}
              onClick={() => setActiveFilter("favorites")}
            >
              ⭐ Favorites (
                {activeForm === "kanji"
                  ? kanjiFavorites.size
                  : vocabFavorites.size}
              )
            </button>
            {activeForm === "kanji" && (
              <>
                <button
                  type="button"
                  style={activeFilter === "N5" ? styles.filterJlptActive : styles.filter}
                  onClick={() => setActiveFilter("N5")}
                >
                  N5
                </button>
                <button
                  type="button"
                  style={activeFilter === "N4" ? styles.filterJlptActive : styles.filter}
                  onClick={() => setActiveFilter("N4")}
                >
                  N4
                </button>
                <button
                  type="button"
                  style={activeFilter === "N3" ? styles.filterJlptActive : styles.filter}
                  onClick={() => setActiveFilter("N3")}
                >
                  N3
                </button>
                <button
                  type="button"
                  style={activeFilter === "N2" ? styles.filterJlptActive : styles.filter}
                  onClick={() => setActiveFilter("N2")}
                >
                  N2
                </button>
                <button
                  type="button"
                  style={activeFilter === "N1" ? styles.filterJlptActive : styles.filter}
                  onClick={() => setActiveFilter("N1")}
                >
                  N1
                </button>
              </>
            )}
            </div>

          {filteredEntries.length > 0 ? (
            <div style={styles.cardGrid}>
              {filteredEntries.map((entry) => (
                entry.type === "kanji" ? (
                  <KanjiCard
                    key={`k-${entry.id}`}
                    entry={entry}
                    isFavorite={kanjiFavorites.has(entry.id)}
                    onDelete={(id) => handleDelete(id, "kanji")}
                    onEdit={startEditing}
                    onToggleFavorite={(id) => handleToggleFavorite(id, "kanji")}
                  />
                ) : (
                  <VocabularyCard
                    key={`v-${entry.id}`}
                    entry={entry}
                    isFavorite={vocabFavorites.has(entry.id)}
                    onDelete={(id) => handleDelete(id, "vocab")}
                    onEdit={startEditing}
                    onToggleFavorite={(id) => handleToggleFavorite(id, "vocab")}
                  />
                )
              ))}
            </div>
          ) : (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>{activeFilter === "favorites" ? "⭐" : "🔍"}</div>
              <h2 style={styles.emptyTitle}>
                {activeFilter === "favorites" ? "No favorites yet" : "No entries found"}
              </h2>
              <p style={styles.emptyCopy}>
                {activeFilter === "favorites"
                  ? "Star an entry to add it to your favorites."
                  : "Try a different search, filter, or add a new entry."}
              </p>
            </div>
          )}
        </section>
      </main>
      </div>

      <style>{`
        @keyframes orbFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-36px) scale(1.07); }
        }
        @keyframes kanjiDrift {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-22px) rotate(4deg); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#020617",
    backgroundImage: "radial-gradient(ellipse at bottom, rgba(15, 23, 42, 1) 0%, rgba(2, 6, 23, 1) 100%)",
    boxSizing: "border-box",
    color: "white",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    overflow: "hidden",
    position: "relative",
  },
  glowOrb1: {
    position: "absolute",
    top: "-5%",
    right: "-10%",
    width: "45vw",
    height: "45vw",
    background: "radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%)",
    borderRadius: "50%",
    zIndex: 0,
    pointerEvents: "none",
  },
  glowOrb2: {
    position: "absolute",
    bottom: "-15%",
    left: "-5%",
    width: "55vw",
    height: "55vw",
    background: "radial-gradient(circle, rgba(245, 158, 11, 0.12) 0%, transparent 70%)",
    borderRadius: "50%",
    zIndex: 0,
    pointerEvents: "none",
  },
  floatKanji: {
    position: "absolute",
    color: "#f9a8d4",
    fontWeight: 900,
    pointerEvents: "none",
    userSelect: "none",
    animation: "kanjiDrift 7s ease-in-out infinite",
    zIndex: 0,
  },
  pageContent: {
    position: "relative",
    zIndex: 1,
    padding: "clamp(20px, 4vw, 40px) clamp(16px, 4vw, 24px) 56px",
  },
  heroKicker: {
    color: "#f9a8d4",
    fontSize: "1.5rem",
    fontWeight: 900,
    letterSpacing: "0.1em",
    marginBottom: "8px",
    opacity: 0.8,
  },
  backLink: {
    color: "#f9a8d4",
    display: "inline-flex",
    fontWeight: 700,
    marginBottom: "28px",
    textDecoration: "none",
    fontSize: "0.95rem",
  },
  header: { margin: "0 auto 36px", maxWidth: "860px", textAlign: "center" },
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
  pageTabs: {
    display: "flex",
    gap: "8px",
    margin: "0 auto 24px",
    maxWidth: "1240px",
    background: "rgba(15, 23, 42, 0.78)",
    padding: "6px",
    borderRadius: "12px",
    border: "1px solid rgba(226, 232, 240, 0.16)",
  },

  pageTab: {
    flex: 1,
    background: "transparent",
    border: "none",
    color: "#94a3b8",
    padding: "12px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 800,
    fontSize: "1rem",
    fontFamily: "inherit",
  },

  pageTabActive: {
    flex: 1,
    background: "rgba(255, 255, 255, 0.1)",
    border: "none",
    color: "#f8fafc",
    padding: "12px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 800,
    fontSize: "1rem",
    fontFamily: "inherit",
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
  },
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
  filterBar: { display: "flex", gap: "10px", marginBottom: "18px", flexWrap: "wrap" },
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
    background: "rgba(236, 72, 153, 0.18)",
    border: "1px solid rgba(236, 72, 153, 0.4)",
    borderRadius: "999px",
    color: "#f9a8d4",
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
  filterJlptActive: {
    background: "rgba(16, 185, 129, 0.18)",
    border: "1px solid rgba(16, 185, 129, 0.45)",
    borderRadius: "999px",
    color: "#6ee7b7",
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

export default Kanji;
