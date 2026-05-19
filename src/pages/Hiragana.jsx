const hiragana = [
  { kana: "あ", romaji: "a", example: "あさ (asa) - morning" },
  { kana: "い", romaji: "i", example: "いぬ (inu) - dog" },
  { kana: "う", romaji: "u", example: "うみ (umi) - sea" },
  { kana: "え", romaji: "e", example: "えき (eki) - station" },
  { kana: "お", romaji: "o", example: "おちゃ (ocha) - tea" },

  { kana: "か", romaji: "ka", example: "かさ (kasa) - umbrella" },
  { kana: "き", romaji: "ki", example: "き (ki) - tree" },
  { kana: "く", romaji: "ku", example: "くるま (kuruma) - car" },
  { kana: "け", romaji: "ke", example: "けさ (kesa) - this morning" },
  { kana: "こ", romaji: "ko", example: "こども (kodomo) - child" },
];

function Hiragana() {
  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Hiragana</h1>
      <p style={styles.subtitle}>
        Hover over a character to see its pronunciation and an example word.
      </p>

      <div style={styles.grid}>
        {hiragana.map((char) => (
          <div key={char.kana} style={styles.card}>
            <div style={styles.kana}>{char.kana}</div>
            <div style={styles.romaji}>{char.romaji}</div>
            <div style={styles.example}>{char.example}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#020617",
    color: "white",
    padding: "40px 20px",
    fontFamily: "Arial, sans-serif",
  },

  title: {
  textAlign: "center",
  fontSize: "clamp(2.5rem, 6vw, 5rem)",
  marginBottom: "10px",
  lineHeight: 1.1,
},

  subtitle: {
    textAlign: "center",
    color: "#cbd5e1",
    marginBottom: "40px",
    fontSize: "1.1rem",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "20px",
    maxWidth: "1200px",
    margin: "0 auto",
  },

  card: {
    background: "#1e293b",
    borderRadius: "20px",
    padding: "25px",
    textAlign: "center",
    transition: "transform 0.3s ease",
    cursor: "pointer",
    border: "1px solid rgba(148, 163, 184, 0.15)",
  },

  kana: {
    fontSize: "4rem",
    marginBottom: "10px",
  },

  romaji: {
    fontSize: "1.4rem",
    fontWeight: "bold",
    marginBottom: "10px",
    color: "#a78bfa",
  },

  example: {
    color: "#cbd5e1",
    lineHeight: "1.5",
    fontSize: "0.95rem",
  },
};

export default Hiragana;