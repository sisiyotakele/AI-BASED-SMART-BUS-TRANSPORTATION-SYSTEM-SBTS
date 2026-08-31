// src/features/driver/utils/storage.ts

export const storage = {
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        return JSON.parse(saved);
      }
      return defaultValue;
    } catch {
      return defaultValue;
    }
  },
  
  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to save ${key}:`, error);
    }
  },
  
  remove: (key: string): void => {
    localStorage.removeItem(key);
  },
  
  update: <T>(key: string, updater: (prev: T) => T, defaultValue: T): T => {
    const current = storage.get<T>(key, defaultValue);
    const updated = updater(current);
    storage.set(key, updated);
    return updated;
  },
};