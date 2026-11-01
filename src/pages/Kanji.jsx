import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import KanjiCard from "../components/KanjiCard";
import KanjiForm from "../components/KanjiForm";
import VocabularyCard from "../components/VocabularyCard";
import VocabularyForm from "../components/VocabularyForm";
import HandwritingPanel from "../components/HandwritingPanel";

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


const sakuraPetals = [
  { left: "8%", delay: "0s", duration: "18s", size: "12px" },
  { left: "22%", delay: "-7s", duration: "22s", size: "9px" },
  { left: "43%", delay: "-12s", duration: "20s", size: "14px" },
  { left: "64%", delay: "-4s", duration: "24s", size: "10px" },
  { left: "82%", delay: "-15s", duration: "19s", size: "13px" },
  { left: "94%", delay: "-9s", duration: "23s", size: "8px" },
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
  const [prefilledKanjiChar, setPrefilledKanjiChar] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [isHandwritingOpen, setIsHandwritingOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  const ITEMS_PER_PAGE = 48;

  // Close drawer or handwriting pad on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        setIsEditorOpen(false);
        setEditingEntry(null);
        setPrefilledKanjiChar("");
        setIsHandwritingOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const [kanjiFavorites, setKanjiFavorites] = useState(() =>
    loadKanjiFavorites(),
  );

  const [vocabFavorites, setVocabFavorites] = useState(() =>
    loadVocabularyFavorites(),
  );

  const [activeFilter, setActiveFilter] = useState("all");

  function handleSearchChange(value) {
    setCurrentPage(1);
    setSearchTerm(value);
  }

  function handleFilterChange(filter) {
    setCurrentPage(1);
    setActiveFilter(filter);
  }

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

  const totalPages = Math.ceil(
    filteredKanjiEntries.length / ITEMS_PER_PAGE
  );

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  const paginatedKanjiEntries = filteredKanjiEntries.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

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
    setIsEditorOpen(true);
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
      setIsEditorOpen(false);
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

    setSearchTerm("");
    setActiveFilter("all");
    setCurrentPage(1);
    setIsEditorOpen(false);
    setPrefilledKanjiChar("");
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

    setSearchTerm("");
    setActiveFilter("all");
    setCurrentPage(1);
    setIsEditorOpen(false);

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
      setIsEditorOpen(false);
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

    setSearchTerm("");
    setActiveFilter("all");
    setCurrentPage(1);
    setIsEditorOpen(false);
    setPrefilledVocabWord("");
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
    setIsEditorOpen(true);
  }

  function handleHandwritingSearch(char) {
    setSearchTerm(char);
    setCurrentPage(1);
  }

  function handleHandwritingAddKanji(char) {
    setActiveForm("kanji");
    setPrefilledKanjiChar(char);
    setQuickAddText(char);
    setSelectedQuickAddCharacters(new Set([char]));
    setEditingEntry(null);
    setIsEditorOpen(true);
  }

  function handleHandwritingAddVocab(char) {
    setActiveForm("vocab");
    setPrefilledVocabWord(char);
    setEditingEntry(null);
    setIsEditorOpen(true);
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

      {sakuraPetals.map((petal, i) => (
        <span
          key={`petal-${i}`}
          aria-hidden="true"
          style={{
            ...styles.sakuraPetal,
            left: petal.left,
            width: petal.size,
            height: `calc(${petal.size} * 0.65)`,
            animationDelay: petal.delay,
            animationDuration: petal.duration,
          }}
        />
      ))}

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
        {/* Top Navigation Row */}
        <div style={styles.topNavRow}>
          <Link to="/" style={styles.backHomeBtn}>
            ← Return to Home
          </Link>
          <div style={styles.headerStatsPill}>
            {kanjiEntries.length} Kanji · {vocabEntries.length} Words · {kanjiFavorites.size + vocabFavorites.size} Favorites
          </div>
        </div>

        {/* Header */}
        <header style={styles.header}>
          <p style={styles.heroKicker}>漢字ノートと語彙</p>
          <h1 style={styles.title}>Kanji &amp; Vocabulary Hub</h1>
          <p style={styles.subtitle}>
            Manage your personal kanji and vocabulary collection with dictionary definitions, stroke orders, and handwriting search.
          </p>
        </header>

        {/* Studio Drawer (Slide-Over for Adding & Editing) */}
        {isEditorOpen && (
          <div
            style={styles.drawerBackdrop}
            onClick={() => {
              setIsEditorOpen(false);
              setEditingEntry(null);
              setPrefilledKanjiChar("");
            }}
          >
            <div
              style={styles.drawer}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={styles.drawerHeader}>
                <div>
                  <span style={styles.drawerKicker}>
                    {isKanjiTab ? "漢字スタジオ" : "語彙スタジオ"}
                  </span>
                  <h2 style={styles.drawerTitle}>
                    {editingEntry
                      ? `Edit ${editingEntry.type === "kanji" ? "Kanji" : "Vocabulary"}`
                      : `Add to ${isKanjiTab ? "Kanji" : "Vocabulary"}`}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditorOpen(false);
                    setEditingEntry(null);
                    setPrefilledKanjiChar("");
                  }}
                  style={styles.drawerCloseBtn}
                  aria-label="Close drawer"
                >
                  ✕
                </button>
              </div>

              <div style={styles.drawerBody}>
                {isKanjiTab ? (
                  <KanjiForm
                    key={editingEntry?.id ?? "new-kanji"}
                    editingEntry={
                      editingEntry?.type === "kanji" ? editingEntry : null
                    }
                    onCancelEdit={() => {
                      setEditingEntry(null);
                      setIsEditorOpen(false);
                      setPrefilledKanjiChar("");
                    }}
                    onSubmit={handleKanjiSubmit}
                    onUseAsVocabulary={handleUseAsVocabulary}
                    quickAddText={quickAddText}
                    onQuickAddTextChange={setQuickAddText}
                    selectedQuickAddCharacters={selectedQuickAddCharacters}
                    onSelectedQuickAddCharactersChange={
                      setSelectedQuickAddCharacters
                    }
                    onAddSelectedKanji={handleAddSelectedKanji}
                    prefilledKanji={prefilledKanjiChar}
                  />
                ) : (
                  <VocabularyForm
                    key={editingEntry?.id ?? "new-vocab"}
                    editingEntry={
                      editingEntry?.type === "vocab" ? editingEntry : null
                    }
                    onCancelEdit={() => {
                      setEditingEntry(null);
                      setIsEditorOpen(false);
                      setPrefilledVocabWord("");
                    }}
                    onSubmit={handleVocabSubmit}
                    prefilledWord={prefilledVocabWord}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Toolbar */}
        <div style={styles.toolbar}>
          {/* Tabs */}
          <div style={styles.pageTabs}>
            <button
              type="button"
              style={isKanjiTab ? styles.pageTabActive : styles.pageTab}
              onClick={() => switchTab("kanji")}
            >
              Kanji ({kanjiEntries.length})
            </button>

            <button
              type="button"
              style={!isKanjiTab ? styles.pageTabActive : styles.pageTab}
              onClick={() => switchTab("vocab")}
            >
              Vocabulary ({vocabEntries.length})
            </button>
          </div>

          {/* Quick Actions */}
          <div style={styles.toolbarActions}>
            <button
              type="button"
              onClick={() => {
                setEditingEntry(null);
                setPrefilledKanjiChar("");
                setIsEditorOpen(true);
              }}
              style={styles.primaryAddBtn}
            >
              {isKanjiTab ? "+ Add Kanji" : "+ Add Word"}
            </button>

            <button
              type="button"
              onClick={() => setIsHandwritingOpen((open) => !open)}
              style={isHandwritingOpen ? styles.toolBtnActive : styles.toolBtn}
            >
              {isHandwritingOpen ? "Close Handwriting" : "Handwriting Pad"}
            </button>

            <Link to="/flashcards" style={styles.flashcardsLink}>
              Flashcards →
            </Link>
          </div>
        </div>

        {/* Handwriting Panel if open */}
        {isHandwritingOpen && (
          <HandwritingPanel
            onSearch={handleHandwritingSearch}
            onAddKanji={handleHandwritingAddKanji}
            onAddVocab={handleHandwritingAddVocab}
            onClose={() => setIsHandwritingOpen(false)}
          />
        )}

        {/* Main Collection Area */}
        <main style={styles.layout}>
          {/* Search Panel */}
          <div style={styles.searchPanel}>
            <div style={styles.searchBarLeft}>
              <p style={styles.kicker}>
                {isKanjiTab ? "Kanji Collection" : "Vocabulary Collection"}
              </p>
              <h2 style={styles.sectionTitle}>
                {isKanjiTab
                  ? `${filteredKanjiEntries.length} kanji found`
                  : `${filteredVocabEntries.length} words found`}
              </h2>
            </div>

            <div style={styles.searchBarRight}>
              <input
                placeholder={
                  isKanjiTab
                    ? "Search kanji, readings, meanings, JLPT…"
                    : "Search vocabulary, readings, meanings…"
                }
                style={styles.searchInput}
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => handleSearchChange("")}
                  style={styles.clearSearchBtn}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills */}
          <div style={styles.filterBar}>
            <button
              type="button"
              style={activeFilter === "all" ? styles.filterActive : styles.filter}
              onClick={() => handleFilterChange("all")}
            >
              All ({isKanjiTab ? kanjiEntries.length : vocabEntries.length})
            </button>

            <button
              type="button"
              style={
                activeFilter === "favorites"
                  ? styles.filterFavActive
                  : styles.filter
              }
              onClick={() => handleFilterChange("favorites")}
            >
              Favorites ({isKanjiTab ? kanjiFavorites.size : vocabFavorites.size})
            </button>

            {isKanjiTab &&
              ["N5", "N4", "N3", "N2", "N1"].map((level) => (
                <button
                  key={level}
                  type="button"
                  style={
                    activeFilter === level
                      ? styles.filterJlptActive
                      : styles.filter
                  }
                  onClick={() => handleFilterChange(level)}
                >
                  {level}
                </button>
              ))}
          </div>

          {/* Cards Grid & Pagination */}
          {isKanjiTab ? (
            filteredKanjiEntries.length > 0 ? (
              <>
                <div style={styles.cardGrid}>
                  {paginatedKanjiEntries.map((entry) => (
                    <KanjiCard
                      key={`k-${entry.id}`}
                      entry={entry}
                      isFavorite={kanjiFavorites.has(entry.id)}
                      onDelete={(id) => handleDelete(id, "kanji")}
                      onEdit={(item) => startEditing(item, "kanji")}
                      onToggleFavorite={(id) =>
                        handleToggleFavorite(id, "kanji")
                      }
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div style={styles.pagination}>
                    <button
                      type="button"
                      style={styles.paginationButton}
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((page) => page - 1)}
                    >
                      ← Previous
                    </button>

                    <div style={styles.pageNumbers}>
                      {Array.from({ length: totalPages }, (_, index) => {
                        const page = index + 1;
                        return (
                          <button
                            key={page}
                            type="button"
                            style={
                              currentPage === page
                                ? styles.paginationActive
                                : styles.paginationButton
                            }
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      style={styles.paginationButton}
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((page) => page + 1)}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            ) : (
              <EmptyState isFavorites={activeFilter === "favorites"} />
            )
          ) : filteredVocabEntries.length > 0 ? (
            <div style={styles.cardGrid}>
              {filteredVocabEntries.map((entry) => (
                <VocabularyCard
                  key={`v-${entry.id}`}
                  entry={entry}
                  isFavorite={vocabFavorites.has(entry.id)}
                  onDelete={(id) => handleDelete(id, "vocab")}
                  onEdit={(item) => startEditing(item, "vocab")}
                  onToggleFavorite={(id) =>
                    handleToggleFavorite(id, "vocab")
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyState isFavorites={activeFilter === "favorites"} />
          )}
        </main>
      </div>

      <style>{`
        @keyframes sakuraFall {
          0% {
            transform: translate3d(0, -20px, 0) rotate(0deg);
            opacity: 0;
          }

          10% {
            opacity: 0.65;
          }

          50% {
            transform: translate3d(35px, 50vh, 0) rotate(180deg);
            opacity: 0.45;
          }

          90% {
            opacity: 0.35;
          }

          100% {
            transform: translate3d(-20px, 105vh, 0) rotate(360deg);
            opacity: 0;
          }
        }

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
        {isFavorites ? "★" : "—"}
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
    backgroundImage: `
      radial-gradient(
        ellipse at 50% 0%,
        rgba(88, 28, 70, 0.30) 0%,
        transparent 48%
      ),
      radial-gradient(
        ellipse at 100% 45%,
        rgba(30, 41, 85, 0.22) 0%,
        transparent 50%
      ),
      linear-gradient(
        180deg,
        #090817 0%,
        #070b1a 48%,
        #020617 100%
      )
    `,
    boxSizing: "border-box",
    color: "white",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    position: "relative",
    display: "flex",
    flexDirection: "column",
  },

  glowOrb1: {
    position: "absolute",
    top: "-8%",
    right: "-10%",
    width: "48vw",
    height: "48vw",
    background:
      "radial-gradient(circle, rgba(236, 72, 153, 0.16) 0%, rgba(190, 24, 93, 0.05) 38%, transparent 70%)",
    borderRadius: "50%",
    zIndex: 0,
    pointerEvents: "none",
  },

  glowOrb2: {
    position: "absolute",
    bottom: "0",
    left: "-12%",
    width: "55vw",
    height: "55vw",
    background:
      "radial-gradient(circle, rgba(147, 51, 234, 0.10) 0%, rgba(236, 72, 153, 0.05) 42%, transparent 70%)",
    borderRadius: "50%",
    zIndex: 0,
    pointerEvents: "none",
  },
  sakuraPetal: {
    position: "absolute",
    top: "-20px",
    background:
      "linear-gradient(135deg, rgba(255, 183, 213, 0.8), rgba(236, 72, 153, 0.35))",
    borderRadius: "100% 0 100% 0",
    boxShadow: "0 0 8px rgba(236, 72, 153, 0.12)",
    pointerEvents: "none",
    zIndex: 0,
    animationName: "sakuraFall",
    animationTimingFunction: "linear",
    animationIterationCount: "infinite",
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

  topNavRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    maxWidth: "1280px",
    width: "100%",
    margin: "0 auto 20px",
    flexWrap: "wrap",
    gap: "12px",
  },

  backHomeBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    color: "#f472b6",
    textDecoration: "none",
    fontWeight: "700",
    fontSize: "0.95rem",
    background: "rgba(244, 114, 182, 0.12)",
    border: "1px solid rgba(244, 114, 182, 0.3)",
    padding: "8px 16px",
    borderRadius: "8px",
    transition: "all 0.15s ease",
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
    margin: "0 auto 20px",
    maxWidth: "960px",
    textAlign: "center",
    flexShrink: 0,
  },

  headerBadges: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "8px",
  },

  headerStatsPill: {
    background: "rgba(244, 114, 182, 0.12)",
    border: "1px solid rgba(244, 114, 182, 0.3)",
    borderRadius: "999px",
    padding: "4px 14px",
    color: "#fbcfe8",
    fontSize: "0.82rem",
    fontWeight: "700",
    letterSpacing: "0.02em",
  },

  title: {
    color: "white",
    fontSize: "clamp(2rem, 5vw, 3.5rem)",
    lineHeight: 1.1,
    margin: "0 0 8px",
    fontFamily: "inherit",
    fontWeight: "900",
    background: "linear-gradient(135deg, #ffffff 40%, #f472b6 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },

  subtitle: {
    color: "#cbd5e1",
    fontSize: "clamp(0.95rem, 2.5vw, 1.05rem)",
    lineHeight: 1.6,
    maxWidth: "680px",
    margin: "0 auto",
  },

  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "14px",
    marginBottom: "18px",
    background: "rgba(15, 23, 42, 0.6)",
    padding: "10px 14px",
    borderRadius: "14px",
    border: "1px solid rgba(226, 232, 240, 0.12)",
  },

  toolbarActions: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },

  primaryAddBtn: {
    background: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
    color: "#ffffff",
    border: "none",
    borderRadius: "10px",
    padding: "10px 18px",
    fontWeight: "700",
    fontSize: "0.92rem",
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(236, 72, 153, 0.35)",
    transition: "transform 0.15s ease",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontFamily: "inherit",
  },

  toolBtn: {
    background: "rgba(30, 41, 59, 0.8)",
    border: "1px solid rgba(244, 114, 182, 0.3)",
    color: "#f1f5f9",
    borderRadius: "10px",
    padding: "10px 16px",
    fontWeight: "600",
    fontSize: "0.92rem",
    cursor: "pointer",
    transition: "all 0.2s ease",
    fontFamily: "inherit",
  },

  toolBtnActive: {
    background: "rgba(244, 114, 182, 0.2)",
    border: "1px solid rgba(244, 114, 182, 0.5)",
    color: "#fdf2f8",
    borderRadius: "10px",
    padding: "10px 16px",
    fontWeight: "600",
    fontSize: "0.92rem",
    cursor: "pointer",
    boxShadow: "0 0 12px rgba(244, 114, 182, 0.25)",
    fontFamily: "inherit",
  },

  flashcardsLink: {
    display: "inline-flex",
    alignItems: "center",
    padding: "10px 16px",
    borderRadius: "10px",
    background: "rgba(236, 72, 153, 0.15)",
    border: "1px solid rgba(236, 72, 153, 0.35)",
    color: "#f9a8d4",
    fontWeight: "700",
    fontSize: "0.92rem",
    textDecoration: "none",
    transition: "background 0.2s ease",
  },

  layout: {
    margin: "0 auto",
    maxWidth: "1280px",
    width: "100%",
    boxSizing: "border-box",
  },

  pageTabs: {
    display: "flex",
    gap: "6px",
    background: "rgba(10, 15, 30, 0.8)",
    padding: "4px",
    borderRadius: "10px",
    border: "1px solid rgba(226, 232, 240, 0.12)",
  },

  pageTab: {
    background: "transparent",
    border: "none",
    color: "#94a3b8",
    padding: "8px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "0.92rem",
    fontFamily: "inherit",
    transition: "color 0.2s ease",
  },

  pageTabActive: {
    background: "rgba(244, 114, 182, 0.2)",
    border: "none",
    color: "#fdf2f8",
    padding: "8px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 800,
    fontSize: "0.92rem",
    fontFamily: "inherit",
    boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
  },

  searchPanel: {
    alignItems: "center",
    background: "rgba(15, 23, 42, 0.7)",
    border: "1px solid rgba(226, 232, 240, 0.14)",
    borderRadius: "12px",
    display: "flex",
    flexWrap: "wrap",
    gap: "16px",
    justifyContent: "space-between",
    marginBottom: "14px",
    padding: "16px 20px",
  },

  searchBarLeft: {
    display: "flex",
    flexDirection: "column",
  },

  searchBarRight: {
    position: "relative",
    flex: "1 1 300px",
    maxWidth: "460px",
  },

  clearSearchBtn: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "transparent",
    border: "none",
    color: "#94a3b8",
    fontSize: "1rem",
    cursor: "pointer",
    padding: "4px",
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
    fontSize: "1.3rem",
    fontWeight: 800,
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
    outline: "none",
    padding: "12px 36px 12px 14px",
    width: "100%",
  },

  filterBar: {
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
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
    transition: "all 0.15s ease",
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

  drawerBackdrop: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.72)",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    zIndex: 1000,
    display: "flex",
    justifyContent: "flex-end",
  },

  drawer: {
    background: "rgba(15, 23, 42, 0.98)",
    borderLeft: "1px solid rgba(244, 114, 182, 0.25)",
    width: "min(640px, 100vw)",
    height: "100%",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    boxShadow: "-10px 0 35px rgba(0, 0, 0, 0.6)",
    overflowY: "auto",
  },

  drawerHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 24px",
    borderBottom: "1px solid rgba(244, 114, 182, 0.15)",
    position: "sticky",
    top: 0,
    background: "rgba(15, 23, 42, 0.96)",
    backdropFilter: "blur(8px)",
    zIndex: 10,
  },

  drawerKicker: {
    fontSize: "0.75rem",
    fontWeight: "800",
    letterSpacing: "0.08em",
    color: "#f472b6",
    textTransform: "uppercase",
  },

  drawerTitle: {
    margin: "4px 0 0 0",
    fontSize: "1.25rem",
    fontWeight: "800",
    color: "#fdf2f8",
  },

  drawerCloseBtn: {
    background: "rgba(255, 255, 255, 0.08)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    color: "#e2e8f0",
    fontSize: "1.1rem",
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.2s ease",
  },

  drawerBody: {
    padding: "20px 24px 40px",
  },

  cardGrid: {
    display: "grid",
    alignItems: "start",
    gap: "18px",
    gridTemplateColumns:
      "repeat(auto-fill, minmax(min(100%, 300px), 1fr))",
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

  pagination: {
    alignItems: "center",
    display: "flex",
    gap: "10px",
    justifyContent: "center",
    marginTop: "24px",
    marginBottom: "8px",
    flexWrap: "wrap",
  },

  pageNumbers: {
    display: "flex",
    gap: "6px",
  },

  paginationButton: {
    background: "rgba(30, 41, 59, 0.7)",
    border: "1px solid rgba(148, 163, 184, 0.2)",
    borderRadius: "8px",
    color: "#cbd5e1",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "0.85rem",
    fontWeight: 700,
    padding: "8px 12px",
  },

  paginationActive: {
    background: "rgba(236, 72, 153, 0.18)",
    border: "1px solid rgba(236, 72, 153, 0.4)",
    borderRadius: "8px",
    color: "#f9a8d4",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "0.85rem",
    fontWeight: 800,
    padding: "8px 12px",
  },
};

export default Kanji;