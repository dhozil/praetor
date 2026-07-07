import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Multi-wallet connect using the EIP-6963 discovery standard.
 * Detects MetaMask, Rabby, Coinbase Wallet, Brave, Trust, Frame,
 * OKX, Rainbow, Zerion — any EVM injected wallet that follows the spec.
 * Falls back to `window.ethereum` for older wallets.
 */

export type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

export type WalletInfo = {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
  provider: Eip1193Provider;
};

type WalletCtx = {
  wallets: WalletInfo[];
  connected: WalletInfo | null;
  account: string | null;
  chainId: string | null;
  isConnecting: boolean;
  error: string | null;
  connect: (wallet: WalletInfo) => Promise<void>;
  disconnect: () => void;
};

const Ctx = createContext<WalletCtx | null>(null);

export function useWallet() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWallet must be used inside <WalletProvider>");
  return ctx;
}

const LS_KEY = "praetor:last-wallet-rdns";

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [connected, setConnected] = useState<WalletInfo | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // EIP-6963 discovery
  useEffect(() => {
    if (typeof window === "undefined") return;

    const onAnnounce = (event: Event) => {
      const detail = (event as CustomEvent).detail as {
        info: { uuid: string; name: string; icon: string; rdns: string };
        provider: Eip1193Provider;
      };
      if (!detail?.info || !detail?.provider) return;
      setWallets((prev) => {
        if (prev.some((w) => w.uuid === detail.info.uuid)) return prev;
        return [...prev, { ...detail.info, provider: detail.provider }];
      });
    };

    window.addEventListener("eip6963:announceProvider", onAnnounce as EventListener);
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    return () => {
      window.removeEventListener("eip6963:announceProvider", onAnnounce as EventListener);
    };
  }, []);

  // Fallback to window.ethereum if no 6963 wallets after a tick
  useEffect(() => {
    if (typeof window === "undefined") return;
    const t = setTimeout(() => {
      const eth = (window as unknown as { ethereum?: Eip1193Provider }).ethereum;
      if (eth && wallets.length === 0) {
        setWallets([
          {
            uuid: "legacy-injected",
            name: "Browser Wallet",
            icon:
              "data:image/svg+xml;utf8," +
              encodeURIComponent(
                `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'><path d='M21 12V7H5a2 2 0 0 1 0-4h14v4'/><path d='M3 5v14a2 2 0 0 0 2 2h16v-5'/><path d='M18 12a2 2 0 0 0 0 4h4v-4Z'/></svg>`,
              ),
            rdns: "legacy",
            provider: eth,
          },
        ]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [wallets.length]);

  const handleAccountsChanged = useCallback((accounts: string[]) => {
    if (!accounts || accounts.length === 0) {
      setAccount(null);
      setConnected(null);
      try { localStorage.removeItem(LS_KEY); } catch { /* noop */ }
    } else {
      setAccount(accounts[0]);
    }
  }, []);

  const handleChainChanged = useCallback((cid: string) => setChainId(cid), []);

  const BRADBURY_CHAIN_ID = "0x107d";

  const switchToBradbury = useCallback(async (provider: Eip1193Provider) => {
    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: BRADBURY_CHAIN_ID }],
      });
    } catch (err: unknown) {
      const error = err as { code?: number };
      if (error.code === 4902) {
        await provider.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: BRADBURY_CHAIN_ID,
              chainName: "GenLayer Bradbury",
              rpcUrls: ["https://rpc-bradbury.genlayer.com"],
              nativeCurrency: { name: "GEN Token", symbol: "GEN", decimals: 18 },
              blockExplorerUrls: ["https://explorer-bradbury.genlayer.com"],
            },
          ],
        });
      }
    }
  }, []);

  const connect = useCallback(
    async (wallet: WalletInfo) => {
      setError(null);
      setIsConnecting(true);
      try {
        const accounts = (await wallet.provider.request({
          method: "eth_requestAccounts",
        })) as string[];
        const cid = (await wallet.provider.request({ method: "eth_chainId" })) as string;

        if (cid !== BRADBURY_CHAIN_ID) {
          await switchToBradbury(wallet.provider);
        }

        const finalChainId = (await wallet.provider.request({ method: "eth_chainId" })) as string;

        setConnected(wallet);
        setAccount(accounts[0] ?? null);
        setChainId(finalChainId);
        try { localStorage.setItem(LS_KEY, wallet.rdns); } catch { /* noop */ }

        wallet.provider.on?.("accountsChanged", handleAccountsChanged as (...a: unknown[]) => void);
        wallet.provider.on?.("chainChanged", handleChainChanged as (...a: unknown[]) => void);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Connection rejected";
        setError(msg);
      } finally {
        setIsConnecting(false);
      }
    },
    [handleAccountsChanged, handleChainChanged, switchToBradbury],
  );

  const disconnect = useCallback(() => {
    if (connected) {
      connected.provider.removeListener?.(
        "accountsChanged",
        handleAccountsChanged as (...a: unknown[]) => void,
      );
      connected.provider.removeListener?.(
        "chainChanged",
        handleChainChanged as (...a: unknown[]) => void,
      );
    }
    setConnected(null);
    setAccount(null);
    setChainId(null);
    try { localStorage.removeItem(LS_KEY); } catch { /* noop */ }
  }, [connected, handleAccountsChanged, handleChainChanged]);

  const value = useMemo<WalletCtx>(
    () => ({ wallets, connected, account, chainId, isConnecting, error, connect, disconnect }),
    [wallets, connected, account, chainId, isConnecting, error, connect, disconnect],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function shortAddr(addr: string | null | undefined) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
