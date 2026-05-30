import { Link } from "react-router-dom";

import KanaTable from "../components/KanaTable";
import katakana from "../data/katakana";

function Katakana() {
  return (
    <div style={styles.page}>
      <Link to="/" style={styles.backLink}>
        ← Home
      </Link>

      <h1 style={styles.title}>Katakana</h1>
      <p style={styles.subtitle}>
        Practice the angular kana used for loanwords, names, sounds, and emphasis.
      </p>

      <KanaTable rows={katakana} />
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, rgba(56, 189, 248, 0.14) 0%, transparent 36%), linear-gradient(160deg, #061826 0%, #102646 50%, #14172f 100%)",
    color: "white",
    padding: "40px 20px 56px",
    fontFamily: "Arial, sans-serif",
    boxSizing: "border-box",
  },
  backLink: {
    color: "#93c5fd",
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

export default Katakana;
