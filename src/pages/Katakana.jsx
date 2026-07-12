import { Link } from "react-router-dom";

import KanaTable from "../components/KanaTable";
import katakana from "../data/katakana";

const floatingKana = ["ア", "イ", "ウ", "エ", "オ", "カ", "キ", "サ", "ナ", "ハ", "マ", "ヤ", "ラ", "ワ"];

function Katakana() {
  return (
    <div style={styles.page}>
      {/* Animated orbs */}
      <div style={{ ...styles.orb, ...styles.orb1 }} />
      <div style={{ ...styles.orb, ...styles.orb2 }} />
      <div style={{ ...styles.orb, ...styles.orb3 }} />

      {/* Floating katakana */}
      {floatingKana.map((kana, i) => (
        <span
          key={kana}
          style={{
            ...styles.floatKana,
            left: `${(i * 67) % 93}%`,
            top: `${(i * 149 + 12) % 85}%`,
            animationDelay: `${i * 0.65}s`,
            fontSize: `${1.3 + (i % 3) * 0.6}rem`,
            opacity: 0.04 + (i % 4) * 0.025,
          }}
        >
          {kana}
        </span>
      ))}

      <div style={styles.content}>
        <Link to="/" style={styles.backLink}>← Home</Link>

        <header style={styles.header}>
          <p style={styles.kicker}>カタカナ</p>
          <h1 style={styles.title}>Katakana</h1>
          <p style={styles.subtitle}>
            Practice the angular kana used for loanwords, names, sounds, and emphasis.
          </p>
        </header>

        <KanaTable rows={katakana} />
      </div>

      <style>{`
        @keyframes orbFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-40px) scale(1.08); }
        }
        @keyframes kanaFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-18px) rotate(-6deg); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "radial-gradient(ellipse at 75% 8%, rgba(56,189,248,0.22) 0%, transparent 44%), radial-gradient(ellipse at 15% 85%, rgba(14,165,233,0.18) 0%, transparent 42%), radial-gradient(ellipse at 45% 45%, rgba(2,132,199,0.1) 0%, transparent 55%), #020c18",
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
    width: "500px",
    height: "500px",
    top: "-140px",
    right: "-80px",
    background: "rgba(56, 189, 248, 0.16)",
    animation: "orbFloat 10s ease-in-out infinite",
  },
  orb2: {
    width: "380px",
    height: "380px",
    bottom: "0%",
    left: "-60px",
    background: "rgba(14, 165, 233, 0.14)",
    animation: "orbFloat 13s ease-in-out infinite reverse",
  },
  orb3: {
    width: "260px",
    height: "260px",
    top: "38%",
    right: "30%",
    background: "rgba(125, 211, 252, 0.09)",
    animation: "orbFloat 8s ease-in-out infinite 1.5s",
  },
  floatKana: {
    position: "absolute",
    color: "#93c5fd",
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
    color: "#93c5fd",
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
    color: "#7dd3fc",
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

export default Katakana;
