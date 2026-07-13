export function stripUsdcQuote(value: string | null | undefined): string {
    return (value ?? "").replace(/\/USDC\b/gi, "").trim();
}
