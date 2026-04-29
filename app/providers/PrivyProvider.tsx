'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { createSolanaRpc, createSolanaRpcSubscriptions } from '@solana/kit';

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <PrivyProvider
            appId={process.env.NEXT_PUBLIC_appId || ""}
            clientId={process.env.NEXT_PUBLIC_clientId || ""}
            config={{
                appearance: { walletChainType: 'ethereum-and-solana' },
                loginMethods: ['google', 'twitter', 'wallet', 'email'],

                // Create embedded wallets for users who don't have a wallet
                embeddedWallets: {
                    ethereum: {
                        createOnLogin: 'users-without-wallets'
                    },
                    solana: {
                        createOnLogin: 'users-without-wallets'
                    }
                },
                // Configure Solana devnet as the default network
                solana: {
                    rpcs: {
                        'solana:devnet': {
                            rpc: createSolanaRpc('https://api.devnet.solana.com'),
                            rpcSubscriptions: createSolanaRpcSubscriptions('wss://api.devnet.solana.com'),
                        },
                    },
                },
            }}
        >
            {children}
        </PrivyProvider>
    );
}