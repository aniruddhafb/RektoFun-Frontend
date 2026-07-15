export const ADMIN_WALLET = "mo3uv8Ai9FJEB4TEfFmj8H5SAh2SArr4tgcqNz9K41n";

export function isAdminWallet(address?: string | null): boolean {
  return address === ADMIN_WALLET;
}
