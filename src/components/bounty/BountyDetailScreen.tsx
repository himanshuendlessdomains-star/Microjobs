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
import { BottomNav } from "@/components/layout/BottomNav";
import { ProofSubmitModal } from "./ProofSubmitModal";
import { SwapModal } from "./SwapModal";
import { useTonConnectUI } from "@tonconnect/ui-react";
import { getBounty, submitProof } from "@/lib/api";
import { cn, formatCountdown, formatTON } from "@/lib/utils";
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
  const { isConnected, rawAddress } = useWallet();
  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [loadingBounty, setLoadingBounty] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [tonConnectUI] = useTonConnectUI();
  const [participateState, setParticipateState] = useState<ParticipateState>({ status: "idle" });
  const [submission, setSubmission] = useState<ProofSubmission | null>(null);
  const [payingFee, setPayingFee] = useState(false);

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
    const escrowAddress = process.env.NEXT_PUBLIC_ESCROW_ADDRESS;
    if (!escrowAddress) return false;
    try {
      const nanotons = Math.floor(parseFloat(bounty.entryFee) * 1e9).toString();
      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [{ address: escrowAddress, amount: nanotons }],
      });
      return true;
    } catch {
      return false;
    }
  }, [bounty, rawAddress, tonConnectUI]);

  if (loadingBounty) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-3" style={{ background: "#0D0E10" }}>
        <SpinnerIcon size={32} />
      </div>
    );
  }

  if (!bounty || fetchError) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-3" style={{ background: "#0D0E10" }}>
        <p className="text-[#5A6070] text-sm">{fetchError || "Bounty not found."}</p>
        <button onClick={() => router.back()} className="text-[#B5F23A] text-sm font-semibold press-scale">Go back</button>
      </div>
    );
  }

  const BountyIcon = ICON_MAP[bounty.icon];
  const isUrgent = seconds > 0 && seconds < 3600;
  const hasEntryFee = !!bounty.entryFee;
  const categoryColor = CATEGORY_COLORS[bounty.category] ?? "#B5F23A";

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

  async function handleSwapSuccess(receivedTon: string) {
    // User has swapped to TON; now pay the entry fee with it.
    console.log("Swap succeeded, received", receivedTon, "TON — paying entry fee");
    setPayingFee(true);
    const ok = await sendEntryFee();
    setPayingFee(false);
    if (ok) setParticipateState({ status: "proof" });
    else setParticipateState({ status: "entry_fee_choice" });
  }

  async function handleProofSubmit(sub: ProofSubmission) {
    setSubmission(sub);
    setParticipateState({ status: "done" });
    if (rawAddress) {
      submitProof(bountyId, { ...sub, walletAddress: rawAddress }).catch(() => {});
    }
  }

  const participated = participateState.status === "done" && !!submission;

  return (
    <div className="flex flex-col h-full relative" style={{ background: "#0D0E10" }}>
      {/* ── Header ── */}
      <header className="flex items-center gap-3 px-4 pt-5 pb-3 flex-shrink-0">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 press-scale"
          style={{ background: "#1A1D22", border: "1px solid #2E333D" }}
        >
          <ArrowLeftIcon size={18} />
        </button>
        <p className="font-bold text-[15px] text-[#EAEAEA] flex-1 truncate">{bounty.title}</p>
        {bounty.isHot && (
          <div
            className="px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0"
            style={{ background: "#B5F23A", color: "#0D0E10" }}
          >
            Hot 🔥
          </div>
        )}
      </header>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto scrollbar-hide" style={{ paddingBottom: 110 }}>
        {/* Hero card */}
        <div className="px-4 mb-4">
          <div
            className="rounded-2xl p-5"
            style={{
              background: bounty.isHot
                ? "linear-gradient(135deg, #13150D 0%, #0F1209 100%)"
                : "#111317",
              border: bounty.isHot ? "1.5px solid #B5F23A" : "1.5px solid #1E2127",
              boxShadow: bounty.isHot ? "0 0 24px 4px #B5F23A20" : "none",
            }}
          >
            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: "#1A1F14" }}
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
                <p className="font-bold text-base text-[#EAEAEA] leading-snug">{bounty.title}</p>
                <p className="text-xs text-[#5A6070] mt-1">by {bounty.creatorName}</p>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: "Pool",
                  value: (
                    <div className="flex items-center gap-1.5">
                      <TonDiamond size={14} />
                      <span className="font-bold text-sm text-[#B5F23A]">{formatTON(bounty.poolAmount)} TON</span>
                    </div>
                  ),
                },
                {
                  label: "Per Winner",
                  value: (
                    <div className="flex items-center gap-1.5">
                      <TonDiamond size={14} />
                      <span className="font-bold text-sm text-[#EAEAEA]">{formatTON(bounty.perWinnerAmount)} TON</span>
                    </div>
                  ),
                },
                {
                  label: "Time Left",
                  value: (
                    <div className="flex items-center gap-1.5">
                      <ClockIcon color={isUrgent ? "#F87171" : undefined} />
                      <span className={cn("font-mono text-sm font-semibold tabular-nums", isUrgent ? "text-red-400" : "text-[#C8CDD8]", seconds === 0 && "text-[#5A6070]")}>
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
                      <span className="text-sm font-semibold text-[#C8CDD8]">{bounty.participants.toLocaleString()}</span>
                    </div>
                  ),
                },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl p-3" style={{ background: "#0D0E10" }}>
                  <p className="text-[10px] font-medium uppercase tracking-wider mb-1.5 text-[#5A6070]">{stat.label}</p>
                  {stat.value}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bounty details section */}
        <div className="px-4 mb-4">
          <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: "#111317", border: "1px solid #1E2127" }}>
            {/* Winner type */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#5A6070]">Winner Selection</span>
              {bounty.winnerSelection === "draw" ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold" style={{ background: "#B5F23A18", color: "#B5F23A", border: "1px solid #B5F23A40" }}>
                  <DrawBadgeIcon /> Draw ({bounty.winnerCount} winners)
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold" style={{ background: "#1E2127", color: "#9CA3AF", border: "1px solid #2E333D" }}>
                  <ManualBadgeIcon /> Manual ({bounty.winnerCount} winners)
                </div>
              )}
            </div>

            {/* Entry fee */}
            {hasEntryFee && (
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-[#5A6070]">Entry Fee</span>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold" style={{ background: "#F59E0B18", color: "#F59E0B", border: "1px solid #F59E0B40" }}>
                  <TonDiamond size={12} />
                  {bounty.entryFee} TON
                </div>
              </div>
            )}

            {/* Type */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#5A6070]">Bounty Type</span>
              <span className="text-xs font-semibold text-[#C8CDD8] capitalize">{bounty.type}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="px-4 mb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#5A6070] mb-2">Description</p>
          <div className="rounded-2xl p-4" style={{ background: "#111317", border: "1px solid #1E2127" }}>
            <p className="text-sm text-[#C8CDD8] leading-relaxed">{bounty.description}</p>
          </div>
        </div>

        {/* Participants preview */}
        <div className="px-4 mb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#5A6070] mb-2">Participants</p>
          <div className="rounded-2xl p-4" style={{ background: "#111317", border: "1px solid #1E2127" }}>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {["#B5F23A", "#60A5FA", "#A78BFA", "#F59E0B"].map((c, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: c, color: "#0D0E10", border: "2px solid #111317" }}
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <p className="text-xs text-[#9CA3AF]">
                +{(bounty.participants - 4).toLocaleString()} more joined
              </p>
            </div>
          </div>
        </div>

        {/* Submission status if participated */}
        {participated && (
          <div className="px-4 mb-4">
            <div
              className="rounded-2xl p-4 flex items-center gap-3"
              style={{ background: "#0F1A0D", border: "1.5px solid #B5F23A40" }}
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#B5F23A20" }}>
                <span className="text-lg">✓</span>
              </div>
              <div>
                <p className="font-semibold text-sm text-[#B5F23A]">Proof Submitted</p>
                <p className="text-xs text-[#5A6070] mt-0.5">Awaiting review &mdash; you&apos;ll be notified if you win.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── CTA bar ── */}
      <div
        className="absolute left-0 right-0 px-4 py-3"
        style={{ bottom: 64, background: "linear-gradient(to top, #0D0E10 60%, transparent)" }}
      >
        {!isConnected ? (
          <div
            className="p-3 rounded-2xl text-center text-xs text-[#9CA3AF]"
            style={{ background: "#111317", border: "1px solid #1E2127" }}
          >
            Connect your wallet in Profile to participate
          </div>
        ) : seconds === 0 ? (
          <div
            className="py-3.5 rounded-2xl text-center text-sm font-bold text-[#5A6070]"
            style={{ background: "#1A1D22", border: "1px solid #2E333D" }}
          >
            Bounty Ended
          </div>
        ) : participated ? (
          <div
            className="py-3.5 rounded-2xl text-center text-sm font-bold text-[#B5F23A]"
            style={{ background: "#B5F23A18", border: "1.5px solid #B5F23A40" }}
          >
            Proof Submitted ✓
          </div>
        ) : (
          <button
            onClick={handleParticipateClick}
            className="w-full py-3.5 rounded-2xl font-bold text-sm text-[#0D0E10] press-scale"
            style={{ background: "#B5F23A", boxShadow: "0 0 18px 3px #B5F23A30" }}
          >
            {hasEntryFee ? `Participate · ${bounty.entryFee} TON Entry` : "Participate"}
          </button>
        )}
      </div>

      <BottomNav />

      {/* ── Entry fee choice sheet ── */}
      {participateState.status === "entry_fee_choice" && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.72)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setParticipateState({ status: "idle" }); }}
        >
          <div
            className="w-full max-w-[390px] rounded-t-3xl p-5"
            style={{ background: "#111317", border: "1px solid #1E2127" }}
          >
            <div className="flex justify-center mb-4">
              <div className="w-10 h-1 rounded-full" style={{ background: "#2E333D" }} />
            </div>
            <p className="font-bold text-base text-[#EAEAEA] mb-1">Pay Entry Fee</p>
            <p className="text-sm text-[#9CA3AF] mb-5">
              This bounty requires a{" "}
              <span className="text-[#B5F23A] font-semibold">{bounty.entryFee} TON</span>{" "}
              entry fee. Choose how to pay:
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handlePayTon}
                disabled={payingFee}
                className="w-full py-3.5 rounded-2xl font-bold text-sm text-[#0D0E10] press-scale flex items-center justify-center gap-2"
                style={{ background: payingFee ? "#8BAF2A" : "#B5F23A" }}
              >
                {payingFee && <SpinnerIcon size={16} color="#0D0E10" />}
                {payingFee ? "Awaiting Wallet..." : "Pay with TON"}
              </button>
              <button
                onClick={() => setParticipateState({ status: "swap" })}
                className="w-full py-3.5 rounded-2xl font-bold text-sm press-scale"
                style={{ background: "#1A1D22", color: "#B5F23A", border: "1.5px solid #B5F23A40" }}
              >
                Swap Another Token via Omniston
              </button>
              <button
                onClick={() => setParticipateState({ status: "idle" })}
                className="w-full py-2 rounded-2xl text-sm text-[#5A6070] font-semibold press-scale"
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
          onSuccess={handleSwapSuccess}
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
