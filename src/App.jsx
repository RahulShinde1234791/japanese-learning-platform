function App() {
  const cards = [
    {
      title: "Hiragana",
      description: "Learn the basic Japanese phonetic alphabet.",
    },
    {
      title: "Katakana",
      description: "Master characters used for foreign words.",
    },
    {
      title: "Kanji",
      description: "Build your personal kanji collection and notes.",
    },
  ];

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Japanese Learning Platform</h1>
      <p style={styles.subtitle}>
        Welcome to your personal Japanese study app!
      </p>

      <div style={styles.cardContainer}>
        {cards.map((card) => (
          <div
            key={card.title}
            style={styles.card}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "translateY(-5px)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.transform = "translateY(0px)")
            }
          >
            <h2 style={styles.cardTitle}>{card.title}</h2>
            <p style={styles.cardDescription}>{card.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#0f172a",
    color: "white",
    padding: "50px 20px",
    textAlign: "center",
    fontFamily: "Arial, sans-serif",
  },
  title: {
    fontSize: "4rem",
    marginBottom: "10px",
  },
  subtitle: {
    fontSize: "1.2rem",
    color: "#cbd5e1",
    marginBottom: "50px",
  },
  cardContainer: {
    display: "flex",
    justifyContent: "center",
    gap: "30px",
    flexWrap: "wrap",
  },
  card: {
    backgroundColor: "#1e293b",
    padding: "30px",
    borderRadius: "16px",
    width: "300px",
    cursor: "pointer",
    transition: "transform 0.3s ease",
    boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
  },
  cardTitle: {
    fontSize: "2rem",
    marginBottom: "15px",
  },
  cardDescription: {
    color: "#cbd5e1",
    lineHeight: "1.5",
  },
};

export default App;