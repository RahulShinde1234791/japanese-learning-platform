import { useState } from "react";

const emptyForm = {
  word: "",
  reading: "",
  meaning: "",
  partOfSpeech: "",
  exampleSentence: "",
  notes: "",
};

async function fetchJisho(word) {
  const res = await fetch(
    `/api/jisho/search/words?keyword=${encodeURIComponent(word)}`,
  );
  if (!res.ok) throw new Error("Jisho request failed");
  const data = await res.json();
  return data.data || [];
}

function VocabularyForm({ editingEntry, onCancelEdit, onSubmit, prefilledWord }) {
  const [formData, setFormData] = useState(() => ({
    ...(editingEntry ?? emptyForm),
    word: editingEntry?.word ?? prefilledWord ?? "",
  }));
  const [loading, setLoading] = useState(false);

  async function handleAutoFill() {
    const word = formData.word.trim();
    if (!word) return;

    setLoading(true);
    try {
      const results = await fetchJisho(word);
      if (results.length === 0) throw new Error("No results");

      // Prefer an exact match, fall back to first result
      const entry =
        results.find((r) =>
          r.japanese?.some(
            (j) => j.word === word || j.reading === word,
          ),
        ) ?? results[0];

      const japanese = entry.japanese?.find((j) => j.word === word) ?? entry.japanese?.[0] ?? {};
      const sense = entry.senses?.[0] ?? {};
      const reading = japanese.reading || "";
      const meaning = (sense.english_definitions || []).join(", ");
      const partOfSpeech = (sense.parts_of_speech || []).join(", ");

      setFormData((prev) => ({
        ...prev,
        reading: reading || prev.reading,
        meaning: meaning || prev.meaning,
        partOfSpeech: partOfSpeech || prev.partOfSpeech,
      }));
    } catch {
      alert("No data found for this word. Try a different spelling.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(formData);
    setFormData(emptyForm);
  }

  const isEditing = Boolean(editingEntry);

  return (
    <form style={styles.form} onSubmit={handleSubmit}>
      <div style={styles.formHeader}>
        <h2 style={styles.formTitle}>{isEditing ? "Edit Word" : "Add Word"}</h2>
        {isEditing && (
          <button type="button" style={styles.secondaryBtn} onClick={onCancelEdit}>
            Cancel
          </button>
        )}
      </div>

      {/* Word + Auto Fill */}
      <label style={styles.label}>
        Word
        <div style={styles.inputRow}>
          <input
            required
            name="word"
            style={styles.inputNoMargin}
            value={formData.word}
            onChange={handleChange}
            placeholder="e.g. 食べる"
          />
          <button
            type="button"
            disabled={loading || !formData.word.trim()}
            style={loading || !formData.word.trim() ? styles.autoFillDisabled : styles.autoFill}
            onClick={handleAutoFill}
          >
            {loading ? "Loading…" : "Auto Fill"}
          </button>
        </div>
      </label>

      {/* Reading */}
      <label style={styles.label}>
        Reading (Furigana)
        <input
          name="reading"
          style={styles.input}
          value={formData.reading}
          onChange={handleChange}
          placeholder="e.g. たべる"
        />
      </label>

      {/* Meaning */}
      <label style={styles.label}>
        Meaning
        <input
          required
          name="meaning"
          style={styles.input}
          value={formData.meaning}
          onChange={handleChange}
          placeholder="e.g. to eat"
        />
      </label>

      {/* Part of Speech */}
      <label style={styles.label}>
        Part of Speech
        <input
          name="partOfSpeech"
          style={styles.input}
          value={formData.partOfSpeech}
          onChange={handleChange}
          placeholder="e.g. Noun, Ichidan verb"
        />
      </label>

      {/* Example Sentence */}
      <label style={styles.label}>
        Example Sentence
        <textarea
          name="exampleSentence"
          rows={3}
          style={styles.textarea}
          value={formData.exampleSentence}
          onChange={handleChange}
          placeholder="e.g. 寿司を食べます。"
        />
      </label>

      {/* Notes */}
      <label style={styles.label}>
        Notes
        <textarea
          name="notes"
          rows={3}
          style={styles.textarea}
          value={formData.notes}
          onChange={handleChange}
          placeholder="Grammar notes, context, memory tips…"
        />
      </label>

      <button type="submit" style={styles.primaryBtn}>
        {isEditing ? "Save Changes" : "Add Word"}
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
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
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
    fontFamily: "inherit",
  },
  label: {
    color: "#cbd5e1",
    display: "block",
    fontSize: "0.9rem",
    fontWeight: 800,
    marginBottom: "14px",
  },
  input: fieldBase,
  inputNoMargin: { ...fieldBase, marginTop: 0 },
  textarea: { ...fieldBase, resize: "vertical" },
  inputRow: { display: "flex", gap: "10px", marginTop: "8px" },
  primaryBtn: {
    background: "linear-gradient(135deg, #7c3aed, #2563eb)",
    border: "none",
    borderRadius: "8px",
    color: "white",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "1rem",
    fontWeight: 900,
    marginTop: "4px",
    padding: "13px 18px",
    width: "100%",
  },
  secondaryBtn: {
    background: "rgba(148, 163, 184, 0.14)",
    border: "1px solid rgba(148, 163, 184, 0.24)",
    borderRadius: "8px",
    color: "#e2e8f0",
    cursor: "pointer",
    fontFamily: "inherit",
    fontWeight: 800,
    padding: "8px 12px",
  },
  autoFill: {
    background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
    border: "none",
    borderRadius: "8px",
    color: "white",
    cursor: "pointer",
    flexShrink: 0,
    fontFamily: "inherit",
    fontSize: "0.88rem",
    fontWeight: 800,
    padding: "0 16px",
    whiteSpace: "nowrap",
  },
  autoFillDisabled: {
    background: "rgba(148, 163, 184, 0.08)",
    border: "1px solid rgba(148, 163, 184, 0.15)",
    borderRadius: "8px",
    color: "#64748b",
    cursor: "not-allowed",
    flexShrink: 0,
    fontFamily: "inherit",
    fontSize: "0.88rem",
    fontWeight: 800,
    padding: "0 16px",
    whiteSpace: "nowrap",
  },
};

export default VocabularyForm;
