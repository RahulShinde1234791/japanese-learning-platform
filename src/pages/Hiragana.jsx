import { Link } from "react-router-dom";

import KanaTable from "../components/KanaTable";
import hiragana from "../data/hiragana";

const floatingKana = ["あ", "い", "う", "え", "お", "か", "き", "さ", "な", "は", "ま", "や", "ら", "わ"];

function Hiragana() {
  return (
    <div style={styles.page}>
      {/* Animated orbs */}
      <div style={{ ...styles.orb, ...styles.orb1 }} />
      <div style={{ ...styles.orb, ...styles.orb2 }} />
      <div style={{ ...styles.orb, ...styles.orb3 }} />

      {/* Floating kana */}
      {floatingKana.map((kana, i) => (
        <span
          key={kana}
          style={{
            ...styles.floatKana,
            left: `${(i * 71) % 95}%`,
            top: `${(i * 137 + 8) % 88}%`,
            animationDelay: `${i * 0.7}s`,
            fontSize: `${1.4 + (i % 3) * 0.5}rem`,
            opacity: 0.04 + (i % 4) * 0.025,
          }}
        >
          {kana}
        </span>
      ))}

      <div style={styles.content}>
        <Link to="/" style={styles.backLink}>← Home</Link>

        <header style={styles.header}>
          <p style={styles.kicker}>ひらがな</p>
          <h1 style={styles.title}>Hiragana</h1>
          <p style={styles.subtitle}>
            Study the traditional hiragana chart by vowel column and consonant row.
          </p>
        </header>

        <KanaTable rows={hiragana} />
      </div>

      <style>{`
        @keyframes orbFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-40px) scale(1.08); }
        }
        @keyframes kanaFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-18px) rotate(6deg); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "radial-gradient(ellipse at 20% 10%, rgba(20,184,166,0.22) 0%, transparent 45%), radial-gradient(ellipse at 80% 80%, rgba(6,182,212,0.18) 0%, transparent 40%), radial-gradient(ellipse at 50% 50%, rgba(15,118,110,0.12) 0%, transparent 60%), #030f0f",
    color: "white",
    boxSizing: "border-box",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    overflow: "hidden",
    position: "relative",
  },
  orb: {
    borderRadius: "50%",
    filter: "blur(72px)",
    position: "absolute",
    pointerEvents: "none",
  },
  orb1: {
    width: "520px",
    height: "520px",
    top: "-120px",
    left: "-100px",
    background: "rgba(20, 184, 166, 0.18)",
    animation: "orbFloat 9s ease-in-out infinite",
  },
  orb2: {
    width: "400px",
    height: "400px",
    bottom: "5%",
    right: "-80px",
    background: "rgba(6, 182, 212, 0.14)",
    animation: "orbFloat 12s ease-in-out infinite reverse",
  },
  orb3: {
    width: "280px",
    height: "280px",
    top: "40%",
    left: "55%",
    background: "rgba(45, 212, 191, 0.1)",
    animation: "orbFloat 7s ease-in-out infinite 2s",
  },
  floatKana: {
    position: "absolute",
    color: "#5eead4",
    fontWeight: 900,
    pointerEvents: "none",
    userSelect: "none",
    animation: "kanaFloat 6s ease-in-out infinite",
    zIndex: 0,
  },
  content: {
    position: "relative",
    zIndex: 1,
    padding: "clamp(20px, 4vw, 40px) clamp(16px, 4vw, 24px) 56px",
  },
  backLink: {
    color: "#5eead4",
    display: "inline-flex",
    fontWeight: 700,
    marginBottom: "28px",
    textDecoration: "none",
    fontSize: "0.95rem",
  },
  header: {
    textAlign: "center",
    marginBottom: "40px",
  },
  kicker: {
    color: "#5eead4",
    fontSize: "1.6rem",
    fontWeight: 900,
    letterSpacing: "0.12em",
    marginBottom: "8px",
    opacity: 0.85,
  },
  title: {
    textAlign: "center",
    fontSize: "clamp(2.5rem, 6vw, 5rem)",
    margin: "0 0 12px",
    lineHeight: 1.1,
    color: "white",
    fontFamily: "inherit",
    fontWeight: 800,
  },
  subtitle: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: "clamp(0.95rem, 2.5vw, 1.1rem)",
    lineHeight: 1.6,
  },
};

export default Hiragana;
