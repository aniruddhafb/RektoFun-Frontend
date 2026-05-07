export const BLOCKED_TERMS = [
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "bastard",
  "dick",
  "pussy",
  "cunt",
  "slut",
  "whore",
  "motherfucker",
  "nigger",
  "nigga",
  "faggot",
  "retard",
  "chutiya",
  "madarchod",
  "bhenchod",
  "bc",
  "mc",
  "randi",
  "harami",
  "kutta",
  "kamine",
];

const LEET_CHAR_MAP: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "@": "a",
  "$": "s",
  "!": "i",
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeForModeration = (value: string) => {
  const leetNormalized = value
    .toLowerCase()
    .replace(/[013457@$!]/g, (char) => LEET_CHAR_MAP[char] || char);

  return leetNormalized.replace(/[^a-z]/g, "");
};

export function getBlockedTerm(value: string): string | null {
  if (!value.trim()) return null;

  const lowered = value.toLowerCase();
  const normalized = normalizeForModeration(value);

  for (const term of BLOCKED_TERMS) {
    if (normalized.includes(term)) {
      return term;
    }

    const directMatch = new RegExp(`\\b${escapeRegex(term)}\\b`, "i");
    if (directMatch.test(lowered)) {
      return term;
    }
  }

  return null;
}

export function hasBlockedContent(value: string): boolean {
  return getBlockedTerm(value) !== null;
}

export function blockedContentError(fieldLabel: string): string {
  return `${fieldLabel} contains inappropriate language. Please remove abusive words and try again.`;
}
