const KANJI_STORAGE_KEY = "japanese-learning-app-kanji";
const FAVORITES_STORAGE_KEY = "japanese-learning-app-favorites";

export function loadKanji() {
  try {
    const storedKanji = window.localStorage.getItem(KANJI_STORAGE_KEY);
    return storedKanji ? JSON.parse(storedKanji) : null;
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

export function loadFavorites() {
  try {
    const stored = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

export function saveFavorites(favoritesSet) {
  try {
    window.localStorage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify([...favoritesSet]),
    );
  } catch {
    // localStorage can fail in private browsing or restricted environments.
  }
}
