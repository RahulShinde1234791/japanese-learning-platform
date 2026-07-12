const KANJI_STORAGE_KEY = "japanese-learning-app-kanji";
const KANJI_FAVORITES_KEY = "japanese-learning-app-kanji-favorites";
const VOCABULARY_STORAGE_KEY = "japanese-learning-app-vocabulary";
const VOCABULARY_FAVORITES_KEY = "japanese-learning-app-vocabulary-favorites";

// ─── Kanji ────────────────────────────────────────────────────────────────────

export function loadKanji() {
  try {
    const stored = window.localStorage.getItem(KANJI_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function saveKanji(data) {
  try {
    window.localStorage.setItem(KANJI_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage can fail in private browsing or restricted environments.
  }
}

export function loadKanjiFavorites() {
  try {
    const stored = window.localStorage.getItem(KANJI_FAVORITES_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

export function saveKanjiFavorites(favoritesSet) {
  try {
    window.localStorage.setItem(KANJI_FAVORITES_KEY, JSON.stringify([...favoritesSet]));
  } catch {
    // localStorage can fail in private browsing or restricted environments.
  }
}

// ─── Vocabulary ───────────────────────────────────────────────────────────────

export function loadVocabulary() {
  try {
    const stored = window.localStorage.getItem(VOCABULARY_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function saveVocabulary(data) {
  try {
    window.localStorage.setItem(VOCABULARY_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage can fail in private browsing or restricted environments.
  }
}

export function loadVocabularyFavorites() {
  try {
    const stored = window.localStorage.getItem(VOCABULARY_FAVORITES_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

export function saveVocabularyFavorites(favoritesSet) {
  try {
    window.localStorage.setItem(VOCABULARY_FAVORITES_KEY, JSON.stringify([...favoritesSet]));
  } catch {
    // localStorage can fail in private browsing or restricted environments.
  }
}
