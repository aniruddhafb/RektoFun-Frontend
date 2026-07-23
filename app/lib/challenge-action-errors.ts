export type ChallengeAction = "create" | "join";
export type ChallengeActionStage = "validation" | "prepare" | "sign" | "submit" | "confirm" | "save";

const ACTION_LABEL: Record<ChallengeAction, string> = {
  create: "create the challenge",
  join: "join the challenge",
};

function supportCode(action: ChallengeAction): string {
  const prefix = action === "create" ? "CRT" : "JON";
  return `${prefix}-${Date.now().toString(36).slice(-6).toUpperCase()}`;
}

function rawErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message ?? "");
  }
  return "";
}

function withSupport(message: string, action: ChallengeAction): string {
  return `${message} If this keeps happening, contact support with code ${supportCode(action)}.`;
}

/** Convert wallet, API, RPC and on-chain failures into safe, actionable UI copy. */
export function getChallengeActionError(
  error: unknown,
  action: ChallengeAction,
  stage: ChallengeActionStage,
): string {
  const raw = rawErrorMessage(error).trim();
  const text = raw.toLowerCase();

  if (/user (rejected|denied)|rejected the request|declined|cancelled by user/.test(text)) {
    return "The wallet request was cancelled. Open your wallet and approve it when you’re ready.";
  }
  if (text.includes("wallet") && (text.includes("not ready") || text.includes("not connected"))) {
    return "Your wallet is not ready. Reconnect it, then try again.";
  }
  if (/insufficient funds|not enough balance|insufficient token|custom program error: 0x1\b/.test(text)) {
    return "Your wallet does not have enough USDC for this stake. Deposit USDC or enter a smaller amount.";
  }
  if (text.includes("already joined") || text.includes("already accepted")) {
    return "You have already joined this challenge, or another participant accepted it first.";
  }
  if (text.includes("team full") || text.includes("teamfull")) {
    return "That team is full. Choose the other side or join another challenge.";
  }
  if (text.includes("expired") || text.includes("block height exceeded")) {
    return stage === "confirm"
      ? "The transaction expired before the network confirmed it. Please try again."
      : "This challenge’s join window has expired.";
  }
  if (text.includes("not open") || text.includes("notopen")) {
    return "This challenge is no longer open for new participants.";
  }
  if (text.includes("own challenge") || text.includes("cannotacceptownchallenge")) {
    return "You cannot join your own challenge.";
  }
  if (/not available to you|not allowed|another user|invitation/.test(text)) {
    return "This direct challenge is only available to the invited user, or the invitation is no longer pending.";
  }
  if (text.includes("bet too small") || text.includes("bettoosmall")) {
    return "The stake is below the amount currently required for this challenge. Refresh and enter the updated minimum.";
  }
  if (text.includes("account not found") || text.includes("no on-chain reference")) {
    return "The on-chain challenge account could not be found. It may have been cancelled or settled.";
  }

  // These server responses are already safe and useful to the user.
  if (/similar challenge|exact challenge|maintenance|temporarily locked|current market price|target must|target price/.test(text)) {
    return raw;
  }
  if (/failed to fetch|network|rpc|429|timeout|timed out|503|502|availability/.test(text)) {
    return withSupport("The network service is temporarily unavailable. Check your connection and try again.", action);
  }
  if (/transaction simulation failed|transaction failed|custom program error|failed to send transaction/.test(text)) {
    return withSupport("The Solana transaction was rejected. Refresh and check your USDC balance before retrying.", action);
  }
  if (stage === "sign") {
    return withSupport("Your wallet could not sign the transaction. Reconnect or try a different supported wallet.", action);
  }
  if (stage === "prepare") {
    return withSupport(`We could not prepare the transaction to ${ACTION_LABEL[action]}. Please try again.`, action);
  }
  if (stage === "save") {
    return withSupport(
      action === "create"
        ? "The on-chain transaction succeeded, but the challenge could not be saved to your profile."
        : "Your on-chain entry succeeded, but the participation record could not be saved.",
      action,
    );
  }
  return withSupport(`We could not ${ACTION_LABEL[action]} due to an unexpected error. Please try again.`, action);
}
