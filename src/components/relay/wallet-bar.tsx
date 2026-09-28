import { shortenAddress } from "@/chain/wallet";
import type { Copy } from "@/i18n/copy";
import type { WalletView } from "./use-wallet";

export function WalletBar({ copy, wallet }: { copy: Copy; wallet: WalletView }) {
  return (
    <div className="border-b border-line bg-bg">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
        {wallet.address ? (
          <>
            <p className="font-mono text-sm text-fg">{shortenAddress(wallet.address)}</p>
            <p className="font-mono text-xs text-muted">
              {wallet.onXLayer ? `X Layer · ${wallet.okb ?? "—"} OKB` : `${copy.wrongChain} · ${wallet.chainId ?? "—"}`}
            </p>
            {wallet.onXLayer ? null : (
              <button
                type="button"
                className="tap min-h-11 rounded-full bg-copper px-4 text-sm text-ink disabled:opacity-60"
                disabled={wallet.busy}
                onClick={wallet.switchChain}
              >
                {copy.switchChain}
              </button>
            )}
            <button type="button" className="tap min-h-11 rounded-full border border-line px-4 text-sm" onClick={wallet.disconnect}>
              {copy.disconnect}
            </button>
          </>
        ) : (
          <button
            type="button"
            className="tap min-h-11 rounded-full bg-copper px-4 text-sm text-ink disabled:opacity-60"
            disabled={wallet.busy}
            onClick={wallet.connect}
          >
            {wallet.busy ? copy.connecting : copy.connect}
          </button>
        )}
        {wallet.error ? (
          <p className="min-w-0 text-sm text-muted" role="status">
            {wallet.error === "rejected" ? copy.rejected : null}
            {wallet.error === "failed" ? copy.walletFailed : null}
            {wallet.error === "no-wallet" ? (wallet.framed ? copy.frameHint : copy.noWallet) : null}
          </p>
        ) : null}
        {wallet.error === "no-wallet" && wallet.framed ? (
          <button type="button" className="tap min-h-11 rounded-full border border-line px-4 text-sm" onClick={wallet.openTab}>
            {copy.openTab}
          </button>
        ) : null}
      </div>
    </div>
  );
}
