"use client";

import { useState } from "react";
import { SwapArrowsIcon, SpinnerIcon, ChevronDownIcon, TonDiamond } from "@/components/icons";
import { useOmniston } from "@/hooks/useOmniston";
import { SWAP_TOKENS } from "@/lib/tokens";
import type { SwapTokenInfo } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SwapModalProps {
  targetTon: string;
  walletAddress: string | null;
  onClose: () => void;
  onSuccess: (receivedTon: string) => void;
}

function TokenButton({
  token,
  onSelect,
}: {
  token: SwapTokenInfo;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-surface-border press-scale"
    >
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
        style={{ background: token.color, color: "#fff" }}
      >
        {token.symbol[0]}
      </div>
      <span className="text-sm font-semibold text-slate-900">{token.symbol}</span>
      <ChevronDownIcon size={14} />
    </button>
  );
}

function TokenPicker({
  tokens,
  excluded,
  onPick,
  onClose,
}: {
  tokens: SwapTokenInfo[];
  excluded: string;
  onPick: (t: SwapTokenInfo) => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-0 z-10 rounded-3xl flex flex-col bg-white">
      <div className="flex items-center justify-between p-4">
        <p className="font-bold text-slate-900">Select Token</p>
        <button onClick={onClose} className="text-slate-500 text-sm font-semibold press-scale">Cancel</button>
      </div>
      <div className="flex flex-col gap-2 px-4">
        {tokens
          .filter((t) => t.symbol !== excluded)
          .map((t) => (
            <button
              key={t.symbol}
              onClick={() => onPick(t)}
              className="flex items-center gap-3 p-3 rounded-xl bg-surface-tint border border-surface-border press-scale hover:bg-surface-hover transition-colors"
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
                style={{ background: t.color, color: "#fff" }}
              >
                {t.symbol[0]}
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm text-slate-900">{t.symbol}</p>
                <p className="text-xs text-slate-500">{t.name}</p>
              </div>
            </button>
          ))}
      </div>
    </div>
  );
}

export function SwapModal({ targetTon, walletAddress, onClose, onSuccess }: SwapModalProps) {
  const [pickingToken, setPickingToken] = useState(false);

  const {
    fromToken,
    toToken,
    fromAmount,
    status,
    errorMsg,
    estimatedOutput,
    quote,
    setFromToken,
    setFromAmount,
    executeSwap,
    tokens,
  } = useOmniston(walletAddress, {
    defaultFromToken: SWAP_TOKENS[1],
    defaultToToken: SWAP_TOKENS[0],
  });

  async function handleConfirmSwap() {
    const ok = await executeSwap();
    if (ok && estimatedOutput) {
      onSuccess(estimatedOutput);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6 relative overflow-hidden">
        {pickingToken && (
          <TokenPicker
            tokens={tokens}
            excluded={toToken.symbol}
            onPick={(t) => { setFromToken(t); setPickingToken(false); }}
            onClose={() => setPickingToken(false)}
          />
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <p className="font-bold text-lg text-slate-900">Swap to Pay</p>
          <button onClick={onClose} className="text-slate-500 text-sm font-semibold press-scale">Cancel</button>
        </div>

        <div className="flex flex-col gap-3">
          {/* Target amount hint */}
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-surface-tint border border-surface-border">
            <TonDiamond size={14} />
            <p className="text-xs text-slate-500">
              You need{" "}
              <span className="text-lime-dim font-bold">{targetTon} TON</span>{" "}
              for this bounty entry fee
            </p>
          </div>

          {/* From token input */}
          <div className="bg-surface-tint rounded-2xl border border-surface-border p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wide">You pay</span>
              <TokenButton token={fromToken} onSelect={() => setPickingToken(true)} />
            </div>
            <input
              type="number"
              inputMode="decimal"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-transparent text-2xl font-black text-slate-900 placeholder:text-slate-300 outline-none"
              style={{ caretColor: "#B5F23A" }}
            />
          </div>

          {/* Swap arrow */}
          <div className="flex justify-center">
            <div className="w-9 h-9 rounded-full flex items-center justify-center bg-surface-tint border border-surface-border">
              <SwapArrowsIcon size={16} />
            </div>
          </div>

          {/* To token output */}
          <div className="bg-surface-tint rounded-2xl border border-surface-border p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wide">You receive</span>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-surface-border">
                <TonDiamond size={14} />
                <span className="text-sm font-semibold text-slate-900">TON</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {status === "quoting" && <SpinnerIcon size={20} />}
              <p
                className={cn(
                  "text-2xl font-black",
                  estimatedOutput ? "text-lime-dim" : "text-slate-300"
                )}
              >
                {estimatedOutput || "0.00"}
              </p>
            </div>
          </div>

          {/* Status messages */}
          {status === "no_quote" && (
            <p className="text-xs text-red-400 text-center">{errorMsg}</p>
          )}
          {status === "error" && (
            <p className="text-xs text-red-400 text-center">{errorMsg}</p>
          )}

          {/* Info row */}
          {status === "quoted" && quote && (
            <div className="flex justify-between text-xs text-slate-500 px-1">
              <span>Rate</span>
              <span>
                1 {fromToken.symbol} ≈{" "}
                {(parseFloat(estimatedOutput) / parseFloat(fromAmount || "1")).toFixed(4)} TON
              </span>
            </div>
          )}

          {/* CTA */}
          {!walletAddress ? (
            <div className="p-3 rounded-xl text-center text-xs text-slate-500 bg-surface-tint border border-surface-border">
              Connect your wallet to swap
            </div>
          ) : (
            <button
              onClick={handleConfirmSwap}
              disabled={status !== "quoted" && status !== "swapping"}
              className={cn(
                "w-full py-3 rounded-xl font-bold text-sm press-scale flex items-center justify-center gap-2 transition-all",
                status === "quoted" || status === "swapping"
                  ? "bg-lime text-dark"
                  : "bg-surface-tint text-slate-300 border border-surface-border"
              )}
            >
              {status === "swapping" && <SpinnerIcon size={16} color="#0D0E12" />}
              {status === "swapping" ? "Swapping..." : status === "quoted" ? "Confirm Swap" : "Enter amount to swap"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
