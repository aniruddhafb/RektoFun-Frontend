const DICEBEAR_STYLES = ["avataaars", "dylan"] as const;

function getRandomDiceBearStyle() {
  return DICEBEAR_STYLES[Math.floor(Math.random() * DICEBEAR_STYLES.length)];
}

export function createDiceBearSeed() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  }

  return Math.random().toString(36).slice(2, 14);
}

export function getDiceBearAvatarUrl(seed = createDiceBearSeed()) {
  const style = getRandomDiceBearStyle();
  return `https://api.dicebear.com/10.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
}
