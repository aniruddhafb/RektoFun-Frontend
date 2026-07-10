const DICEBEAR_AVATAAARS_BASE_URL = "https://api.dicebear.com/10.x/avataaars/svg";

export function createDiceBearSeed() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  }

  return Math.random().toString(36).slice(2, 14);
}

export function getDiceBearAvatarUrl(seed = createDiceBearSeed()) {
  return `${DICEBEAR_AVATAAARS_BASE_URL}?seed=${encodeURIComponent(seed)}`;
}
