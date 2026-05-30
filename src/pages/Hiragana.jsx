import { Link } from "react-router-dom";

import KanaTable from "../components/KanaTable";
import hiragana from "../data/hiragana";

function Hiragana() {
  return (
    <div style={styles.page}>
      <Link to="/" style={styles.backLink}>
        ← Home
      </Link>

      <h1 style={styles.title}>Hiragana</h1>
      <p style={styles.subtitle}>
        Study the traditional hiragana chart by vowel column and consonant row.
      </p>

      <KanaTable rows={hiragana} />
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, rgba(20, 184, 166, 0.16) 0%, transparent 34%), linear-gradient(160deg, #051b1f 0%, #0b2438 48%, #0f172a 100%)",
    color: "white",
    padding: "40px 20px 56px",
    fontFamily: "Arial, sans-serif",
    boxSizing: "border-box",
  },
  backLink: {
    color: "#5eead4",
    display: "inline-flex",
    marginBottom: "28px",
    textDecoration: "none",
    fontWeight: 700,
  },
  title: {
    textAlign: "center",
    fontSize: "clamp(2.5rem, 6vw, 5rem)",
    margin: "0 0 10px",
    lineHeight: 1.1,
    color: "white",
  },
  subtitle: {
    textAlign: "center",
    color: "#cbd5e1",
    marginBottom: "40px",
    fontSize: "1.1rem",
  },
};

export default Hiragana;
