
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import {
  loadKanji,
  loadVocabulary,
} from "../utils/localStorage";

function Flashcards() {
  const [studyType, setStudyType] = useState("kanji");
  const [reviewMode, setReviewMode] = useState("all");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnswerVisible, setIsAnswerVisible] = useState(false);
  
  const kanjiEntries = loadKanji() ?? [];
  const vocabularyEntries = loadVocabulary() ?? [];
  
  const [ratedCards, setRatedCards] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("japanese-flashcard-ratings") || "{}"
      );
    } catch {
      return {};
    }
  });

  const deckPrefix = `${studyType}-`;

  const deckRatings = Object.entries(ratedCards).filter(
    ([cardId]) => cardId.startsWith(deckPrefix)
  );

  const reviewedCount = deckRatings.length;

  const gotItCount = deckRatings.filter(
    ([, rating]) => rating === "got-it"
  ).length;

  const reviewAgainCount = deckRatings.filter(
    ([, rating]) => rating === "review-again"
  ).length;

  const deckSize = studyType === "kanji"
    ? kanjiEntries.length
    : vocabularyEntries.length;

  const reviewPercentage = deckSize === 0
    ? 0
    : Math.round((reviewedCount / deckSize) * 100);

  const deckCards =
    studyType === "kanji"
      ? kanjiEntries
      : vocabularyEntries;

  const availableCards = deckCards.filter((card) => {
    const rating = ratedCards[`${studyType}-${card.id}`];

    if (reviewMode === "review-again") {
      return rating === "review-again";
    }

    if (reviewMode === "got-it") {
      return rating === "got-it";
    }

    return true;
  });

  const [isMobile, setIsMobile] = useState(
    window.innerWidth < 600
  );

  const currentCard = availableCards[currentIndex];
  const hasCards = availableCards.length > 0;

  function changeDeck(type) {
    setStudyType(type);
    setCurrentIndex(0);
    setIsAnswerVisible(false);
  }

  function changeReviewMode(mode) {
    setReviewMode(mode);
    setCurrentIndex(0);
    setIsAnswerVisible(false);
  }

  function showNextCard() {
    setCurrentIndex((index) => (index + 1) % availableCards.length);
    setIsAnswerVisible(false);
  }

  function showPreviousCard() {
    setCurrentIndex(
      (index) =>
        (index - 1 + availableCards.length) % availableCards.length,
    );
    setIsAnswerVisible(false);
  }

  function rateCard(rating) {
    const cardId = `${studyType}-${currentCard.id}`;

    setRatedCards((cards) => ({
      ...cards,
      [cardId]: rating,
    }));

    setIsAnswerVisible(false);

    // If we're reviewing a filtered list, the card may disappear
    // after its rating changes. Stay at the current index so the
    // next available card takes its place.
    if (reviewMode !== "all") {
      return;
    }

    // In All cards mode, keep the existing circular navigation.
    setCurrentIndex((index) =>
      availableCards.length > 0
        ? (index + 1) % availableCards.length
        : 0
    );
  }

  function resetProgress() {
    const confirmed = window.confirm(
      "Are you sure you want to reset all flashcard ratings? This cannot be undone."
    );

    if (!confirmed) return;

    setRatedCards({});
  }

  useEffect(() => {
    localStorage.setItem(
      "japanese-flashcard-ratings",
      JSON.stringify(ratedCards)
    );
  }, [ratedCards]);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 600);
    }

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const reviewButtonStyle = (isActive) => ({
    ...(isActive ? styles.deckButtonActive : styles.deckButton),
    ...(isMobile
      ? {
          padding: "10px 4px",
          fontSize: "0.78rem",
          gap: "4px",
        }
      : {}),
  });

  return (
    <main style={styles.page}>
      <Link to="/kanji" style={styles.backLink}>
        ← Back to Kanji & Vocabulary
      </Link>

      <header style={styles.header}>
        <p style={styles.kicker}>復習しましょう</p>
        <h1 style={styles.title}>Flashcard Review</h1>
        <p style={styles.subtitle}>
          Practice your saved Japanese Kanji and vocabulary.
        </p>
      </header>

      <section style={styles.panel}>
        <h2 style={styles.panelTitle}>Choose your study deck</h2>

        {/* Review mode selector */}
        <div style={styles.reviewOptions}>
          <button
            type="button"
            style={reviewButtonStyle(reviewMode === "all")}
            onClick={() => changeReviewMode("all")}
          >
            All cards
          </button>

          <button
            type="button"
            style={reviewButtonStyle(reviewMode === "review-again")}
            onClick={() => changeReviewMode("review-again")}
          >
            ↻ Review again
          </button>

          <button
            type="button"
            style={reviewButtonStyle(reviewMode === "got-it")}
            onClick={() => changeReviewMode("got-it")}
          >
            ✓ Got it
          </button>
        </div>

        <div style={styles.deckOptions}>
          <button
            type="button"
            onClick={() => changeDeck("kanji")}
            style={
              studyType === "kanji"
                ? styles.deckButtonActive
                : styles.deckButton
            }
          >
            <span style={styles.deckIcon}>漢</span>
            <span>Kanji</span>
            <span style={styles.deckCount}>
              {kanjiEntries.length} cards
            </span>
          </button>

          <button
            type="button"
            onClick={() => changeDeck("vocabulary")}
            style={
              studyType === "vocabulary"
                ? styles.deckButtonActive
                : styles.deckButton
            }
          >
            <span style={styles.deckIcon}>語</span>
            <span>Vocabulary</span>
            <span style={styles.deckCount}>
              {vocabularyEntries.length} cards
            </span>
          </button>
        </div>

        <p style={styles.description}>
          {availableCards.length > 0
            ? `${availableCards.length} cards available in your ${
                studyType === "kanji" ? "Kanji" : "Vocabulary"
              } deck.`
            : `No saved ${
                studyType === "kanji" ? "Kanji" : "vocabulary"
              } entries found yet.`}
        </p>

        {hasCards ? (
          <div style={styles.flashcardArea}>
            <p style={styles.cardCounter}>
              Card {currentIndex + 1} of {availableCards.length}
            </p>

            <div style={styles.flashcard}>
              {/* Review status indicator */}
              <div
                style={{
                  position: "absolute",
                  top: "14px",
                  right: "14px",
                  fontSize: "1.2rem",
                }}
                title={
                  ratedCards[`${studyType}-${currentCard.id}`] === "got-it"
                    ? "Got it"
                    : ratedCards[`${studyType}-${currentCard.id}`] === "review-again"
                      ? "Review again"
                      : "Not reviewed"
                }
              >
                {ratedCards[`${studyType}-${currentCard.id}`] === "got-it"
                  ? "✓"
                  : ratedCards[`${studyType}-${currentCard.id}`] === "review-again"
                    ? "↻"
                    : "○"}
              </div>
              <p style={styles.cardLabel}>
                {studyType === "kanji" ? "KANJI" : "VOCABULARY"}
              </p>

              <div style={styles.cardFront}>
                {studyType === "kanji"
                  ? currentCard.kanji
                  : currentCard.word}
              </div>

              {isAnswerVisible && (
                <div style={styles.answerArea}>
                  <div style={styles.answerMeaning}>
                    {currentCard.meaning || "No meaning saved yet."}
                  </div>

                  {studyType === "kanji" ? (
                    <>
                      <p style={styles.answerDetail}>
                        Onyomi: {currentCard.onyomi || "—"}
                      </p>
                      <p style={styles.answerDetail}>
                        Kunyomi: {currentCard.kunyomi || "—"}
                      </p>
                      {currentCard.jlpt && (
                        <p style={styles.answerDetail}>
                          JLPT: {currentCard.jlpt}
                        </p>
                      )}
                      {currentCard.notes && (
                        <p style={styles.answerDetail}>
                          {currentCard.notes}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p style={styles.answerDetail}>
                        Reading: {currentCard.reading || "—"}
                      </p>
                      {currentCard.partOfSpeech && (
                        <p style={styles.answerDetail}>
                          Part of speech: {currentCard.partOfSpeech}
                        </p>
                      )}
                      {currentCard.exampleSentence && (
                        <p style={styles.answerDetail}>
                          Example: {currentCard.exampleSentence}
                        </p>
                      )}
                      {currentCard.notes && (
                        <p style={styles.answerDetail}>
                          {currentCard.notes}
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}

              {isAnswerVisible && (
                <div style={styles.ratingButtons}>
                  <button
                    type="button"
                    style={styles.reviewAgainButton}
                    onClick={() => rateCard("review-again")}
                  >
                    ↻ Review again
                  </button>

                  <button
                    type="button"
                    style={styles.gotItButton}
                    onClick={() => rateCard("got-it")}
                  >
                    ✓ Got it
                  </button>
                </div>
              )}

              <button
                type="button"
                style={styles.revealButton}
                onClick={() => setIsAnswerVisible((visible) => !visible)}
              >
                {isAnswerVisible ? "Hide Answer" : "Reveal Answer"}
              </button>
            </div>

            <div style={styles.navigation}>
              <button
                type="button"
                style={styles.navigationButton}
                onClick={showPreviousCard}
                disabled={availableCards.length < 2}
              >
                ← Previous
              </button>

              <button
                type="button"
                style={styles.navigationButton}
                onClick={showNextCard}
                disabled={availableCards.length < 2}
              >
                Next →
              </button>
            </div>
            <div style={styles.statsPanel}>
              <h3 style={styles.statsTitle}>Session Progress</h3>

              <button
                type="button"
                onClick={resetProgress}
                style={styles.resetButton}
              >
                Reset Progress
              </button>

              <div
                style={{
                  ...styles.statsGrid,
                  gridTemplateColumns: isMobile
                    ? "repeat(2, minmax(0, 1fr))"
                    : "repeat(4, minmax(0, 1fr))",
                }}
              >
                <div>
                  <div style={styles.statsNumber}>{reviewedCount}</div>
                  <div style={styles.statsLabel}>Reviewed</div>
                </div>

                <div>
                  <div style={styles.statsNumber}>{reviewPercentage}%</div>
                  <div style={styles.statsLabel}>Deck reviewed</div>
                </div>

                <div>
                  <div style={styles.statsNumber}>{gotItCount}</div>
                  <div style={styles.statsLabel}>Got it</div>
                </div>

                <div>
                  <div style={styles.statsNumber}>{reviewAgainCount}</div>
                  <div style={styles.statsLabel}>Review again</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={styles.emptyState}>
            <h3 style={styles.emptyStateTitle}>
              {reviewMode === "all"
                ? "No cards available yet"
                : reviewMode === "review-again"
                  ? "No cards to review again"
                  : "No cards marked as Got it yet"}
            </h3>

            <p style={styles.emptyStateText}>
              {reviewMode === "all"
                ? `Add some ${
                    studyType === "kanji" ? "Kanji" : "vocabulary"
                  } entries to begin reviewing.`
                : reviewMode === "review-again"
                  ? "Rate some cards as Review again, and they will appear here."
                  : "Rate some cards as Got it, and they will appear here."}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    boxSizing: "border-box",
    padding: "36px 24px",
    background: "linear-gradient(135deg, #0b1120, #030712)",
    color: "#f8fafc",
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  backLink: {
    color: "#c4b5fd",
    textDecoration: "none",
    fontSize: "0.9rem",
    fontWeight: 700,
  },
  header: {
    maxWidth: "800px",
    margin: "48px auto 32px",
    textAlign: "center",
  },
  kicker: {
    color: "#f9a8d4",
    fontWeight: 800,
    letterSpacing: "0.12em",
  },
  title: {
    fontSize: "clamp(2rem, 5vw, 3rem)",
    margin: "12px 0",
  },
  subtitle: {
    color: "#94a3b8",
    lineHeight: 1.6,
  },
  panel: {
    maxWidth: "620px",
    margin: "0 auto",
    padding: "32px 24px",
    textAlign: "center",
    background: "rgba(15, 23, 42, 0.82)",
    border: "1px solid rgba(196, 181, 253, 0.2)",
    borderRadius: "18px",
  },
  panelTitle: {
    fontSize: "1.25rem",
    marginTop: 0,
    marginBottom: "24px",
  },
  deckOptions: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "18px",
  },
  reviewOptions: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "14px",
    marginBottom: "24px",
  },
  deckButton: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
    padding: "14px 12px",
    background: "rgba(30, 41, 59, 0.65)",
    border: "1px solid rgba(148, 163, 184, 0.22)",
    borderRadius: "12px",
    color: "#e2e8f0",
    fontFamily: "inherit",
    fontSize: "1rem",
    fontWeight: 800,
    cursor: "pointer",
  },
  deckButtonActive: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
    padding: "14px 12px",
    background: "rgba(236, 72, 153, 0.12)",
    border: "1px solid rgba(236, 72, 153, 0.55)",
    borderRadius: "12px",
    color: "#f9a8d4",
    fontFamily: "inherit",
    fontSize: "1rem",
    fontWeight: 800,
    cursor: "pointer",
  },
  deckIcon: {
    fontSize: "2.5rem",
  },
  deckCount: {
    color: "#94a3b8",
    fontSize: "0.82rem",
    fontWeight: 600,
  },
  description: {
    color: "#94a3b8",
    lineHeight: 1.7,
    marginTop: "24px",
    marginBottom: 0,
  },
  emptyState: {
    marginTop: "30px",
    padding: "28px 20px",
    background: "rgba(30, 41, 59, 0.45)",
    border: "1px dashed rgba(148, 163, 184, 0.3)",
    borderRadius: "14px",
  },
  emptyStateTitle: {
    margin: "0 0 10px",
    color: "#f9a8d4",
    fontSize: "1.1rem",
  },
  emptyStateText: {
    margin: 0,
    color: "#94a3b8",
    lineHeight: 1.7,
  },
  flashcardArea: {
    marginTop: "30px",
  },
  cardCounter: {
    color: "#94a3b8",
    fontSize: "0.85rem",
    fontWeight: 700,
    marginBottom: "12px",
  },
  flashcard: {
    padding: "32px 24px",
    position: "relative",
    background: "linear-gradient(145deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))",
    border: "1px solid rgba(196, 181, 253, 0.3)",
    borderRadius: "16px",
  },
  cardLabel: {
    color: "#f9a8d4",
    fontSize: "0.72rem",
    fontWeight: 900,
    letterSpacing: "0.14em",
  },
  cardFront: {
    fontSize: "clamp(3rem, 10vw, 5rem)",
    fontWeight: 800,
    margin: "28px 0",
    overflowWrap: "anywhere",
  },
  answerArea: {
    borderTop: "1px solid rgba(148, 163, 184, 0.2)",
    paddingTop: "20px",
    marginTop: "12px",
  },
  answerMeaning: {
    color: "#f9a8d4",
    fontSize: "1.25rem",
    fontWeight: 800,
    lineHeight: 1.5,
  },
  answerDetail: {
    color: "#cbd5e1",
    fontSize: "0.92rem",
    lineHeight: 1.7,
    overflowWrap: "anywhere",
  },
  revealButton: {
    marginTop: "20px",
    padding: "11px 20px",
    background: "linear-gradient(135deg, #7c3aed, #db2777)",
    border: "none",
    borderRadius: "9px",
    color: "#ffffff",
    fontFamily: "inherit",
    fontSize: "0.92rem",
    fontWeight: 800,
    cursor: "pointer",
  },
  navigation: {
    display: "flex",
    justifyContent: "center",
    gap: "12px",
    marginTop: "18px",
  },
  navigationButton: {
    padding: "10px 16px",
    background: "rgba(30, 41, 59, 0.8)",
    border: "1px solid rgba(148, 163, 184, 0.25)",
    borderRadius: "9px",
    color: "#e2e8f0",
    fontFamily: "inherit",
    fontWeight: 700,
    cursor: "pointer",
  },
  ratingButtons: {
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: "12px",
    marginTop: "20px",
  },
  reviewAgainButton: {
    padding: "11px 16px",
    background: "rgba(245, 158, 11, 0.12)",
    border: "1px solid rgba(245, 158, 11, 0.4)",
    borderRadius: "9px",
    color: "#fcd34d",
    fontFamily: "inherit",
    fontWeight: 800,
    cursor: "pointer",
  },
  gotItButton: {
    padding: "11px 16px",
    background: "rgba(16, 185, 129, 0.12)",
    border: "1px solid rgba(16, 185, 129, 0.4)",
    borderRadius: "9px",
    color: "#6ee7b7",
    fontFamily: "inherit",
    fontWeight: 800,
    cursor: "pointer",
  },
  statsPanel: {
    marginTop: "24px",
    padding: "20px",
    background: "rgba(15, 23, 42, 0.7)",
    border: "1px solid rgba(148, 163, 184, 0.18)",
    borderRadius: "14px",
  },
  statsTitle: {
    margin: "0 0 18px",
    fontSize: "1rem",
    color: "#e2e8f0",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "12px",
    textAlign: "center",
  },
  statsNumber: {
    color: "#f9a8d4",
    fontSize: "1.6rem",
    fontWeight: 900,
  },
  statsLabel: {
    color: "#94a3b8",
    fontSize: "0.78rem",
    marginTop: "5px",
  },
  resetButton: {
    marginBottom: "18px",
    padding: "9px 14px",
    background: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.4)",
    borderRadius: "8px",
    color: "#fca5a5",
    fontFamily: "inherit",
    fontWeight: 700,
    cursor: "pointer",
  },
};

export default Flashcards;