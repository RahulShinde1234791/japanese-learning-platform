import { useState } from "react";

const emptyForm = {
  kanji: "",
  meaning: "",
  onyomi: "",
  kunyomi: "",
  example: "",
  notes: "",
};

function KanjiForm({ editingEntry, onCancelEdit, onSubmit }) {
  const [formData, setFormData] = useState(editingEntry ?? emptyForm);

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
        <input
          required
          maxLength={4}
          name="kanji"
          style={styles.input}
          value={formData.kanji}
          onChange={handleChange}
        />
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
    borderRadius: "8px",
    boxShadow: "0 18px 36px rgba(0, 0, 0, 0.28)",
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
};

export default KanjiForm;
