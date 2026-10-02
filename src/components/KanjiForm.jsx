import { useState } from "react";

const emptyForm = {
  kanji: "",
  jlpt: "",
  meaning: "",
  onyomi: "",
  kunyomi: "",
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

function buildKanjiNotes(data) {
  const facts = [
    data.jlpt ? `JLPT N${data.jlpt}` : "",
    data.grade ? `taught in Japanese school grade ${data.grade}` : "",
    data.stroke_count ? `${data.stroke_count} strokes` : "",
    data.freq ? `frequency rank ${data.freq}` : "",
  ].filter(Boolean);
  const source = "Source: kanjiapi.dev";
  return facts.length > 0 ? `${facts.join("; ")}. ${source}` : source;
}

function KanjiForm({ editingEntry, onCancelEdit, onSubmit }) {
  const [formData, setFormData] = useState(editingEntry ?? emptyForm);
  const [loading, setLoading] = useState(false);
  const [quickAddText, setQuickAddText] = useState("");
  const [selectedQuickAddCharacters, setSelectedQuickAddCharacters] = useState(new Set());

  async function handleAutoFill() {
    const kanjiStr = formData.kanji.trim();
    if (!kanjiStr) return;

    setLoading(true);
    try {
      const kanjiChars = [...new Set(Array.from(kanjiStr).filter((c) => kanjiPattern.test(c)))];
      if (kanjiChars.length === 0) throw new Error("No kanji found");

      const kanjiResults = await Promise.all(
        kanjiChars.map(async (char) => {
          const res = await fetch(`https://kanjiapi.dev/v1/kanji/${encodeURIComponent(char)}`);
          if (!res.ok) throw new Error("Kanji not found");
          return res.json();
        }),
      );

      const meanings = kanjiResults
        .map((data) => `${data.kanji}: ${(data.meanings || []).join(", ")}`)
        .join("; ");
      const onyomi = joinUnique(kanjiResults.flatMap((data) => data.on_readings || []));
      const kunyomi = joinUnique(kanjiResults.flatMap((data) => data.kun_readings || []));
      const jlpt = getHardestJlptLevel(kanjiResults);
      const notes = kanjiResults.map((data) => buildKanjiNotes(data)).join(" | ");

      setFormData((prev) => ({
        ...prev,
        jlpt,
        meaning: meanings,
        onyomi,
        kunyomi,
        notes: prev.notes || notes,
      }));
    } catch {
      alert("Kanji not found. Make sure the field contains valid kanji characters.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  const quickAddCharacters = [
    ...new Set(
      Array.from(quickAddText).filter((char) => kanjiPattern.test(char))
    ),
  ];

  function handleQuickAddTextChange(event) {
    const value = event.target.value;
    setQuickAddText(value);

    const characters = [
      ...new Set(
        Array.from(value).filter((char) => kanjiPattern.test(char))
      ),
    ];

    setSelectedQuickAddCharacters((prev) => {
      const next = new Set(
        [...prev].filter((char) => characters.includes(char))
      );
      return next;
    });
  }

  function toggleQuickAddCharacter(char) {
    setSelectedQuickAddCharacters((prev) => {
      const next = new Set(prev);

      if (next.has(char)) {
        next.delete(char);
      } else {
        next.add(char);
      }

      return next;
    });
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

      {!isEditing && (
        <div style={styles.quickAddSection}>
          <div style={styles.quickAddTitle}>Quick Add</div>

          <p style={styles.quickAddDescription}>
            Enter multiple kanji to prepare them for individual lookup.
          </p>

          <input
            type="text"
            value={quickAddText}
            onChange={handleQuickAddTextChange}
            placeholder="e.g. 日本語"
            style={styles.input}
          />

          {quickAddCharacters.length > 0 && (
            <div style={styles.quickAddPreview}>
              <div style={styles.quickAddPreviewLabel}>
                Characters found
              </div>

              <div style={styles.quickAddCharacters}>
                {quickAddCharacters.map((char) => {
                  const isSelected = selectedQuickAddCharacters.has(char);

                  return (
                    <button
                      key={char}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => toggleQuickAddCharacter(char)}
                      style={
                        isSelected
                          ? styles.quickAddCharacterSelected
                          : styles.quickAddCharacter
                      }
                    >
                      {isSelected && <span style={styles.quickAddCheck}>✓</span>}
                      <span>{char}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Kanji + Auto Fill */}
      <label style={styles.label}>
        Kanji
        <div style={styles.inputRow}>
          <input
            required
            maxLength={12}
            name="kanji"
            style={styles.inputNoMargin}
            value={formData.kanji}
            onChange={handleChange}
            placeholder="e.g. 山 or 学習"
          />
          <button
            type="button"
            disabled={loading || !formData.kanji.trim()}
            style={loading || !formData.kanji.trim() ? styles.autoFillDisabled : styles.autoFill}
            onClick={handleAutoFill}
          >
            {loading ? "Loading…" : "Auto Fill"}
          </button>
        </div>
      </label>

      {/* JLPT */}
      <label style={styles.label}>
        JLPT Level
        <select name="jlpt" style={styles.input} value={formData.jlpt ?? ""} onChange={handleChange}>
          <option value="">Unknown</option>
          {jlptOptions.map((level) => (
            <option key={level} value={level}>{level}</option>
          ))}
        </select>
      </label>

      {/* Meaning */}
      <label style={styles.label}>
        Meaning
        <input required name="meaning" style={styles.input} value={formData.meaning} onChange={handleChange} />
      </label>

      {/* Onyomi + Kunyomi */}
      <div style={styles.twoColumns}>
        <label style={styles.label}>
          Onyomi
          <input name="onyomi" style={styles.input} value={formData.onyomi} onChange={handleChange} />
        </label>
        <label style={styles.label}>
          Kunyomi
          <input name="kunyomi" style={styles.input} value={formData.kunyomi} onChange={handleChange} />
        </label>
      </div>

      {/* Notes */}
      <label style={styles.label}>
        Notes
        <textarea name="notes" rows={4} style={styles.textarea} value={formData.notes} onChange={handleChange} />
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
  textarea: { ...fieldBase, minHeight: "100px", resize: "vertical" },
  twoColumns: {
    display: "grid",
    gap: "12px",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
  },
  inputRow: { display: "flex", gap: "10px", marginTop: "8px" },
  primaryButton: {
    background: "linear-gradient(135deg, #0d9488, #2563eb)",
    border: "none",
    borderRadius: "8px",
    color: "white",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: 900,
    marginTop: "4px",
    padding: "13px 18px",
    width: "100%",
    fontFamily: "inherit",
  },
  secondaryButton: {
    background: "rgba(148, 163, 184, 0.14)",
    border: "1px solid rgba(148, 163, 184, 0.24)",
    borderRadius: "8px",
    color: "#e2e8f0",
    cursor: "pointer",
    fontWeight: 800,
    padding: "8px 12px",
    fontFamily: "inherit",
  },
  autoFill: {
    background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
    border: "none",
    borderRadius: "8px",
    color: "white",
    cursor: "pointer",
    fontSize: "0.88rem",
    fontWeight: 800,
    padding: "0 16px",
    whiteSpace: "nowrap",
    flexShrink: 0,
    fontFamily: "inherit",
  },
  autoFillDisabled: {
    background: "rgba(148, 163, 184, 0.08)",
    border: "1px solid rgba(148, 163, 184, 0.15)",
    borderRadius: "8px",
    color: "#64748b",
    cursor: "not-allowed",
    fontSize: "0.88rem",
    fontWeight: 800,
    padding: "0 16px",
    whiteSpace: "nowrap",
    flexShrink: 0,
    fontFamily: "inherit",
  },

  quickAddSection: {
    background: "rgba(30, 41, 59, 0.45)",
    border: "1px solid rgba(249, 168, 212, 0.18)",
    borderRadius: "10px",
    marginBottom: "22px",
    padding: "16px",
  },

  quickAddTitle: {
    color: "#f9a8d4",
    fontSize: "1rem",
    fontWeight: 900,
    marginBottom: "4px",
  },

  quickAddDescription: {
    color: "#94a3b8",
    fontSize: "0.82rem",
    lineHeight: 1.5,
    margin: "0 0 12px",
  },

  quickAddPreview: {
    marginTop: "14px",
  },

  quickAddPreviewLabel: {
    color: "#cbd5e1",
    fontSize: "0.78rem",
    fontWeight: 800,
    marginBottom: "8px",
  },

  quickAddCharacters: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },

  quickAddCharacter: {
    alignItems: "center",
    background: "rgba(236, 72, 153, 0.12)",
    border: "1px solid rgba(249, 168, 212, 0.3)",
    borderRadius: "8px",
    color: "#f9a8d4",
    cursor: "pointer",
    display: "flex",
    fontSize: "1.4rem",
    fontWeight: 900,
    height: "48px",
    justifyContent: "center",
    width: "48px",
  },

  quickAddCharacterSelected: {
    alignItems: "center",
    background: "rgba(236, 72, 153, 0.28)",
    border: "1px solid rgba(249, 168, 212, 0.65)",
    borderRadius: "8px",
    color: "#fbcfe8",
    cursor: "pointer",
    display: "flex",
    fontSize: "1.4rem",
    fontWeight: 900,
    height: "48px",
    justifyContent: "center",
    position: "relative",
    width: "48px",
    fontFamily: "inherit",
    boxShadow: "0 0 16px rgba(236, 72, 153, 0.18)",
  },

  quickAddCheck: {
    alignItems: "center",
    background: "#f9a8d4",
    borderRadius: "50%",
    color: "#4a1942",
    display: "flex",
    fontSize: "0.65rem",
    fontWeight: 900,
    height: "16px",
    justifyContent: "center",
    position: "absolute",
    right: "4px",
    top: "4px",
    width: "16px",
  },
};

export default KanjiForm;