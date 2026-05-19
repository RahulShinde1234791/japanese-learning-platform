function App() {
  const cards = [
    {
      title: "Hiragana",
      kana: "あ",
      description: "Learn the basic Japanese phonetic alphabet.",
      gradient: "linear-gradient(135deg, #7c3aed, #4f46e5)",
    },
    {
      title: "Katakana",
      kana: "ア",
      description: "Master characters used for foreign words.",
      gradient: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    },
    {
      title: "Kanji",
      kana: "漢",
      description: "Build your personal kanji collection and notes.",
      gradient: "linear-gradient(135deg, #ec4899, #db2777)",
    },
  ];

  return (
    <div style={styles.page}>
      {/* Decorative Background */}
      <div style={styles.moon}></div>
      <div style={styles.sakuraLeft}>🌸</div>
      <div style={styles.sakuraCenter}>🌸</div>
      <div style={styles.torii}>⛩️</div>

      {/* Header */}
      <header style={styles.header}>
        <p style={styles.japaneseText}>日本語を学ぼう</p>

        <h1 style={styles.title}>
          Japanese <span style={styles.gradientText}>Learning</span> Platform
        </h1>

        <p style={styles.subtitle}>
          Welcome to your personal Japanese study app!
        </p>
      </header>

      {/* Cards */}
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
            >
              Explore →
            </button>
          </div>
        ))}
      </section>

      {/* Footer */}
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
      "radial-gradient(circle at top, #0b1f5e 0%, #020617 65%, #01030a 100%)",
    color: "white",
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    padding: "40px 20px 60px",
    position: "relative",
    overflow: "hidden",
  },

  moon: {
    position: "absolute",
    top: "50px",
    right: "80px",
    width: "180px",
    height: "180px",
    borderRadius: "50%",
    background: "rgba(167, 139, 250, 0.12)",
    filter: "blur(2px)",
  },

  sakuraLeft: {
    position: "absolute",
    top: "20px",
    left: "30px",
    fontSize: "2.5rem",
    opacity: 0.85,
  },

  sakuraCenter: {
    position: "absolute",
    top: "30px",
    left: "50%",
    transform: "translateX(-50%)",
    fontSize: "2rem",
    opacity: 0.9,
  },

  torii: {
    position: "absolute",
    bottom: "30px",
    right: "50px",
    fontSize: "2rem",
    opacity: 0.35,
  },

  header: {
    textAlign: "center",
    maxWidth: "1100px",
    margin: "0 auto 60px",
    position: "relative",
    zIndex: 1,
  },

  japaneseText: {
    color: "#f9a8d4",
    fontSize: "1rem",
    letterSpacing: "0.2em",
    marginBottom: "16px",
  },

  title: {
    fontSize: "clamp(3rem, 8vw, 6rem)",
    lineHeight: 1.05,
    fontWeight: 800,
    margin: 0,
  },

  gradientText: {
    background: "linear-gradient(90deg, #c084fc, #f472b6)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },

  subtitle: {
    marginTop: "20px",
    fontSize: "1.35rem",
    color: "#cbd5e1",
  },

  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "32px",
    maxWidth: "1280px",
    margin: "0 auto",
    position: "relative",
    zIndex: 1,
  },

  card: {
    background: "rgba(15, 23, 42, 0.82)",
    border: "1px solid rgba(148, 163, 184, 0.15)",
    borderRadius: "28px",
    padding: "40px 32px",
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
    margin: "0 auto 28px",
    fontSize: "4rem",
    fontWeight: 700,
    boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
  },

  cardTitle: {
    fontSize: "2.6rem",
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
    background: "rgba(15, 23, 42, 0.65)",
    border: "1px solid rgba(148, 163, 184, 0.12)",
    color: "#cbd5e1",
    textAlign: "center",
    fontSize: "1rem",
    position: "relative",
    zIndex: 1,
  },
};

export default App;