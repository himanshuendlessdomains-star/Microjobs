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
      className="flex items-center gap-2 px-3 py-2 rounded-xl press-scale"
      style={{ background: "#1A1D22", border: "1px solid #2E333D" }}
    >
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
        style={{ background: token.color, color: "#fff" }}
      >
        {token.symbol[0]}
      </div>
      <span className="text-sm font-semibold text-[#EAEAEA]">{token.symbol}</span>
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
    <div className="absolute inset-0 z-10 rounded-3xl flex flex-col" style={{ background: "#111317" }}>
      <div className="flex items-center justify-between p-4">
        <p className="font-bold text-[#EAEAEA]">Select Token</p>
        <button onClick={onClose} className="text-[#9CA3AF] text-sm font-semibold press-scale">Cancel</button>
      </div>
      <div className="flex flex-col gap-2 px-4">
        {tokens
          .filter((t) => t.symbol !== excluded)
          .map((t) => (
            <button
              key={t.symbol}
              onClick={() => onPick(t)}
              className="flex items-center gap-3 p-3 rounded-xl press-scale"
              style={{ background: "#0D0E10", border: "1px solid #1E2127" }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
                style={{ background: t.color, color: "#fff" }}
              >
                {t.symbol[0]}
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm text-[#EAEAEA]">{t.symbol}</p>
                <p className="text-xs text-[#5A6070]">{t.name}</p>
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
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.72)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-[390px] rounded-t-3xl pb-6 relative overflow-hidden"
        style={{ background: "#111317", border: "1px solid #1E2127" }}
      >
        {pickingToken && (
          <TokenPicker
            tokens={tokens}
            excluded={toToken.symbol}
            onPick={(t) => { setFromToken(t); setPickingToken(false); }}
            onClose={() => setPickingToken(false)}
          />
        )}

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: "#2E333D" }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <p className="font-bold text-base text-[#EAEAEA]">Swap to Pay</p>
          <button onClick={onClose} className="text-[#9CA3AF] text-sm font-semibold press-scale">Cancel</button>
        </div>

        <div className="px-5 flex flex-col gap-3">
          {/* Target amount hint */}
          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
            style={{ background: "#0D0E10", border: "1px solid #1E2127" }}
          >
            <TonDiamond size={14} />
            <p className="text-xs text-[#9CA3AF]">
              You need{" "}
              <span className="text-[#B5F23A] font-bold">{targetTon} TON</span>{" "}
              for this bounty entry fee
            </p>
          </div>

          {/* From token input */}
          <div
            className="rounded-2xl p-4"
            style={{ background: "#0D0E10", border: "1px solid #1E2127" }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[#5A6070] font-semibold uppercase tracking-wide">You pay</span>
              <TokenButton token={fromToken} onSelect={() => setPickingToken(true)} />
            </div>
            <input
              type="number"
              inputMode="decimal"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-transparent text-2xl font-bold text-[#EAEAEA] outline-none"
              style={{ caretColor: "#B5F23A" }}
            />
          </div>

          {/* Swap arrow */}
          <div className="flex justify-center">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: "#1A1D22", border: "1px solid #2E333D" }}
            >
              <SwapArrowsIcon size={16} />
            </div>
          </div>

          {/* To token output */}
          <div
            className="rounded-2xl p-4"
            style={{ background: "#0D0E10", border: "1px solid #1E2127" }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[#5A6070] font-semibold uppercase tracking-wide">You receive</span>
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background: "#1A1D22", border: "1px solid #2E333D" }}
              >
                <TonDiamond size={14} />
                <span className="text-sm font-semibold text-[#EAEAEA]">TON</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {status === "quoting" && <SpinnerIcon size={20} />}
              <p
                className={cn(
                  "text-2xl font-bold",
                  estimatedOutput ? "text-[#B5F23A]" : "text-[#2E333D]"
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
            <div className="flex justify-between text-xs text-[#5A6070] px-1">
              <span>Rate</span>
              <span>
                1 {fromToken.symbol} ≈{" "}
                {(parseFloat(estimatedOutput) / parseFloat(fromAmount || "1")).toFixed(4)} TON
              </span>
            </div>
          )}

          {/* CTA */}
          {!walletAddress ? (
            <div
              className="p-3 rounded-xl text-center text-xs text-[#9CA3AF]"
              style={{ background: "#0D0E10", border: "1px solid #1E2127" }}
            >
              Connect your wallet to swap
            </div>
          ) : (
            <button
              onClick={handleConfirmSwap}
              disabled={status !== "quoted" && status !== "swapping"}
              className="w-full py-3.5 rounded-2xl font-bold text-sm press-scale flex items-center justify-center gap-2 transition-all"
              style={{
                background: status === "quoted" ? "#B5F23A" : "#1A1D22",
                color: status === "quoted" ? "#0D0E10" : "#5A6070",
                border: status === "quoted" ? "none" : "1px solid #2E333D",
              }}
            >
              {status === "swapping" && <SpinnerIcon size={16} color="#0D0E10" />}
              {status === "swapping" ? "Swapping..." : status === "quoted" ? "Confirm Swap" : "Enter amount to swap"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
