"use client";

/**
 * Simulated Solana wallet connection.
 * Generates a plausible address, persists it in localStorage, and exposes
 * connect / disconnect with a short "connecting…" delay so it feels real.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { LS } from "@/lib/constants";
import { fakeSolAddress, store } from "@/lib/utils";
import { fireConfetti } from "@/lib/confetti";

interface WalletState {
  address: string | null;
  connecting: boolean;
  connect: () => void;
  disconnect: () => void;
}

const WalletContext = createContext<WalletState>({
  address: null,
  connecting: false,
  connect: () => {},
  disconnect: () => {},
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  // Restore a previously "connected" wallet.
  useEffect(() => {
    setAddress(store.get<string | null>(LS.wallet, null));
  }, []);

  const connect = useCallback(() => {
    if (connecting) return;
    setConnecting(true);
    // Simulate the wallet-extension approval round-trip.
    setTimeout(() => {
      const addr = fakeSolAddress();
      store.set(LS.wallet, addr);
      setAddress(addr);
      setConnecting(false);
      fireConfetti({ count: 80 });
    }, 900);
  }, [connecting]);

  const disconnect = useCallback(() => {
    store.remove(LS.wallet);
    setAddress(null);
  }, []);

  return (
    <WalletContext.Provider value={{ address, connecting, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
