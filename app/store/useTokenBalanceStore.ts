import { create } from "zustand";
import { fetchRektoBalance, fetchUsdcBalance } from "@/app/lib/token-balances";

interface TokenBalanceState {
  walletAddress: string | null;
  usdcBalance: number | null;
  rektoBalance: number | null;
  isLoading: boolean;
  loadBalances: (walletAddress: string, force?: boolean) => Promise<void>;
  clearBalances: () => void;
}

let pendingWallet: string | null = null;
let pendingRequest: Promise<void> | null = null;

export const useTokenBalanceStore = create<TokenBalanceState>((set, get) => ({
  walletAddress: null,
  usdcBalance: null,
  rektoBalance: null,
  isLoading: false,

  loadBalances: async (walletAddress, force = false) => {
    const normalizedWallet = walletAddress.trim();
    if (!normalizedWallet) return;

    const state = get();
    const hasCachedBalances =
      state.walletAddress === normalizedWallet &&
      state.usdcBalance !== null &&
      state.rektoBalance !== null;

    if (!force && hasCachedBalances) return;
    if (pendingRequest && pendingWallet === normalizedWallet) return pendingRequest;

    set({
      walletAddress: normalizedWallet,
      usdcBalance: state.walletAddress === normalizedWallet ? state.usdcBalance : null,
      rektoBalance: state.walletAddress === normalizedWallet ? state.rektoBalance : null,
      isLoading: true,
    });

    pendingWallet = normalizedWallet;
    pendingRequest = (async () => {
      const [usdcResult, rektoResult] = await Promise.allSettled([
        fetchUsdcBalance(normalizedWallet),
        fetchRektoBalance(normalizedWallet),
      ]);

      // Ignore a response from a wallet that was disconnected/replaced mid-request.
      if (get().walletAddress !== normalizedWallet) return;

      set({
        usdcBalance: usdcResult.status === "fulfilled" ? usdcResult.value : 0,
        rektoBalance: rektoResult.status === "fulfilled" ? rektoResult.value : 0,
        isLoading: false,
      });
    })().finally(() => {
      if (pendingWallet === normalizedWallet) {
        pendingWallet = null;
        pendingRequest = null;
      }
    });

    return pendingRequest;
  },

  clearBalances: () => {
    set({
      walletAddress: null,
      usdcBalance: null,
      rektoBalance: null,
      isLoading: false,
    });
  },
}));
