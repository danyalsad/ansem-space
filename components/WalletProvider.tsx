"use client";

/**
 * Real Solana wallet connection via @solana/wallet-adapter.
 * Supports Phantom, Solflare, and any Wallet-Standard wallet (auto-detected).
 *
 * The rest of the app consumes the same minimal facade as before —
 * useWallet() → { address, connecting, connect, disconnect } — so swapping
 * from the old simulated wallet required no changes elsewhere.
 */

import { useMemo, type ReactNode } from "react";
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
  useWallet as useSolanaWallet,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider, useWalletModal } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";

// Public mainnet RPC — we only need it for connection context, not queries.
const ENDPOINT = "https://api.mainnet-beta.solana.com";

export function WalletProvider({ children }: { children: ReactNode }) {
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  return (
    <ConnectionProvider endpoint={ENDPOINT}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}

/** App-facing facade over the wallet adapter. */
export function useWallet() {
  const { publicKey, connecting, disconnect } = useSolanaWallet();
  const { setVisible } = useWalletModal();

  return {
    address: publicKey ? publicKey.toBase58() : null,
    connecting,
    connect: () => setVisible(true),
    disconnect: () => {
      void disconnect();
    },
  };
}
