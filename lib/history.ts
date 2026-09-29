// The backend is single-turn, so each entry is an independent question and answer
export type Entry = {
  id: string;
  question: string;
  answer: string;
  error?: boolean;
  stopped?: boolean;
};

const STORAGE_KEY = "proust-app:history";

// Storage can be unavailable (private mode, blocked site data), so failures fall back to no history
export function loadHistory(): Entry[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveHistory(entries: Entry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // History just won't survive a reload
  }
}
