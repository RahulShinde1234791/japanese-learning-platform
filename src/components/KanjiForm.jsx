import { useState } from "react";

const emptyForm = {
  kanji: "",
  jlptLevel: "",
  meaning: "",
  onyomi: "",
  kunyomi: "",
  example: "",
  notes: "",
};

const jlptOptions = ["N5", "N4", "N3", "N2", "N1"];
const kanjiPattern = /\p{Script=Han}/u;

function formatJlptLevel(jlpt) {
  return jlpt ? `N${jlpt}` : "";
}

function getHardestJlptLevel(results) {
  const levels = results.map((result) => result.jlpt).filter(Boolean);
  if (levels.length === 0) return "";

  return formatJlptLevel(Math.min(...levels));
}

function joinUnique(values) {
  return [...new Set(values.filter(Boolean))].join(", ");
}

function getWordVariant(wordData) {
  return wordData.variants?.[0] ?? {};
}

function formatWordEntry(wordData, fallbackWord = "") {
  const variant = getWordVariant(wordData);
  return {
    word: variant.written || fallbackWord,
    reading: variant.pronounced || "",
    meaning: (wordData.meanings?.[0]?.glosses || []).join(", "),
  };
}

function KanjiForm({ editingEntry, onCancelEdit, onSubmit, onSuggestionsChange }) {
  const [formData, setFormData] = useState(editingEntry ?? emptyForm);
  const [loading, setLoading] = useState(false);

  async function handleAutoFill() {
    const kanjiStr = formData.kanji.trim();
    if (!kanjiStr) return;

    setLoading(true);
    try {
      const kanjiCharacters = [...new Set(Array.from(kanjiStr).filter((char) => kanjiPattern.test(char)))];
      if (kanjiCharacters.length === 0) {
        throw new Error("No kanji found");
      }

      const kanjiResults = await Promise.all(
        kanjiCharacters.map(async (char) => {
          const response = await fetch(`https://kanjiapi.dev/v1/kanji/${encodeURIComponent(char)}`);
          if (!response.ok) {
            throw new Error("Kanji not found");
          }
          return response.json();
        }),
      );
      const wordLists = await Promise.all(
        kanjiCharacters.map(async (char) => {
          const response = await fetch(`https://kanjiapi.dev/v1/words/${encodeURIComponent(char)}`);
          return response.ok ? response.json() : [];
        }),
      );
      const wordResults = wordLists.flat();
      const matchingWord = wordResults.find((wordData) =>
        wordData.variants?.some((variant) => variant.written === kanjiStr),
      );
      const suggestions = wordResults
        .map((wordData) => formatWordEntry(wordData))
        .filter((word) => word.word && word.word !== kanjiStr)
        .filter((word, index, words) => words.findIndex((item) => item.word === word.word) === index)
        .slice(0, 8);

      const meanings = kanjiResults
        .map((data) => `${data.kanji}: ${(data.meanings || []).join(", ")}`)
        .join("; ");
      const onyomi = joinUnique(kanjiResults.flatMap((data) => data.on_readings || []));
      const kunyomi = joinUnique(kanjiResults.flatMap((data) => data.kun_readings || []));
      const jlptLevel = getHardestJlptLevel(kanjiResults);
      const isVocabulary = Array.from(kanjiStr).length > 1;
      const matchedVocabulary = formatWordEntry(matchingWord ?? {}, kanjiStr);
      const vocabularyEntry = isVocabulary
        ? {
            ...matchedVocabulary,
            word: kanjiStr,
            meaning: matchedVocabulary.meaning || meanings,
            jlptLevel,
          }
        : null;
      const generatedKanjiEntries = kanjiResults.map((data) => ({
        kanji: data.kanji,
        jlptLevel: formatJlptLevel(data.jlpt),
        meaning: (data.meanings || []).join(", "),
        onyomi: (data.on_readings || []).join(", "),
        kunyomi: (data.kun_readings || []).join(", "),
        example: vocabularyEntry
          ? `${vocabularyEntry.word}${vocabularyEntry.reading ? ` (${vocabularyEntry.reading})` : ""}`
          : "",
        notes: vocabularyEntry
          ? `From vocabulary: ${vocabularyEntry.word}`
          : "Added from autofill.",
      }));

      setFormData((currentFormData) => ({
        ...currentFormData,
        jlptLevel,
        meaning: vocabularyEntry?.meaning || meanings,
        onyomi: onyomi,
        kunyomi: kunyomi,
        example:
          currentFormData.example ||
          (vocabularyEntry
            ? `${vocabularyEntry.word}${vocabularyEntry.reading ? ` (${vocabularyEntry.reading})` : ""}`
            : ""),
        vocabularyEntry,
        generatedKanjiEntries,
      }));
      onSuggestionsChange?.(suggestions);
    } catch {
      alert("Kanji not found.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit(formData);
    setFormData(emptyForm);
  }

  const isEditing = Boolean(editingEntry);

  return (
    <form style={styles.form} onSubmit={handleSubmit}>
      <div style={styles.formHeader}>
        <h2 style={styles.formTitle}>{isEditing ? "Edit Kanji" : "Add Kanji"}</h2>
        {isEditing && (
          <button type="button" style={styles.secondaryButton} onClick={onCancelEdit}>
            Cancel
          </button>
        )}
      </div>

      <label style={styles.label}>
        Kanji
        <div style={styles.inputContainer}>
          <input
            required
            maxLength={4}
            name="kanji"
            style={{ ...styles.input, marginTop: 0 }}
            value={formData.kanji}
            onChange={handleChange}
          />
          <button
            type="button"
            disabled={loading || !formData.kanji.trim()}
            style={
              loading || !formData.kanji.trim()
                ? styles.autoFillButtonDisabled
                : styles.autoFillButton
            }
            onClick={handleAutoFill}
          >
            {loading ? "Loading..." : "Auto Fill"}
          </button>
        </div>
      </label>

      <label style={styles.label}>
        JLPT Level
        <select
          name="jlptLevel"
          style={styles.input}
          value={formData.jlptLevel ?? ""}
          onChange={handleChange}
        >
          <option value="">Unknown</option>
          {jlptOptions.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
      </label>

      <label style={styles.label}>
        Meaning
        <input
          required
          name="meaning"
          style={styles.input}
          value={formData.meaning}
          onChange={handleChange}
        />
      </label>

      <div style={styles.twoColumns}>
        <label style={styles.label}>
          Onyomi
          <input
            name="onyomi"
            style={styles.input}
            value={formData.onyomi}
            onChange={handleChange}
          />
        </label>

        <label style={styles.label}>
          Kunyomi
          <input
            name="kunyomi"
            style={styles.input}
            value={formData.kunyomi}
            onChange={handleChange}
          />
        </label>
      </div>

      <label style={styles.label}>
        Example
        <input
          required
          name="example"
          style={styles.input}
          value={formData.example}
          onChange={handleChange}
        />
      </label>

      <label style={styles.label}>
        Notes
        <textarea
          name="notes"
          rows={4}
          style={styles.textarea}
          value={formData.notes}
          onChange={handleChange}
        />
      </label>

      <button type="submit" style={styles.primaryButton}>
        {isEditing ? "Save Changes" : "Add Kanji"}
      </button>
    </form>
  );
}

const fieldBase = {
  background: "rgba(15, 23, 42, 0.9)",
  border: "1px solid rgba(148, 163, 184, 0.22)",
  borderRadius: "8px",
  boxSizing: "border-box",
  color: "white",
  font: "inherit",
  marginTop: "8px",
  outline: "none",
  padding: "12px 14px",
  width: "100%",
};

const styles = {
  form: {
    background: "rgba(15, 23, 42, 0.78)",
    border: "1px solid rgba(226, 232, 240, 0.16)",
    borderRadius: "12px",
    boxShadow: "0 18px 36px rgba(0, 0, 0, 0.28)",
    fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    padding: "24px",
    textAlign: "left",
  },
  formHeader: {
    alignItems: "center",
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "18px",
  },
  formTitle: {
    color: "white",
    fontSize: "1.45rem",
    fontWeight: 800,
    margin: 0,
  },
  label: {
    color: "#cbd5e1",
    display: "block",
    fontSize: "0.9rem",
    fontWeight: 800,
    marginBottom: "14px",
  },
  input: fieldBase,
  textarea: {
    ...fieldBase,
    minHeight: "112px",
    resize: "vertical",
  },
  twoColumns: {
    display: "grid",
    gap: "12px",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  },
  primaryButton: {
    background: "linear-gradient(135deg, #ec4899, #f59e0b)",
    border: "none",
    borderRadius: "8px",
    color: "white",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: 900,
    padding: "13px 18px",
    width: "100%",
  },
  secondaryButton: {
    background: "rgba(148, 163, 184, 0.14)",
    border: "1px solid rgba(148, 163, 184, 0.24)",
    borderRadius: "8px",
    color: "#e2e8f0",
    cursor: "pointer",
    fontWeight: 800,
    padding: "8px 12px",
  },
  inputContainer: {
    display: "flex",
    gap: "10px",
    marginTop: "8px",
  },
  autoFillButton: {
    background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
    border: "none",
    borderRadius: "8px",
    color: "white",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: 800,
    padding: "12px 16px",
    whiteSpace: "nowrap",
    transition: "opacity 0.2s ease",
  },
  autoFillButtonDisabled: {
    background: "rgba(148, 163, 184, 0.08)",
    border: "1px solid rgba(148, 163, 184, 0.15)",
    borderRadius: "8px",
    color: "#64748b",
    cursor: "not-allowed",
    fontSize: "0.9rem",
    fontWeight: 800,
    padding: "12px 16px",
    whiteSpace: "nowrap",
  },
};

export default KanjiForm;
