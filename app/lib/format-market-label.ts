export function stripUsdcQuote(value: string | null | undefined): string {
    // Display the base asset for the quote currencies supported by the UI.
    // This only formats labels; the complete pair remains unchanged for chart
    // requests, challenge storage, and settlement.
    return (value ?? "").replace(/\/(?:USDC|USDT|BTC)\b/gi, "").trim();
}
