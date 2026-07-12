import { useNavigate } from "react-router-dom";

import sakuraTreeHero from "../assets/sakura-tree-hero.png";

function Home() {
  const navigate = useNavigate();
  const cards = [
    {
      title: "Hiragana",
      kana: "あ",
      description: "Learn the basic Japanese phonetic alphabet.",
      gradient: "linear-gradient(135deg, #7c3aed, #4f46e5)",
      path: "/hiragana",
    },
    {
      title: "Katakana",
      kana: "ア",
      description: "Master characters used for foreign words.",
      gradient: "linear-gradient(135deg, #2563eb, #1d4ed8)",
      path: "/katakana",
    },
    {
      title: "Kanji",
      kana: "漢",
      description: "Build your personal kanji collection and notes.",
      gradient: "linear-gradient(135deg, #ec4899, #db2777)",
      path: "/kanji",
    },
    {
      title: "Vocabulary",
      kana: "語",
      description: "Save words with readings, meanings, and example sentences.",
      gradient: "linear-gradient(135deg, #6d28d9, #4338ca)",
      path: "/vocabulary",
    },
  ];

  return (
    <div style={styles.page}>
      <div style={styles.backgroundImage} />
      <div style={styles.backgroundOverlay} />
      <div style={styles.sakuraLeft}>🌸</div>
      <div style={styles.sakuraCenter}>🌸</div>
      <div style={styles.sakuraRight}>🌸</div>

      <header style={styles.header}>
        <p style={styles.japaneseText}>日本語を学ぼう</p>

        <h1 style={styles.title}>
          Japanese <span style={styles.gradientText}>Learning</span> Platform
        </h1>

        <p style={styles.subtitle}>
          Welcome to your personal Japanese study app!
        </p>
      </header>

      <section style={styles.cardGrid}>
        {cards.map((card) => (
          <div
            key={card.title}
            style={styles.card}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform =
                "translateY(-10px) scale(1.02)";
              e.currentTarget.style.boxShadow =
                "0 25px 50px rgba(0, 0, 0, 0.45)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform =
                "translateY(0) scale(1)";
              e.currentTarget.style.boxShadow =
                "0 20px 40px rgba(0, 0, 0, 0.35)";
            }}
          >
            <div
              style={{
                ...styles.kanaCircle,
                background: card.gradient,
              }}
            >
              {card.kana}
            </div>

            <h2 style={styles.cardTitle}>{card.title}</h2>

            <div
              style={{
                ...styles.cardUnderline,
                background: card.gradient,
              }}
            />

            <p style={styles.cardDescription}>{card.description}</p>

            <button
              style={{
                ...styles.button,
                background: card.gradient,
              }}
              onClick={() => navigate(card.path)}
            >
              Explore →
            </button>
          </div>
        ))}
      </section>

      <footer style={styles.footer}>
        📚 Study. Practice. Master Japanese. 🇯🇵
      </footer>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #07111f 0%, #082f3a 48%, #0b1220 100%)",
    color: "white",
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    padding: "34px 20px 56px",
    position: "relative",
    overflow: "hidden",
  },

  backgroundImage: {
    position: "absolute",
    inset: 0,
    backgroundImage: `url(${sakuraTreeHero})`,
    backgroundPosition: "left center",
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
    opacity: 0.9,
    transform: "scale(1.01)",
  },

  backgroundOverlay: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(90deg, rgba(4, 18, 30, 0.18) 0%, rgba(7, 26, 41, 0.54) 42%, rgba(6, 14, 30, 0.9) 100%), linear-gradient(180deg, rgba(8, 47, 58, 0.18) 0%, rgba(9, 31, 44, 0.44) 48%, rgba(4, 11, 24, 0.94) 100%)",
  },

  sakuraLeft: {
    position: "absolute",
    top: "28px",
    left: "32px",
    fontSize: "2.1rem",
    opacity: 0.78,
    transform: "rotate(-14deg)",
    zIndex: 1,
  },

  sakuraCenter: {
    position: "absolute",
    top: "72px",
    left: "41%",
    fontSize: "1.55rem",
    opacity: 0.68,
    transform: "translateX(-50%) rotate(10deg)",
    zIndex: 1,
  },

  sakuraRight: {
    position: "absolute",
    top: "92px",
    right: "58px",
    fontSize: "1.75rem",
    opacity: 0.62,
    transform: "rotate(18deg)",
    zIndex: 1,
  },

  header: {
    textAlign: "center",
    maxWidth: "980px",
    margin: "0 auto 48px",
    position: "relative",
    zIndex: 1,
  },

  japaneseText: {
    color: "#99f6e4",
    fontSize: "0.95rem",
    letterSpacing: "0.2em",
    marginBottom: "16px",
  },

  title: {
    fontSize: "clamp(3.2rem, 7vw, 5.4rem)",
    lineHeight: 1.05,
    fontWeight: 800,
    margin: 0,
  },

  gradientText: {
    background: "linear-gradient(90deg, #5eead4, #93c5fd)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },

  subtitle: {
    marginTop: "18px",
    fontSize: "1.22rem",
    color: "#cbd5e1",
  },

  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "28px",
    maxWidth: "1180px",
    margin: "0 auto",
    position: "relative",
    zIndex: 1,
  },

  card: {
    background: "rgba(15, 23, 42, 0.76)",
    border: "1px solid rgba(226, 232, 240, 0.16)",
    borderRadius: "28px",
    backdropFilter: "blur(16px)",
    padding: "34px 28px",
    textAlign: "center",
    boxShadow: "0 20px 40px rgba(0,0,0,0.35)",
    transition: "all 0.3s ease",
  },

  kanaCircle: {
    width: "120px",
    height: "120px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 24px",
    fontSize: "3.8rem",
    fontWeight: 700,
    boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
  },

  cardTitle: {
    fontSize: "2.35rem",
    fontWeight: 700,
    marginBottom: "12px",
  },

  cardUnderline: {
    width: "60px",
    height: "4px",
    borderRadius: "999px",
    margin: "0 auto 24px",
  },

  cardDescription: {
    fontSize: "1.2rem",
    lineHeight: 1.7,
    color: "#cbd5e1",
    minHeight: "96px",
  },

  button: {
    border: "none",
    color: "white",
    padding: "14px 32px",
    borderRadius: "14px",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
    marginTop: "8px",
    boxShadow: "0 10px 20px rgba(0,0,0,0.25)",
  },

  footer: {
    marginTop: "50px",
    maxWidth: "700px",
    marginInline: "auto",
    padding: "18px 28px",
    borderRadius: "999px",
    background: "rgba(15, 23, 42, 0.7)",
    backdropFilter: "blur(14px)",
    border: "1px solid rgba(226, 232, 240, 0.14)",
    color: "#cbd5e1",
    textAlign: "center",
    fontSize: "1rem",
    position: "relative",
    zIndex: 1,
  },
};

export default Home;
