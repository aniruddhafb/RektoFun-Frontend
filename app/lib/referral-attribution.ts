const REFERRAL_STORAGE_KEY = "rektofun:pending-referral-code";

function normalizeReferralCode(value: string | null): string | null {
  const normalized = value?.trim().toUpperCase() || "";

  // Referral codes are generated from uppercase letters and numbers. Keep a
  // reasonable length limit so arbitrary query-string content is not stored.
  if (!/^[A-Z0-9]{1,64}$/.test(normalized)) return null;

  return normalized;
}

export function savePendingReferralCode(value: string | null): string | null {
  const referralCode = normalizeReferralCode(value);
  if (!referralCode || typeof window === "undefined") return null;

  try {
    window.localStorage.setItem(REFERRAL_STORAGE_KEY, referralCode);
  } catch (error) {
    console.warn("[Referral] Could not persist the referral code:", error);
  }

  return referralCode;
}

export function captureReferralCodeFromUrl(): string | null {
  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);
  return savePendingReferralCode(params.get("ref"));
}

export function getPendingReferralCode(): string | null {
  if (typeof window === "undefined") return null;

  // Reading the URL first also covers a user who connects their wallet before
  // the global referral-capture effect has run.
  const referralCodeFromUrl = captureReferralCodeFromUrl();
  if (referralCodeFromUrl) return referralCodeFromUrl;

  try {
    return normalizeReferralCode(
      window.localStorage.getItem(REFERRAL_STORAGE_KEY)
    );
  } catch (error) {
    console.warn("[Referral] Could not read the saved referral code:", error);
    return null;
  }
}

export function clearPendingReferralCode() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(REFERRAL_STORAGE_KEY);
  } catch (error) {
    console.warn("[Referral] Could not clear the saved referral code:", error);
  }
}
