type StorageArea = "local" | "session";

const PREFIX = "pokemon.ui.v2";

function storageFor(area: StorageArea): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return area === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export function loadUiState<T>(key: string, fallback: T, area: StorageArea = "local"): T {
  const storage = storageFor(area);
  if (!storage) return fallback;
  try {
    const raw = storage.getItem(`${PREFIX}.${key}`);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveUiState<T>(key: string, value: T, area: StorageArea = "local"): void {
  const storage = storageFor(area);
  if (!storage) return;
  try {
    storage.setItem(`${PREFIX}.${key}`, JSON.stringify(value));
  } catch {
    // no-op for storage quota or availability failures
  }
}
