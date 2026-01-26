const STORAGE_KEY = "unionhub_auth";

export function readAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function writeAuth(value) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("unionhub_auth"));
  }
}

export function clearAuth() {
  localStorage.removeItem(STORAGE_KEY);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("unionhub_auth"));
  }
}
