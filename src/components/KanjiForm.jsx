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

function KanjiForm({ editingEntry, onCancelEdit, onSubmit, onUseAsVocabulary, quickAddText, onQuickAddTextChange, selectedQuickAddCharacters,
  onSelectedQuickAddCharactersChange, onAddSelectedKanji,}) {
  const [formData, setFormData] = useState(editingEntry ?? emptyForm);
  const [loading, setLoading] = useState(false);
  const [quickLookupResults, setQuickLookupResults] = useState([]);
  const [quickLookupLoading, setQuickLookupLoading] = useState(false);
  const [selectedQuickLookupCharacters, setSelectedQuickLookupCharacters] = useState(new Set());

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

      setFormData((prev) => ({
        ...prev,
        jlpt,
        meaning: meanings,
        onyomi,
        kunyomi,
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

  const selectedQuickAddWord = quickAddCharacters
    .filter((char) => selectedQuickAddCharacters.has(char))
    .join("");

  function handleQuickAddTextChange(event) {
    const value = event.target.value;
    onQuickAddTextChange(value);
    setQuickLookupResults([]);
    setSelectedQuickLookupCharacters(new Set());

    const characters = [
      ...new Set(
        Array.from(value).filter((char) => kanjiPattern.test(char))
      ),
    ];

    onSelectedQuickAddCharactersChange((prev) => {
      const next = new Set(
        [...prev].filter((char) => characters.includes(char))
      );
      return next;
    });
  }

  function toggleQuickAddCharacter(char) {
    setQuickLookupResults([]);
    
    onSelectedQuickAddCharactersChange((prev) => {
      const next = new Set(prev);

      if (next.has(char)) {
        next.delete(char);
      } else {
        next.add(char);
      }

      return next;
    });
  }

  function toggleQuickLookupCharacter(char) {
    setSelectedQuickLookupCharacters((prev) => {
      const next = new Set(prev);

      if (next.has(char)) {
        next.delete(char);
      } else {
        next.add(char);
      }

      return next;
    });
  }

  async function handleQuickLookup() {
    if (selectedQuickAddCharacters.size === 0) return;

    setSelectedQuickLookupCharacters(new Set());
    setQuickLookupLoading(true);

    const results = await Promise.all(
      [...selectedQuickAddCharacters].map(async (char) => {
        try {
          const res = await fetch(
            `https://kanjiapi.dev/v1/kanji/${encodeURIComponent(char)}`
          );

          if (!res.ok) {
            throw new Error("Kanji not found");
          }

          const data = await res.json();

          return {
            char,
            success: true,
            meaning: (data.meanings || []).join(", "),
            onyomi: (data.on_readings || []).join(", "),
            kunyomi: (data.kun_readings || []).join(", "),
            jlpt: data.jlpt ? `N${data.jlpt}` : "",
          };
        } catch {
          return {
            char,
            success: false,
            error: "Lookup failed",
          };
        }
      })
    );

    setQuickLookupResults(results);
    setQuickLookupLoading(false);
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

                {selectedQuickAddCharacters.size >= 2 && selectedQuickAddWord && (
                  <div style={{ marginTop: "12px" }}>
                    <div style={{ color: "#e2e8f0", fontSize: "0.9rem" }}>
                      Selected word: <strong>{selectedQuickAddWord}</strong>
                    </div>

                    <button
                      type="button"
                      onClick={() => onUseAsVocabulary(selectedQuickAddWord)}
                      style={styles.useAsVocabularyButton}
                    >
                      Use as Vocabulary
                    </button>
                  </div>
                )}

                {quickAddCharacters.length > 0 && (
                  <button
                    type="button"
                    disabled={selectedQuickAddCharacters.size === 0 || quickLookupLoading}
                    onClick={handleQuickLookup}
                    style={
                      selectedQuickAddCharacters.size === 0 || quickLookupLoading
                        ? styles.quickLookupDisabled
                        : styles.quickLookupButton
                    }
                  >
                    {quickLookupLoading ? "Looking up…" : "Look Up Selected"}
                  </button>
                )}

                {quickLookupResults.length > 0 && (
                  <div style={styles.quickLookupResults}>
                    {quickLookupResults.map((result) => (
                      <button
                        key={result.char}
                        type="button"
                        onClick={() => toggleQuickLookupCharacter(result.char)}
                        style={
                          selectedQuickLookupCharacters.has(result.char)
                            ? styles.quickLookupRowSelected
                            : styles.quickLookupRow
                        }
                      >
                        <div style={styles.quickLookupKanji}>
                          {result.char}

                          {selectedQuickLookupCharacters.has(result.char) && (
                            <span style={styles.quickLookupCheck}>✓</span>
                          )}
                        </div>
                        {result.success ? (
                          <>
                            <div style={styles.quickLookupMeaning}>
                              {result.meaning || "No meaning available"}
                            </div>

                            <div style={styles.quickLookupReading}>
                              {result.onyomi || result.kunyomi || "No reading"}
                            </div>

                            <div style={styles.quickLookupJlpt}>
                              {result.jlpt || "—"}
                            </div>
                          </>
                        ) : (
                          <div style={styles.quickLookupError}>
                            {result.error}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                {selectedQuickLookupCharacters.size > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      onAddSelectedKanji(
                        quickLookupResults.filter((result) =>
                          selectedQuickLookupCharacters.has(result.char),
                        ),
                      );
                      setSelectedQuickLookupCharacters(new Set());
                    }}
                    style={styles.addSelectedKanjiButton}
                  >
                    Add Selected to Collection
                  </button>
                )}
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

  quickLookupButton: {
    background: "linear-gradient(135deg, #ec4899, #8b5cf6)",
    border: "none",
    borderRadius: "8px",
    color: "white",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "0.9rem",
    fontWeight: 900,
    marginTop: "14px",
    padding: "10px 16px",
    width: "100%",
  },

  addSelectedKanjiButton: {
    background: "rgba(16, 185, 129, 0.18)",
    border: "1px solid rgba(110, 231, 183, 0.4)",
    borderRadius: "8px",
    color: "#a7f3d0",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "0.9rem",
    fontWeight: 900,
    marginTop: "10px",
    padding: "10px 16px",
    width: "100%",
  },

  quickLookupDisabled: {
    background: "rgba(148, 163, 184, 0.08)",
    border: "1px solid rgba(148, 163, 184, 0.15)",
    borderRadius: "8px",
    color: "#64748b",
    cursor: "not-allowed",
    fontFamily: "inherit",
    fontSize: "0.9rem",
    fontWeight: 900,
    marginTop: "14px",
    padding: "10px 16px",
    width: "100%",
  },

  quickLookupResults: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    marginTop: "14px",
  },

  quickLookupRow: {
    alignItems: "center",
    background: "rgba(15, 23, 42, 0.65)",
    border: "1px solid rgba(148, 163, 184, 0.16)",
    borderRadius: "8px",
    display: "grid",
    gap: "10px",
    gridTemplateColumns: "42px minmax(120px, 1fr) minmax(100px, 0.8fr) 42px",
    padding: "8px 10px",
    textAlign: "left",
    justifyItems: "start",
    cursor: "pointer",
  },

  quickLookupRowSelected: {
    alignItems: "center",
    background: "rgba(236, 72, 153, 0.18)",
    border: "1px solid rgba(249, 168, 212, 0.55)",
    borderRadius: "8px",
    color: "inherit",
    cursor: "pointer",
    display: "grid",
    gap: "10px",
    gridTemplateColumns: "42px minmax(120px, 1fr) minmax(100px, 0.8fr) 42px",
    padding: "8px 10px",
    textAlign: "left",
    justifyItems: "start",
    width: "100%",
  },

  quickLookupKanji: {
    color: "#f9a8d4",
    fontSize: "1.35rem",
    fontWeight: 900,
    position: "relative",
    textAlign: "center",
  },

  quickLookupCheck: {
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
    right: "-4px",
    top: "-4px",
    width: "16px",
  },

  quickLookupMeaning: {
    color: "#e2e8f0",
    fontSize: "0.88rem",
    fontWeight: 700,
  },

  quickLookupReading: {
    color: "#94a3b8",
    fontSize: "0.82rem",
  },

  quickLookupJlpt: {
    color: "#6ee7b7",
    fontSize: "0.78rem",
    fontWeight: 900,
    textAlign: "center",
  },

  quickLookupError: {
    color: "#fca5a5",
    fontSize: "0.82rem",
    fontWeight: 700,
    gridColumn: "2 / -1",
  },

  useAsVocabularyButton: {
    background: "rgba(139, 92, 246, 0.2)",
    border: "1px solid rgba(167, 139, 250, 0.45)",
    borderRadius: "8px",
    color: "#ddd6fe",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "0.85rem",
    fontWeight: 800,
    marginTop: "10px",
    padding: "9px 14px",
  },
};

export default KanjiForm;