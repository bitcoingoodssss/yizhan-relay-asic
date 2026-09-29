import { shortenAddress } from "@/chain/wallet";
import type { Copy } from "@/i18n/copy";
import type { WalletView } from "./use-wallet";

export function WalletBar({ copy, wallet }: { copy: Copy; wallet: WalletView }) {
  if (wallet.address) {
    return (
      <div className="flex h-10 max-w-full items-center gap-1 rounded-full border border-line bg-surface pl-3 pr-1">
        <p className="truncate font-mono text-xs">
          {shortenAddress(wallet.address)}
          <span className="text-muted"> · {wallet.onXLayer ? `${wallet.okb ?? "—"} OKB` : copy.wrongChain}</span>
        </p>
        {wallet.onXLayer ? null : (
          <button
            type="button"
            className="tap h-8 rounded-full bg-copper px-3 text-xs text-ink disabled:opacity-60"
            disabled={wallet.busy}
            onClick={wallet.switchChain}
          >
            {copy.switchChain}
          </button>
        )}
        <button type="button" className="tap h-8 rounded-full px-3 text-xs text-muted" onClick={wallet.disconnect}>
          {copy.disconnect}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        className="tap h-10 rounded-full bg-copper px-4 text-sm text-ink disabled:opacity-60"
        disabled={wallet.busy}
        onClick={wallet.connect}
      >
        {wallet.busy ? copy.connecting : copy.connect}
      </button>
      {wallet.error === "no-wallet" && wallet.framed ? (
        <button type="button" className="tap h-10 rounded-full border border-line px-3 text-xs" onClick={wallet.openTab}>
          {copy.openTab}
        </button>
      ) : null}
      {wallet.error ? (
        <p className="max-w-56 text-xs text-muted" role="status">
          {wallet.error === "rejected" ? copy.rejected : null}
          {wallet.error === "failed" ? copy.walletFailed : null}
          {wallet.error === "no-wallet" ? (wallet.framed ? copy.frameHint : copy.noWallet) : null}
        </p>
      ) : null}
    </div>
  );
}
