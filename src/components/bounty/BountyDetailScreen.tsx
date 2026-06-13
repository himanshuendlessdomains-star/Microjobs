"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  TonDiamond,
  ClockIcon,
  PeopleIcon,
  DrawBadgeIcon,
  ManualBadgeIcon,
  RocketBountyIcon,
  XBountyIcon,
  ChartBountyIcon,
  CodeBountyIcon,
  StarBountyIcon,
  TrophyBountyIcon,
  SpinnerIcon,
} from "@/components/icons";
import { ProofSubmitModal } from "./ProofSubmitModal";
import { SwapModal } from "./SwapModal";
import { useTonConnectUI } from "@tonconnect/ui-react";
import { getBounty, submitProof, closeBounty } from "@/lib/api";
import { cn, formatCountdown, formatTON, tonToNanoton } from "@/lib/utils";
import { useWallet } from "@/hooks/useTonWallet";
import type { Bounty, ProofSubmission } from "@/lib/types";

const ICON_MAP = {
  rocket: RocketBountyIcon,
  x: XBountyIcon,
  chart: ChartBountyIcon,
  code: CodeBountyIcon,
  star: StarBountyIcon,
  trophy: TrophyBountyIcon,
};

const CATEGORY_COLORS: Record<string, string> = {
  Creative: "#A78BFA",
  Social: "#60A5FA",
  Analytics: "#34D399",
  Dev: "#F59E0B",
  All: "#B5F23A",
};

interface ParticipateState {
  status: "idle" | "entry_fee_choice" | "swap" | "proof" | "done";
}

export function BountyDetailScreen({ bountyId }: { bountyId: string }) {
  const router = useRouter();
  const { isConnected, isMainnet, rawAddress } = useWallet();
  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [loadingBounty, setLoadingBounty] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [tonConnectUI] = useTonConnectUI();
  const [participateState, setParticipateState] = useState<ParticipateState>({ status: "idle" });
  const [submission, setSubmission] = useState<ProofSubmission | null>(null);
  const [payingFee, setPayingFee] = useState(false);
  const [earlyCloseConfirm, setEarlyCloseConfirm] = useState(false);
  const [earlyClosing, setEarlyClosing] = useState(false);

  useEffect(() => {
    setLoadingBounty(true);
    getBounty(bountyId)
      .then((data) => { setBounty(data); setSeconds(data.timeLeftSeconds); })
      .catch(() => setFetchError("Bounty not found."))
      .finally(() => setLoadingBounty(false));
  }, [bountyId]);

  useEffect(() => {
    if (!bounty) return;
    intervalRef.current = setInterval(() => {
      setSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [bounty]);

  // Must be declared before early returns so hook order is stable.
  const sendEntryFee = useCallback(async (): Promise<boolean> => {
    if (!bounty?.entryFee || !rawAddress) return false;
    if (!isMainnet) return false;
    const escrowAddress = process.env.NEXT_PUBLIC_ESCROW_ADDRESS;
    if (!escrowAddress) return false;
    try {
      const nanotons = tonToNanoton(bounty.entryFee);
      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [{ address: escrowAddress, amount: nanotons }],
      });
      return true;
    } catch {
      return false;
    }
  }, [bounty, rawAddress, isMainnet, tonConnectUI]);

  if (loadingBounty) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3" style={{ background: "#F2F4FA" }}>
        <SpinnerIcon size={32} />
      </div>
    );
  }

  if (!bounty || fetchError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3" style={{ background: "#F2F4FA" }}>
        <p className="text-text-muted text-sm">{fetchError || "Bounty not found."}</p>
        <button
          onClick={() => router.back()}
          className="text-sm font-bold px-5 py-2.5 rounded-xl bg-lime text-dark-DEFAULT press-scale"
          style={{ background: "#B5F23A", color: "#0D0E12" }}
        >
          Go back
        </button>
      </div>
    );
  }

  const BountyIcon = ICON_MAP[bounty.icon];
  const isUrgent = seconds > 0 && seconds < 3600;
  const hasEntryFee = !!bounty.entryFee;
  const categoryColor = CATEGORY_COLORS[bounty.category] ?? "#B5F23A";
  const isCreator = !!rawAddress && rawAddress === bounty.creatorAddress;
  const hot = bounty.isHot;

  async function handleEarlyClose() {
    if (!rawAddress) return;
    setEarlyClosing(true);
    try {
      await closeBounty(bountyId, rawAddress);
      router.push(`/review/${bountyId}`);
    } catch {
      setEarlyClosing(false);
      setEarlyCloseConfirm(false);
    }
  }

  function handleParticipateClick() {
    if (!isConnected) return;
    if (hasEntryFee) {
      setParticipateState({ status: "entry_fee_choice" });
    } else {
      setParticipateState({ status: "proof" });
    }
  }

  async function handlePayTon() {
    setPayingFee(true);
    const ok = await sendEntryFee();
    setPayingFee(false);
    if (ok) setParticipateState({ status: "proof" });
  }

  async function handleSwapSuccess() {
    setPayingFee(true);
    const ok = await sendEntryFee();
    setPayingFee(false);
    if (ok) setParticipateState({ status: "proof" });
    else setParticipateState({ status: "entry_fee_choice" });
  }

  async function handleProofSubmit(sub: ProofSubmission) {
    if (!rawAddress) return;
    try {
      await submitProof(bountyId, { ...sub, walletAddress: rawAddress });
      setSubmission(sub);
      setParticipateState({ status: "done" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Submission failed. Please try again.";
      setFetchError(msg);
    }
  }

  const participated = participateState.status === "done" && !!submission;

  return (
    <div className="min-h-screen" style={{ background: "#F2F4FA" }}>
      <div className="max-w-2xl mx-auto px-4 py-4 md:py-8 pb-32 md:pb-12">
        {/* ── Header ── */}
        <header className="sticky top-0 bg-[#F2F4FA]/90 backdrop-blur-md z-10 py-3 flex items-center gap-3 -mx-4 px-4">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 bg-white border border-surface-border rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 press-scale"
          >
            <ArrowLeftIcon size={18} color="#0D0E12" />
          </button>
          <p className="font-semibold text-slate-900 flex-1 truncate">{bounty.title}</p>
          {hot && (
            <div className="bg-lime text-xs font-black px-2.5 py-1 rounded-full flex-shrink-0" style={{ background: "#B5F23A", color: "#0D0E12" }}>
              Hot 🔥
            </div>
          )}
        </header>

        {/* ── Hero card ── */}
        <div
          className={cn(
            "mt-4 rounded-3xl p-5",
            hot
              ? "bg-dark-card border border-lime-border shadow-[0_0_30px_4px_rgba(181,242,58,0.15)]"
              : "bg-white border border-surface-border shadow-md"
          )}
        >
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "w-[72px] h-[72px] rounded-2xl flex items-center justify-center flex-shrink-0",
                hot ? "bg-dark-elevated" : "bg-surface-tint"
              )}
            >
              <div className="scale-125">
                <BountyIcon />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div
                className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold mb-2"
                style={{ background: `${categoryColor}18`, color: categoryColor, border: `1px solid ${categoryColor}30` }}
              >
                {bounty.category}
              </div>
              <p className={cn("font-bold text-lg leading-snug", hot ? "text-ink-primary" : "text-slate-900")}>
                {bounty.title}
              </p>
              <p className={cn("text-xs mt-1", hot ? "text-ink-muted" : "text-text-muted")}>by {bounty.creatorName}</p>
            </div>
          </div>

          {/* Stats 2x2 grid */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            {[
              {
                label: "Pool",
                value: (
                  <div className="flex items-center gap-1.5">
                    <TonDiamond size={14} />
                    <span className={cn("font-bold text-sm", hot ? "text-lime" : "text-lime-dim")} style={{ color: hot ? "#B5F23A" : "#8BBD1E" }}>
                      {formatTON(bounty.poolAmount)} TON
                    </span>
                  </div>
                ),
              },
              {
                label: "Per Winner",
                value: (
                  <div className="flex items-center gap-1.5">
                    <TonDiamond size={14} />
                    <span className={cn("font-bold text-sm", hot ? "text-ink-primary" : "text-slate-900")}>
                      {formatTON(bounty.perWinnerAmount)} TON
                    </span>
                  </div>
                ),
              },
              {
                label: "Time Left",
                value: (
                  <div className="flex items-center gap-1.5">
                    <ClockIcon color={isUrgent ? "#F87171" : undefined} />
                    <span
                      className={cn(
                        "font-mono text-sm font-bold tabular-nums",
                        isUrgent ? "text-red-400" : hot ? "text-ink-secondary" : "text-slate-900",
                        seconds === 0 && (hot ? "text-ink-faint" : "text-text-faint")
                      )}
                    >
                      {seconds === 0 ? "Ended" : formatCountdown(seconds)}
                    </span>
                  </div>
                ),
              },
              {
                label: "Participants",
                value: (
                  <div className="flex items-center gap-1.5">
                    <PeopleIcon />
                    <span className={cn("text-sm font-bold", hot ? "text-ink-secondary" : "text-slate-900")}>
                      {bounty.participants.toLocaleString()}
                    </span>
                  </div>
                ),
              },
            ].map((stat) => (
              <div key={stat.label} className={cn("rounded-xl p-3", hot ? "bg-dark-surface" : "bg-surface-tint")}>
                <p className={cn("text-xs uppercase tracking-wider mb-1", hot ? "text-ink-faint" : "text-slate-400")}>
                  {stat.label}
                </p>
                {stat.value}
              </div>
            ))}
          </div>
        </div>

        {/* ── Details card ── */}
        <div className="mt-3 bg-white rounded-2xl shadow-sm border border-surface-border p-4 flex flex-col gap-3">
          {/* Winner type */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">Winner Selection</span>
            {bounty.winnerSelection === "draw" ? (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                style={{ background: "#B5F23A28", color: "#5C7A12", border: "1px solid #B5F23A60" }}
              >
                <DrawBadgeIcon /> Draw ({bounty.winnerCount} winners)
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-surface-tint text-text-secondary border border-surface-border">
                <ManualBadgeIcon /> Manual ({bounty.winnerCount} winners)
              </div>
            )}
          </div>

          {/* Entry fee */}
          {hasEntryFee && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">Entry Fee</span>
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                style={{ background: "#F59E0B18", color: "#B45309", border: "1px solid #F59E0B40" }}
              >
                <TonDiamond size={12} />
                {bounty.entryFee} TON
              </div>
            </div>
          )}

          {/* Type */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">Bounty Type</span>
            <span className="text-xs font-semibold text-slate-900 capitalize">{bounty.type}</span>
          </div>
        </div>

        {/* ── Description card ── */}
        <div className="mt-3 bg-white rounded-2xl shadow-sm border border-surface-border p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">Description</p>
          <p className="text-slate-700 text-sm leading-relaxed">{bounty.description}</p>
        </div>

        {/* ── Participants card ── */}
        <div className="mt-3 bg-white rounded-2xl shadow-sm border border-surface-border p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-3">Participants</p>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {["#B5F23A", "#60A5FA", "#A78BFA", "#F59E0B"].map((c, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: c, color: "#0D0E12", border: "2px solid #FFFFFF" }}
                >
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <p className="text-xs text-text-muted">
              +{(bounty.participants - 4).toLocaleString()} more joined
            </p>
          </div>
        </div>

        {/* ── Submission status if participated ── */}
        {participated && (
          <div
            className="mt-3 rounded-2xl p-4 flex items-center gap-3 border"
            style={{ background: "#B5F23A15", borderColor: "#B5F23A40" }}
          >
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#B5F23A30" }}>
              <span className="text-lg" style={{ color: "#5C7A12" }}>✓</span>
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: "#5C7A12" }}>Proof Submitted</p>
              <p className="text-xs text-text-muted mt-0.5">Awaiting review &mdash; you&apos;ll be notified if you win.</p>
            </div>
          </div>
        )}

        {/* ── CTA bar — fixed on mobile, in-flow on desktop ── */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-surface-border px-4 py-3 pb-[env(safe-area-inset-bottom,12px)] md:relative md:z-auto md:mt-6 md:bg-transparent md:backdrop-blur-none md:border-0 md:px-0 md:py-0 md:pb-0">
          <div className="max-w-2xl mx-auto">
            {isCreator ? (
              bounty.status !== "active" ? (
                // Bounty already closed — only show Review, no early-close option
                <button
                  onClick={() => router.push(`/review/${bountyId}`)}
                  className="w-full py-3 rounded-xl font-bold text-sm press-scale"
                  style={{ background: "#B5F23A", color: "#0D0E12", boxShadow: "0 0 20px 4px rgba(181,242,58,0.25)" }}
                >
                  Review Submissions
                </button>
              ) : earlyCloseConfirm ? (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-center text-text-muted mb-1">
                    This will end the bounty immediately. Winners can still be selected after.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEarlyCloseConfirm(false)}
                      disabled={earlyClosing}
                      className="flex-1 py-3 rounded-xl text-sm font-semibold border border-surface-border text-text-secondary hover:bg-surface-hover transition-colors duration-150 press-scale"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleEarlyClose}
                      disabled={earlyClosing}
                      className="flex-1 py-3 rounded-xl text-sm font-bold press-scale"
                      style={{ background: "#F87171", color: "#fff" }}
                    >
                      {earlyClosing ? "Closing..." : "Yes, Close"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => router.push(`/review/${bountyId}`)}
                    className="w-full py-3 rounded-xl font-bold text-sm press-scale"
                    style={{ background: "#B5F23A", color: "#0D0E12", boxShadow: "0 0 20px 4px rgba(181,242,58,0.25)" }}
                  >
                    Review Submissions
                  </button>
                  {seconds > 0 && (
                    <button
                      onClick={() => setEarlyCloseConfirm(true)}
                      className="w-full py-2.5 rounded-xl text-xs font-semibold border border-red-300 text-red-500 press-scale"
                    >
                      Close Bounty Early
                    </button>
                  )}
                </div>
              )
            ) : bounty.status !== "active" ? (
              // Closed bounty — non-creator sees a closed state, no participate button
              <div className="py-3 rounded-xl text-center text-sm font-bold text-slate-400 bg-surface-tint border border-surface-border">
                Bounty Closed
              </div>
            ) : !isConnected ? (
              <div className="p-3 rounded-xl text-center text-xs text-text-muted bg-surface-tint border border-surface-border">
                Connect your wallet in Profile to participate
              </div>
            ) : seconds === 0 ? (
              <div className="py-3 rounded-xl text-center text-sm font-bold text-text-faint bg-surface-tint border border-surface-border">
                Bounty Ended
              </div>
            ) : participated ? (
              <div
                className="py-3 rounded-xl text-center text-sm font-bold border"
                style={{ background: "#B5F23A15", borderColor: "#B5F23A40", color: "#5C7A12" }}
              >
                Proof Submitted ✓
              </div>
            ) : (
              <button
                onClick={handleParticipateClick}
                className="w-full py-3 rounded-xl font-bold text-sm press-scale"
                style={{ background: "#B5F23A", color: "#0D0E12", boxShadow: "0 0 20px 4px rgba(181,242,58,0.25)" }}
              >
                {hasEntryFee ? `Participate · ${bounty.entryFee} TON Entry` : "Participate"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Entry fee choice sheet ── */}
      {participateState.status === "entry_fee_choice" && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
          style={{ background: "rgba(13,14,18,0.5)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setParticipateState({ status: "idle" }); }}
        >
          <div className="w-full md:max-w-md bg-white rounded-t-3xl md:rounded-3xl p-5 shadow-lg border border-surface-border">
            <div className="flex justify-center mb-4 md:hidden">
              <div className="w-10 h-1 rounded-full bg-surface-border" />
            </div>
            <p className="font-bold text-base text-slate-900 mb-1">Pay Entry Fee</p>
            <p className="text-sm text-text-muted mb-5">
              This bounty requires a{" "}
              <span className="font-semibold" style={{ color: "#5C7A12" }}>{bounty.entryFee} TON</span>{" "}
              entry fee. Choose how to pay:
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handlePayTon}
                disabled={payingFee}
                className="w-full py-3 rounded-xl font-bold text-sm press-scale flex items-center justify-center gap-2"
                style={{ background: payingFee ? "#8BBD1E" : "#B5F23A", color: "#0D0E12" }}
              >
                {payingFee && <SpinnerIcon size={16} color="#0D0E12" />}
                {payingFee ? "Awaiting Wallet..." : "Pay with TON"}
              </button>
              <button
                onClick={() => setParticipateState({ status: "swap" })}
                className="w-full py-3 rounded-xl font-bold text-sm press-scale border"
                style={{ background: "#B5F23A15", color: "#5C7A12", borderColor: "#B5F23A40" }}
              >
                Swap Another Token via Omniston
              </button>
              <button
                onClick={() => setParticipateState({ status: "idle" })}
                className="w-full py-2 rounded-xl text-sm text-text-muted font-semibold press-scale"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Swap modal ── */}
      {participateState.status === "swap" && (
        <SwapModal
          targetTon={bounty.entryFee ?? "0"}
          walletAddress={rawAddress}
          onClose={() => setParticipateState({ status: "idle" })}
          onSuccess={() => { void handleSwapSuccess(); }}
        />
      )}

      {/* ── Proof submit modal ── */}
      {participateState.status === "proof" && (
        <ProofSubmitModal
          bountyId={bounty.id}
          bountyTitle={bounty.title}
          onClose={() => setParticipateState({ status: "idle" })}
          onSubmit={handleProofSubmit}
        />
      )}
    </div>
  );
}
