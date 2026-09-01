const STORAGE_KEY = "tarinamaailma.world-state";

/**
 * Eristää tallennustavan muusta sovelluksesta, jotta se voidaan vaihtaa myöhemmin.
 */
export function createStorage(storage = globalThis.localStorage) {
  return {
    load() {
      const value = storage.getItem(STORAGE_KEY);
      return value ? JSON.parse(value) : null;
    },

    save(worldState) {
      storage.setItem(STORAGE_KEY, JSON.stringify(worldState));
    },

    clear() {
      storage.removeItem(STORAGE_KEY);
    },
  };
}
