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

const floatingKanji = [
  "漢",
  "字",
  "学",
  "日",
  "人",
  "山",
  "水",
  "火",
  "木",
  "金",
  "土",
  "月",
];

const kanjiPattern = /\p{Script=Han}/u;

function hasKanjiMeaningFallback(entry) {
  const kanjiChars = Array.from(entry.word || "").filter((char) =>
    kanjiPattern.test(char),
  );

  if (kanjiChars.length < 2 || !entry.meaning) return false;

  return kanjiChars.some((char) => entry.meaning.includes(`${char}:`));
}

function normalizeVocabularyEntry(entry) {
  return {
    ...entry,
    meaning: hasKanjiMeaningFallback(entry) ? "" : entry.meaning,
    exampleSentence: entry.exampleSentence || "",
  };
}

function Kanji() {
  const [kanjiEntries, setKanjiEntries] = useState(
    () => loadKanji() ?? kanjiDefaults,
  );

  const [vocabEntries, setVocabEntries] = useState(() =>
    (loadVocabulary() ?? vocabularyDefaults).map(normalizeVocabularyEntry),
  );

  const [activeForm, setActiveForm] = useState("kanji");
  const [editingEntry, setEditingEntry] = useState(null);
  const [quickAddText, setQuickAddText] = useState("");
  const [selectedQuickAddCharacters, setSelectedQuickAddCharacters] = useState(
    new Set(),
  );
  const [prefilledVocabWord, setPrefilledVocabWord] = useState("");

  const [searchTerm, setSearchTerm] = useState("");

  const [kanjiFavorites, setKanjiFavorites] = useState(() =>
    loadKanjiFavorites(),
  );

  const [vocabFavorites, setVocabFavorites] = useState(() =>
    loadVocabularyFavorites(),
  );

  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    saveKanji(kanjiEntries);
  }, [kanjiEntries]);

  useEffect(() => {
    saveKanjiFavorites(kanjiFavorites);
  }, [kanjiFavorites]);

  useEffect(() => {
    saveVocabulary(vocabEntries);
  }, [vocabEntries]);

  useEffect(() => {
    saveVocabularyFavorites(vocabFavorites);
  }, [vocabFavorites]);

  /*
   * -----------------------------
   * Kanji filtering
   * -----------------------------
   */

  const filteredKanjiEntries = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    let entries = [...kanjiEntries];

    if (activeFilter === "favorites") {
      entries = entries.filter((entry) => kanjiFavorites.has(entry.id));
    } else if (activeFilter !== "all") {
      entries = entries.filter((entry) => entry.jlpt === activeFilter);
    }

    if (q) {
      entries = entries.filter((entry) =>
        [
          entry.kanji,
          entry.meaning,
          entry.onyomi,
          entry.kunyomi,
          entry.jlpt,
          entry.notes,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q),
      );
    }

    return entries.sort((a, b) => (b.id || 0) - (a.id || 0));
  }, [
    kanjiEntries,
    searchTerm,
    kanjiFavorites,
    activeFilter,
  ]);

  /*
   * -----------------------------
   * Vocabulary filtering
   * -----------------------------
   */

  const filteredVocabEntries = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    let entries = [...vocabEntries];

    if (activeFilter === "favorites") {
      entries = entries.filter((entry) => vocabFavorites.has(entry.id));
    }

    if (q) {
      entries = entries.filter((entry) =>
        [
          entry.word,
          entry.reading,
          entry.meaning,
          entry.exampleSentence,
          entry.notes,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q),
      );
    }

    return entries.sort((a, b) => (b.id || 0) - (a.id || 0));
  }, [
    vocabEntries,
    searchTerm,
    vocabFavorites,
    activeFilter,
  ]);

  /*
   * -----------------------------
   * Kanji actions
   * -----------------------------
   */

  function handleUseAsVocabulary(word) {
    setPrefilledVocabWord(word);
    setActiveForm("vocab");
    setEditingEntry(null);
    setActiveFilter("all");
  }
  
  function handleKanjiSubmit(formData) {
    const normalizedKanji = formData.kanji?.trim();

    if (!normalizedKanji) return;

    if (editingEntry?.type === "kanji") {
      const duplicateExists = kanjiEntries.some(
        (entry) =>
          entry.id !== editingEntry.id &&
          entry.kanji?.trim() === normalizedKanji,
      );

      if (duplicateExists) {
        alert(`Kanji "${normalizedKanji}" already exists in your collection.`);
        return;
      }

      setKanjiEntries((prev) =>
        prev.map((entry) =>
          entry.id === editingEntry.id
            ? { ...formData, kanji: normalizedKanji, id: editingEntry.id }
            : entry,
        ),
      );

      setEditingEntry(null);
      return;
    }

    const duplicateExists = kanjiEntries.some(
      (entry) => entry.kanji?.trim() === normalizedKanji,
    );

    if (duplicateExists) {
      alert(`Kanji "${normalizedKanji}" is already in your collection.`);
      return;
    }

    setKanjiEntries((prev) => [
      {
        ...formData,
        kanji: normalizedKanji,
        id: Date.now(),
      },
      ...prev,
    ]);
  }

  function handleAddSelectedKanji(results) {
    if (!results.length) return;

    const addedKanji = [];
    const duplicateKanji = [];

    setKanjiEntries((prev) => {
      const existingKanji = new Set(
        prev.map((entry) => entry.kanji?.trim()).filter(Boolean),
      );

      const newEntries = results
        .filter((result) => {
          if (!result.success) return false;

          if (existingKanji.has(result.char)) {
            duplicateKanji.push(result.char);
            return false;
          }

          existingKanji.add(result.char);
          addedKanji.push(result.char);
          return true;
        })
        .map((result) => ({
          id: Date.now() + Math.random(),
          kanji: result.char,
          jlpt: result.jlpt || "",
          meaning: result.meaning || "",
          onyomi: result.onyomi || "",
          kunyomi: result.kunyomi || "",
          notes: "",
        }));

      return [...newEntries, ...prev];
    });

    const messages = [];

    if (addedKanji.length > 0) {
      messages.push(`Added: ${addedKanji.join(", ")}`);
    }

    if (duplicateKanji.length > 0) {
      messages.push(`Already existed: ${duplicateKanji.join(", ")}`);
    }

    if (messages.length > 0) {
      alert(messages.join("\n"));
    }
  }

  /*
   * -----------------------------
   * Vocabulary actions
   * -----------------------------
   */

  function handleVocabSubmit(formData) {
    const normalizedWord = formData.word?.trim();

    if (!normalizedWord) return;

    if (editingEntry?.type === "vocab") {
      const duplicateExists = vocabEntries.some(
        (entry) =>
          entry.id !== editingEntry.id &&
          entry.word?.trim() === normalizedWord,
      );

      if (duplicateExists) {
        alert(`Vocabulary "${normalizedWord}" already exists in your collection.`);
        return;
      }

      setVocabEntries((prev) =>
        prev.map((entry) =>
          entry.id === editingEntry.id
            ? { ...formData, word: normalizedWord, id: editingEntry.id }
            : entry,
        ),
      );

      setEditingEntry(null);
      return;
    }

    const duplicateExists = vocabEntries.some(
      (entry) => entry.word?.trim() === normalizedWord,
    );

    if (duplicateExists) {
      alert(`Vocabulary "${normalizedWord}" is already in your collection.`);
      return;
    }

    setVocabEntries((prev) => [
      {
        ...formData,
        word: normalizedWord,
        id: Date.now(),
      },
      ...prev,
    ]);
  }

  /*
   * -----------------------------
   * Delete
   * -----------------------------
   */

  function handleDelete(id, type) {
    if (type === "kanji") {
      setKanjiEntries((prev) =>
        prev.filter((entry) => entry.id !== id),
      );

      setKanjiFavorites((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } else {
      setVocabEntries((prev) =>
        prev.filter((entry) => entry.id !== id),
      );

      setVocabFavorites((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }

    if (editingEntry?.id === id) {
      setEditingEntry(null);
    }
  }

  /*
   * -----------------------------
   * Favorites
   * -----------------------------
   */

  function handleToggleFavorite(id, type) {
    if (type === "kanji") {
      setKanjiFavorites((prev) => {
        const next = new Set(prev);

        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }

        return next;
      });
    } else {
      setVocabFavorites((prev) => {
        const next = new Set(prev);

        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }

        return next;
      });
    }
  }

  /*
   * -----------------------------
   * Editing
   * -----------------------------
   */

  function startEditing(entry, type) {
    setActiveForm(type);
    setEditingEntry({
      ...entry,
      type,
    });
  }

  /*
   * -----------------------------
   * Tab switching
   * -----------------------------
   */

  function switchTab(tab) {
    setActiveForm(tab);
    setEditingEntry(null);
    setSearchTerm("");
    setActiveFilter("all");
  }

  const isKanjiTab = activeForm === "kanji";

  return (
    <div style={styles.page}>
      <div style={styles.glowOrb1} />
      <div style={styles.glowOrb2} />

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
        <Link to="/" style={styles.backLink}>
          ← Home
        </Link>

        <header style={styles.header}>
          <p style={styles.heroKicker}>漢字ノートと語彙</p>

          <h1 style={styles.title}>Kanji &amp; Vocab</h1>

          <p style={styles.subtitle}>
            Build your personal kanji and vocabulary notebook with meanings,
            readings, and study notes.
          </p>
        </header>

        {/* Main tabs */}
        <div style={styles.pageTabs}>
          <button
            type="button"
            style={
              isKanjiTab
                ? styles.pageTabActive
                : styles.pageTab
            }
            onClick={() => switchTab("kanji")}
          >
            Kanji
          </button>

          <button
            type="button"
            style={
              !isKanjiTab
                ? styles.pageTabActive
                : styles.pageTab
            }
            onClick={() => switchTab("vocab")}
          >
            Vocabulary
          </button>
        </div>

        {/* =====================================================
            KANJI TAB
           ===================================================== */}

        {isKanjiTab ? (
          <main style={styles.layout}>
            <aside style={styles.sidebar}>
              <KanjiForm
                key={editingEntry?.id ?? "new-kanji"}
                editingEntry={editingEntry?.type === "kanji" ? editingEntry: null}
                onCancelEdit={() => setEditingEntry(null)}
                onSubmit={handleKanjiSubmit}
                onUseAsVocabulary={handleUseAsVocabulary}
                quickAddText={quickAddText}
                onQuickAddTextChange={setQuickAddText}
                selectedQuickAddCharacters={selectedQuickAddCharacters}
                onSelectedQuickAddCharactersChange={setSelectedQuickAddCharacters}
                onAddSelectedKanji={handleAddSelectedKanji}
              />
            </aside>

            <section style={styles.content}>
              <div style={styles.searchPanel}>
                <div>
                  <p style={styles.kicker}>Collection</p>

                  <h2 style={styles.sectionTitle}>
                    {kanjiEntries.length} saved kanji
                  </h2>
                </div>

                <input
                  placeholder="Search kanji, readings, meanings…"
                  style={styles.searchInput}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div style={styles.filterBar}>
                <button
                  type="button"
                  style={
                    activeFilter === "all"
                      ? styles.filterActive
                      : styles.filter
                  }
                  onClick={() => setActiveFilter("all")}
                >
                  All ({kanjiEntries.length})
                </button>

                <button
                  type="button"
                  style={
                    activeFilter === "favorites"
                      ? styles.filterFavActive
                      : styles.filter
                  }
                  onClick={() => setActiveFilter("favorites")}
                >
                  ⭐ Favorites ({kanjiFavorites.size})
                </button>

                {["N5", "N4", "N3", "N2", "N1"].map((level) => (
                  <button
                    key={level}
                    type="button"
                    style={
                      activeFilter === level
                        ? styles.filterJlptActive
                        : styles.filter
                    }
                    onClick={() => setActiveFilter(level)}
                  >
                    {level}
                  </button>
                ))}
              </div>

              {filteredKanjiEntries.length > 0 ? (
                <div style={styles.cardGrid}>
                  {filteredKanjiEntries.map((entry) => (
                    <KanjiCard
                      key={`k-${entry.id}`}
                      entry={entry}
                      isFavorite={kanjiFavorites.has(entry.id)}
                      onDelete={(id) =>
                        handleDelete(id, "kanji")
                      }
                      onEdit={(item) =>
                        startEditing(item, "kanji")
                      }
                      onToggleFavorite={(id) =>
                        handleToggleFavorite(id, "kanji")
                      }
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  isFavorites={activeFilter === "favorites"}
                />
              )}
            </section>
          </main>
        ) : (
          /* ===================================================
             VOCABULARY TAB
             =================================================== */

          <main style={styles.layout}>
            <aside style={styles.sidebar}>
              <VocabularyForm
                key={editingEntry?.id ?? "new-vocab"}
                editingEntry={editingEntry?.type === "vocab" ? editingEntry : null}
                onCancelEdit={() => setEditingEntry(null)}
                onSubmit={handleVocabSubmit}
                prefilledWord={prefilledVocabWord}
              />
            </aside>

            <section style={styles.content}>
              <div style={styles.searchPanel}>
                <div>
                  <p style={styles.kicker}>Collection</p>

                  <h2 style={styles.sectionTitle}>
                    {vocabEntries.length} saved words
                  </h2>
                </div>

                <input
                  placeholder="Search words, readings, meanings…"
                  style={styles.searchInput}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div style={styles.filterBar}>
                <button
                  type="button"
                  style={
                    activeFilter === "all"
                      ? styles.filterActive
                      : styles.filter
                  }
                  onClick={() => setActiveFilter("all")}
                >
                  All ({vocabEntries.length})
                </button>

                <button
                  type="button"
                  style={
                    activeFilter === "favorites"
                      ? styles.filterFavActive
                      : styles.filter
                  }
                  onClick={() => setActiveFilter("favorites")}
                >
                  ⭐ Favorites ({vocabFavorites.size})
                </button>
              </div>

              {filteredVocabEntries.length > 0 ? (
                <div style={styles.cardGrid}>
                  {filteredVocabEntries.map((entry) => (
                    <VocabularyCard
                      key={`v-${entry.id}`}
                      entry={entry}
                      isFavorite={vocabFavorites.has(entry.id)}
                      onDelete={(id) =>
                        handleDelete(id, "vocab")
                      }
                      onEdit={(item) =>
                        startEditing(item, "vocab")
                      }
                      onToggleFavorite={(id) =>
                        handleToggleFavorite(id, "vocab")
                      }
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  isFavorites={activeFilter === "favorites"}
                />
              )}
            </section>
          </main>
        )}
      </div>

      <style>{`
        @keyframes orbFloat {
          0%, 100% {
            transform: translateY(0) scale(1);
          }

          50% {
            transform: translateY(-36px) scale(1.07);
          }
        }

        @keyframes kanjiDrift {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }

          50% {
            transform: translateY(-22px) rotate(4deg);
          }
        }

        @media (max-width: 800px) {
          .kanji-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

function EmptyState({ isFavorites }) {
  return (
    <div style={styles.emptyState}>
      <div style={styles.emptyIcon}>
        {isFavorites ? "⭐" : "🔍"}
      </div>

      <h2 style={styles.emptyTitle}>
        {isFavorites
          ? "No favorites yet"
          : "No entries found"}
      </h2>

      <p style={styles.emptyCopy}>
        {isFavorites
          ? "Star an entry to add it to your favorites."
          : "Try a different search, filter, or add a new entry."}
      </p>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#020617",
    backgroundImage:
      "radial-gradient(ellipse at bottom, rgba(15, 23, 42, 1) 0%, rgba(2, 6, 23, 1) 100%)",
    boxSizing: "border-box",
    color: "white",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    position: "relative",
    display: "flex",
    flexDirection: "column",
  },

  glowOrb1: {
    position: "absolute",
    top: "-5%",
    right: "-10%",
    width: "45vw",
    height: "45vw",
    background:
      "radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%)",
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
    background:
      "radial-gradient(circle, rgba(245, 158, 11, 0.12) 0%, transparent 70%)",
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
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    boxSizing: "border-box",
    padding: "16px 24px 24px",
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
    marginBottom: "12px",
    textDecoration: "none",
    fontSize: "0.95rem",
  },

  header: {
    margin: "0 auto 16px",
    maxWidth: "860px",
    textAlign: "center",
    flexShrink: 0,
  },

  title: {
    color: "white",
    fontSize: "clamp(2rem, 5vw, 4rem)",
    lineHeight: 1.05,
    margin: "0 0 6px",
    fontFamily: "inherit",
  },

  subtitle: {
    color: "#cbd5e1",
    fontSize: "clamp(0.95rem, 2.5vw, 1.1rem)",
    lineHeight: 1.6,
  },

  /*
   * Important:
   * There is deliberately NO overflow setting here.
   *
   * This means the browser's normal page scrollbar handles
   * the entire Kanji/Vocabulary page.
   */
  layout: {
    alignItems: "start",
    display: "grid",
    gap: "24px",
    gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
    minWidth: 0,
    margin: "0 auto",
    maxWidth: "1240px",
    width: "100%",
    boxSizing: "border-box",
    padding: "0 20px 20px",
  },

  sidebar: {
    minWidth: 0,
  },

  pageTabs: {
    display: "flex",
    gap: "8px",
    margin: "0 auto 16px",
    maxWidth: "1240px",
    width: "100%",
    background: "rgba(15, 23, 42, 0.78)",
    padding: "6px",
    borderRadius: "12px",
    border: "1px solid rgba(226, 232, 240, 0.16)",
    flexShrink: 0,
    boxSizing: "border-box",
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
    gridTemplateColumns:
      "repeat(auto-fill, minmax(min(100%, 280px), 1fr))",
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