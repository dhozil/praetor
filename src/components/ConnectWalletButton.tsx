import { useState } from "react";
import { Wallet, LogOut, Copy, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useWallet, shortAddr, type WalletInfo } from "@/lib/wallet";

export function ConnectWalletButton({
  variant = "gold",
}: {
  variant?: "gold" | "ghost";
}) {
  const { wallets, connected, account, isConnecting, error, connect, disconnect } = useWallet();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const onSelect = async (w: WalletInfo) => {
    await connect(w);
    setOpen(false);
  };

  const copyAddr = async () => {
    if (!account) return;
    try {
      await navigator.clipboard.writeText(account);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch { /* noop */ }
  };

  const base =
    variant === "gold"
      ? "btn-gold rounded-full px-5 py-2 text-sm font-medium hover:[&]:btn-gold-hover"
      : "btn-ghost-gold rounded-full px-5 py-2 text-sm font-medium hover:bg-gold/10";

  if (connected && account) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={copyAddr}
          className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-4 py-2 text-sm text-foreground transition-colors hover:bg-gold/10"
          title={account}
        >
          <img src={connected.icon} alt="" width={16} height={16} className="rounded" />
          <span className="font-mono">{shortAddr(account)}</span>
          {copied ? <Check className="h-3.5 w-3.5 text-gold-soft" /> : <Copy className="h-3.5 w-3.5 opacity-60" />}
        </button>
        <button
          onClick={disconnect}
          className="inline-flex items-center justify-center rounded-full border border-gold/20 p-2 text-muted-foreground hover:text-foreground"
          aria-label="Disconnect wallet"
          title="Disconnect"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className={base}>
        <span className="inline-flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          Connect Wallet
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-card border-gold/20 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-gold-gradient">
              Connect a wallet
            </DialogTitle>
            <DialogDescription>
              Choose any EVM-compatible wallet. Praetor uses the EIP-6963 standard, so it
              detects MetaMask, Rabby, Coinbase Wallet, Rainbow, Trust and more.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 space-y-2">
            {wallets.length === 0 && (
              <div className="rounded-xl border border-gold/20 bg-gold/5 p-6 text-center text-sm text-muted-foreground">
                No injected EVM wallets detected.
                <div className="mt-3 flex flex-wrap justify-center gap-3 text-xs">
                  <a href="https://metamask.io/download/" target="_blank" rel="noreferrer" className="text-gold-soft underline">
                    Install MetaMask
                  </a>
                  <a href="https://rabby.io/" target="_blank" rel="noreferrer" className="text-gold-soft underline">
                    Install Rabby
                  </a>
                  <a href="https://www.coinbase.com/wallet/downloads" target="_blank" rel="noreferrer" className="text-gold-soft underline">
                    Install Coinbase Wallet
                  </a>
                </div>
              </div>
            )}

            {wallets.map((w) => (
              <button
                key={w.uuid}
                onClick={() => onSelect(w)}
                disabled={isConnecting}
                className="group flex w-full items-center justify-between rounded-xl border border-gold/20 bg-gold/[0.03] p-3 text-left transition-all hover:border-gold/40 hover:bg-gold/10 disabled:opacity-50"
              >
                <span className="flex items-center gap-3">
                  <img
                    src={w.icon}
                    alt=""
                    width={36}
                    height={36}
                    className="rounded-lg border border-gold/20 bg-background"
                  />
                  <span className="font-medium">{w.name}</span>
                </span>
                <span className="text-xs uppercase tracking-widest text-muted-foreground group-hover:text-gold-soft">
                  Connect
                </span>
              </button>
            ))}

            {error && (
              <p className="pt-2 text-center text-xs text-red-400/90">{error}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
