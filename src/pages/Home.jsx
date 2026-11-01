import { useNavigate } from "react-router-dom";
import SakuraPetals from "../components/SakuraPetals";
import { useRef } from "react";

function Home() {
  const navigate = useNavigate();
  const branchRef = useRef(null);

  const cards = [
    {
      title: "Hiragana",
      japanese: "ひらがな",
      kana: "あ",
      description: "Learn the 46 fundamental phonetic characters with romaji and examples.",
      gradient: "linear-gradient(135deg, #a855f7 0%, #6366f1 100%)",
      glowColor: "rgba(168, 85, 247, 0.35)",
      path: "/hiragana",
    },
    {
      title: "Katakana",
      japanese: "カタカナ",
      kana: "ア",
      description: "Master characters used for borrowed loanwords, foreign names, and onomatopoeia.",
      gradient: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
      glowColor: "rgba(59, 130, 246, 0.35)",
      path: "/katakana",
    },
    {
      title: "Kanji & Vocab",
      japanese: "漢字・語彙",
      kana: "漢",
      description: "Build your notebook with dictionary lookup, stroke order SVGs, and handwriting search.",
      gradient: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
      glowColor: "rgba(236, 72, 153, 0.35)",
      path: "/kanji",
    },
    {
      title: "Flashcards",
      japanese: "暗記カード",
      kana: "習",
      description: "Reinforce long-term retention with spaced review flip cards and mastery ratings.",
      gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
      glowColor: "rgba(245, 158, 11, 0.35)",
      path: "/flashcards",
    },
  ];

  return (
    <div style={styles.page}>
      <SakuraPetals branchRef={branchRef} />

      {/* Sakura Branch Background Animation */}
      <svg
        ref={branchRef}
        className="sakura-branch-motion"
        aria-hidden="true"
        viewBox="0 0 420 300"
        style={styles.sakuraBranch}
      >
        <g
          fill="none"
          stroke="#765064"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M 420 12 Q 340 42 300 94 T 190 155 T 75 250" />
          <path d="M 300 94 Q 286 52 246 31" />
          <path d="M 252 125 Q 224 94 190 91" />
          <path d="M 190 155 Q 160 128 124 133" />
          <path d="M 124 213 Q 115 176 83 164" />
          <path d="M 350 48 Q 350 20 329 8" />
        </g>

        <g fill="#d86b9a" stroke="#f3a4c2" strokeWidth="1.5">
          <circle cx="245" cy="30" r="10" />
          <circle cx="232" cy="36" r="9" />
          <circle cx="248" cy="44" r="9" />
          <circle cx="260" cy="35" r="8" />
          <circle cx="244" cy="24" r="8" />

          <circle cx="188" cy="90" r="9" />
          <circle cx="176" cy="96" r="8" />
          <circle cx="190" cy="103" r="9" />
          <circle cx="202" cy="94" r="8" />
          <circle cx="190" cy="82" r="7" />

          <circle cx="124" cy="132" r="9" />
          <circle cx="112" cy="138" r="8" />
          <circle cx="125" cy="145" r="9" />
          <circle cx="137" cy="136" r="8" />
          <circle cx="125" cy="124" r="7" />

          <circle cx="82" cy="163" r="8" />
          <circle cx="70" cy="169" r="8" />
          <circle cx="84" cy="177" r="8" />
          <circle cx="94" cy="166" r="7" />

          <circle cx="329" cy="9" r="8" />
          <circle cx="317" cy="15" r="7" />
          <circle cx="330" cy="22" r="8" />
          <circle cx="341" cy="13" r="7" />
        </g>

        <g fill="#ffe1eb">
          <circle cx="245" cy="34" r="3" />
          <circle cx="189" cy="94" r="3" />
          <circle cx="125" cy="136" r="3" />
          <circle cx="82" cy="169" r="3" />
          <circle cx="330" cy="14" r="3" />
        </g>
      </svg>

      {/* Hero Header */}
      <header style={styles.header}>
        <p style={styles.kicker}>NIHONGO HUB · 日本語学習</p>
        <h1 style={styles.title}>
          Japanese Learning <span style={styles.gradientText}>Hub</span>
        </h1>
        <p style={styles.subtitle}>
          Master Kana, curate your personal Kanji &amp; Vocabulary notes, and practice with spaced review cards.
        </p>
      </header>

      {/* 4 Feature Panels in a Compact Grid */}
      <section style={styles.cardGrid}>
        {cards.map((card) => (
          <div
            key={card.title}
            style={styles.card}
            className="home-module-card"
            onClick={() => navigate(card.path)}
          >
            <div style={styles.cardHeaderRow}>
              <span style={styles.cardJapaneseTag}>{card.japanese}</span>
            </div>

            <div
              style={{
                ...styles.kanaCircle,
                background: card.gradient,
                boxShadow: `0 8px 20px ${card.glowColor}`,
              }}
            >
              {card.kana}
            </div>

            <h2 style={styles.cardTitle}>{card.title}</h2>
            <div style={{ ...styles.cardUnderline, background: card.gradient }} />
            <p style={styles.cardDescription}>{card.description}</p>

            <button
              type="button"
              style={{
                ...styles.button,
                background: card.gradient,
              }}
              onClick={(e) => {
                e.stopPropagation();
                navigate(card.path);
              }}
            >
              Open →
            </button>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        Study. Practice. Master Japanese.
      </footer>

      <style>{`
        @keyframes sakuraSway {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-3deg); }
          75% { transform: rotate(2deg); }
        }

        .home-module-card {
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }

        .home-module-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.45), 0 0 15px rgba(244, 114, 182, 0.25);
          border-color: rgba(244, 114, 182, 0.4) !important;
        }

        @media (max-width: 1024px) {
          .home-grid-layout {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }

        @media (max-width: 600px) {
          .home-grid-layout {
            grid-template-columns: 1fr !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .sakura-branch-motion {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#070b19",
    backgroundImage: `
      radial-gradient(circle at 50% 0%, rgba(236, 72, 153, 0.12) 0%, transparent 45%),
      radial-gradient(circle at 85% 25%, rgba(99, 102, 241, 0.10) 0%, transparent 40%),
      linear-gradient(180deg, #090e24 0%, #060914 100%)
    `,
    color: "white",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    padding: "32px 24px 36px",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    boxSizing: "border-box",
  },

  sakuraBranch: {
    position: "absolute",
    top: "-15px",
    right: "-30px",
    width: "min(380px, 35vw)",
    height: "auto",
    opacity: 0.38,
    pointerEvents: "none",
    zIndex: 0,
    transformOrigin: "100% 0%",
    animation: "sakuraSway 6s ease-in-out infinite",
  },

  header: {
    textAlign: "center",
    maxWidth: "800px",
    margin: "0 auto 28px",
    position: "relative",
    zIndex: 1,
  },

  kicker: {
    color: "#f472b6",
    fontSize: "0.78rem",
    fontWeight: "800",
    letterSpacing: "0.12em",
    margin: "0 0 8px",
    textTransform: "uppercase",
  },

  title: {
    fontSize: "clamp(2rem, 4vw, 3.2rem)",
    lineHeight: 1.15,
    fontWeight: "800",
    margin: "0 0 10px",
    letterSpacing: "-0.02em",
  },

  gradientText: {
    background: "linear-gradient(135deg, #ffffff 30%, #f472b6 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },

  subtitle: {
    fontSize: "clamp(0.95rem, 2vw, 1.05rem)",
    lineHeight: 1.55,
    color: "#cbd5e1",
    margin: "0 auto",
    maxWidth: "660px",
  },

  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "18px",
    maxWidth: "1180px",
    width: "100%",
    margin: "0 auto",
    position: "relative",
    zIndex: 1,
  },

  card: {
    background: "rgba(15, 23, 42, 0.78)",
    border: "1px solid rgba(244, 114, 182, 0.2)",
    borderRadius: "16px",
    backdropFilter: "blur(14px)",
    padding: "20px 18px",
    display: "flex",
    flexDirection: "column",
    textAlign: "center",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.35)",
  },

  cardHeaderRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "12px",
  },

  cardJapaneseTag: {
    color: "#f472b6",
    fontSize: "0.78rem",
    fontWeight: "700",
    letterSpacing: "0.06em",
  },

  kanaCircle: {
    width: "68px",
    height: "68px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 12px",
    fontSize: "2.1rem",
    fontWeight: "800",
    color: "#ffffff",
  },

  cardTitle: {
    fontSize: "1.25rem",
    fontWeight: "800",
    margin: "0 0 6px",
    color: "#f8fafc",
  },

  cardUnderline: {
    width: "36px",
    height: "2.5px",
    borderRadius: "999px",
    margin: "0 auto 10px",
  },

  cardDescription: {
    fontSize: "0.85rem",
    lineHeight: "1.5",
    color: "#94a3b8",
    flexGrow: 1,
    marginBottom: "16px",
    minHeight: "52px",
  },

  button: {
    border: "none",
    color: "white",
    padding: "9px 18px",
    borderRadius: "8px",
    fontSize: "0.88rem",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 3px 10px rgba(0,0,0,0.25)",
    fontFamily: "inherit",
    transition: "opacity 0.2s ease",
    width: "100%",
  },

  footer: {
    marginTop: "28px",
    color: "#64748b",
    textAlign: "center",
    fontSize: "0.8rem",
    fontWeight: "500",
    letterSpacing: "0.04em",
    position: "relative",
    zIndex: 1,
  },
};

export default Home;
