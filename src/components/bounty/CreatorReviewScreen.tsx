"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTonConnectUI } from "@tonconnect/ui-react";
import {
  TonDiamond,
  PeopleIcon,
  SpinnerIcon,
  RocketBountyIcon,
  XBountyIcon,
  ChartBountyIcon,
  CodeBountyIcon,
  StarBountyIcon,
  TrophyBountyIcon,
} from "@/components/icons";
import { formatTON } from "@/lib/utils";
import { getSubmissions, updateSubmission, closeBounty } from "@/lib/api";
import { useWallet } from "@/hooks/useTonWallet";
import type { Submission, ReviewBounty, SubmissionStatus } from "@/lib/types";

const ICON_MAP = {
  rocket: RocketBountyIcon,
  x: XBountyIcon,
  chart: ChartBountyIcon,
  code: CodeBountyIcon,
  star: StarBountyIcon,
  trophy: TrophyBountyIcon,
};

function StatusChip({ status }: { status: SubmissionStatus }) {
  if (status === "approved") {
    return (
      <span
        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold"
        style={{ background: "#B5F23A20", color: "#B5F23A", border: "1px solid #B5F23A40" }}
      >
        Winner
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span
        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold"
        style={{ background: "#F8717120", color: "#F87171", border: "1px solid #F8717140" }}
      >
        Rejected
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold"
      style={{ background: "#1E2127", color: "#9CA3AF" }}
    >
      Pending
    </span>
  );
}

function SubmissionCard({
  sub,
  canApprove,
  locked,
  onStatusChange,
}: {
  sub: Submission;
  canApprove: boolean;
  locked: boolean;
  onStatusChange: (id: string, status: SubmissionStatus) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const shortAddr = sub.walletAddress.slice(0, 6) + "..." + sub.walletAddress.slice(-4);
  const submittedDate = new Date(sub.submittedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleAction = async (status: SubmissionStatus) => {
    setBusy(true);
    try { await onStatusChange(sub.id, status); } finally { setBusy(false); }
  };

  return (
    <div
      className="rounded-2xl p-4 mb-3"
      style={{ background: "#111317", border: "1.5px solid #1E2127" }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: "#1A1D22", color: "#9CA3AF" }}
          >
            {sub.walletAddress.slice(0, 2).toUpperCase()}
          </div>
          <span className="text-xs text-[#9CA3AF] font-mono">{shortAddr}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#5A6070]">{submittedDate}</span>
          <StatusChip status={sub.status} />
        </div>
      </div>

      <div
        className="rounded-xl p-3 mb-3"
        style={{ background: "#0D0E10", border: "1px solid #1E2127" }}
      >
        {sub.proofType === "link" ? (
          <a
            href={sub.content}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#B5F23A] underline break-all"
          >
            {sub.content}
          </a>
        ) : (
          <p className="text-xs text-[#C8CDD8] leading-relaxed">{sub.content}</p>
        )}
        {sub.notes && (
          <p className="text-[11px] text-[#5A6070] mt-2 leading-relaxed">{sub.notes}</p>
        )}
      </div>

      {!locked && sub.status === "pending" && (
        <div className="flex gap-2">
          <button
            disabled={!canApprove || busy}
            onClick={() => handleAction("approved")}
            className="flex-1 py-2 rounded-xl text-xs font-bold press-scale disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: canApprove && !busy ? "#B5F23A" : "#1A1D22",
              color: canApprove && !busy ? "#0D0E10" : "#5A6070",
            }}
          >
            {busy ? "..." : canApprove ? "Mark Winner" : "Limit Reached"}
          </button>
          <button
            disabled={busy}
            onClick={() => handleAction("rejected")}
            className="flex-1 py-2 rounded-xl text-xs font-bold press-scale disabled:opacity-40"
            style={{ background: "#1A1D22", color: "#F87171", border: "1px solid #F8717130" }}
          >
            {busy ? "..." : "Reject"}
          </button>
        </div>
      )}

      {!locked && sub.status === "approved" && (
        <button
          disabled={busy}
          onClick={() => handleAction("rejected")}
          className="w-full py-2 rounded-xl text-xs font-semibold press-scale disabled:opacity-40"
          style={{ background: "#1A1D22", color: "#F87171" }}
        >
          {busy ? "..." : "Undo Winner"}
        </button>
      )}
    </div>
  );
}

export function CreatorReviewScreen({ bountyId }: { bountyId: string }) {
  const router = useRouter();
  const [tonConnectUI] = useTonConnectUI();
  const { rawAddress } = useWallet();

  const [bounty, setBounty] = useState<ReviewBounty | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [approvedCount, setApprovedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [finalizing, setFinalizing] = useState(false);
  const [finalizeError, setFinalizeError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    getSubmissions(bountyId)
      .then(({ bounty: b, submissions: s, approvedCount: ac }) => {
        setBounty(b);
        setSubmissions(s);
        setApprovedCount(ac);
      })
      .catch(() => setError("Could not load submissions."))
      .finally(() => setLoading(false));
  }, [bountyId]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = useCallback(
    async (submissionId: string, status: SubmissionStatus) => {
      setActionError("");
      const prev = submissions.find((s) => s.id === submissionId);
      try {
        await updateSubmission(bountyId, submissionId, status);
        setSubmissions((list) =>
          list.map((s) => (s.id === submissionId ? { ...s, status } : s))
        );
        if (prev) {
          setApprovedCount((c) => {
            if (status === "approved" && prev.status !== "approved") return c + 1;
            if (status !== "approved" && prev.status === "approved") return Math.max(0, c - 1);
            return c;
          });
        }
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Action failed.");
      }
    },
    [bountyId, submissions]
  );

  const handleFinalize = useCallback(async () => {
    if (!bounty || !rawAddress) return;
    const winners = submissions.filter((s) => s.status === "approved");
    if (!winners.length) return;

    setFinalizing(true);
    setFinalizeError("");

    const nanotons = BigInt(Math.round(parseFloat(bounty.perWinnerAmount) * 1e9)).toString();

    try {
      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: winners.map((w) => ({
          address: w.walletAddress,
          amount: nanotons,
        })),
      });
    } catch (txErr) {
      setFinalizeError(txErr instanceof Error ? txErr.message : "Wallet rejected the transaction.");
      setFinalizing(false);
      return;
    }

    try {
      await closeBounty(bountyId, rawAddress);
      setBounty((b) => (b ? { ...b, status: "closed" } : b));
    } catch (dbErr) {
      setFinalizeError(
        `Prizes sent! But the bounty could not be marked as closed: ${dbErr instanceof Error ? dbErr.message : String(dbErr)}`
      );
    } finally {
      setFinalizing(false);
    }
  }, [bounty, bountyId, rawAddress, submissions, tonConnectUI]);

  const isClosed = bounty?.status === "closed";
  const canApprove = bounty ? approvedCount < bounty.winnerCount : false;
  const canFinalize = approvedCount > 0 && !isClosed;
  const BountyIcon = bounty ? ICON_MAP[bounty.icon] : null;

  return (
    <div className="flex flex-col h-full relative">
      <header
        className="flex-shrink-0 flex items-center gap-3 px-4 pt-5 pb-4"
        style={{ borderBottom: "1px solid #1E2127" }}
      >
        <button
          onClick={() => router.back()}
          className="w-8 h-8 rounded-xl flex items-center justify-center press-scale flex-shrink-0"
          style={{ background: "#1A1D22" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="text-[15px] font-bold text-[#EAEAEA] flex-1 truncate">
          {isClosed ? "Bounty Closed" : "Review Submissions"}
        </h1>
        {isClosed && (
          <span
            className="px-2.5 py-1 rounded-full text-[10px] font-bold flex-shrink-0"
            style={{ background: "#B5F23A20", color: "#B5F23A", border: "1px solid #B5F23A40" }}
          >
            Closed
          </span>
        )}
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-4" style={{ paddingBottom: 32 }}>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <SpinnerIcon size={28} />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <span className="text-3xl">⚠️</span>
            <p className="text-sm text-[#5A6070]">{error}</p>
          </div>
        ) : bounty ? (
          <>
            <div
              className="rounded-2xl p-4 mt-4 mb-4"
              style={{ background: "#111317", border: "1.5px solid #1E2127" }}
            >
              <div className="flex items-center gap-3">
                {BountyIcon && (
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "#1A1F14" }}
                  >
                    <div className="scale-75 origin-center">
                      <BountyIcon />
                    </div>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[#EAEAEA] leading-snug truncate">{bounty.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1">
                      <TonDiamond size={11} />
                      <span className="text-xs font-bold text-[#B5F23A]">{formatTON(bounty.poolAmount)} TON</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <PeopleIcon size={11} />
                      <span className="text-xs text-[#9CA3AF]">{submissions.length} submissions</span>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="mt-3 rounded-xl px-3 py-2 flex items-center justify-between"
                style={{ background: "#0D0E10" }}
              >
                <span className="text-xs text-[#5A6070]">Winners selected</span>
                <span
                  className="text-sm font-bold"
                  style={{ color: approvedCount >= bounty.winnerCount ? "#B5F23A" : "#EAEAEA" }}
                >
                  {approvedCount} / {bounty.winnerCount}
                </span>
              </div>

              <div
                className="mt-2 rounded-xl px-3 py-2 flex items-center justify-between"
                style={{ background: "#0D0E10" }}
              >
                <span className="text-xs text-[#5A6070]">Prize per winner</span>
                <div className="flex items-center gap-1">
                  <TonDiamond size={11} />
                  <span className="text-sm font-bold text-[#B5F23A]">{formatTON(bounty.perWinnerAmount)} TON</span>
                </div>
              </div>
            </div>

            {canFinalize && (
              <div className="mb-4">
                {approvedCount < bounty.winnerCount && (
                  <p className="text-[11px] text-[#5A6070] text-center mb-2">
                    {bounty.winnerCount - approvedCount} winner slot{bounty.winnerCount - approvedCount > 1 ? "s" : ""} still open — you can finalize early
                  </p>
                )}
                <button
                  disabled={finalizing}
                  onClick={handleFinalize}
                  className="w-full py-3.5 rounded-2xl font-bold text-sm text-[#0D0E10] press-scale disabled:opacity-60"
                  style={{ background: "#B5F23A", boxShadow: "0 0 18px 3px #B5F23A30" }}
                >
                  {finalizing
                    ? "Sending prizes..."
                    : `Distribute ${formatTON(bounty.perWinnerAmount)} TON to ${approvedCount} winner${approvedCount > 1 ? "s" : ""}`}
                </button>
                {finalizeError && (
                  <div
                    className="mt-2 rounded-xl px-3 py-2 text-xs"
                    style={{ background: "#F8717120", color: "#F87171", border: "1px solid #F8717140" }}
                  >
                    {finalizeError}
                  </div>
                )}
              </div>
            )}

            {isClosed && (
              <div
                className="mb-4 rounded-2xl px-4 py-3 flex items-center gap-3"
                style={{ background: "#B5F23A15", border: "1px solid #B5F23A40" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                  <path d="M20 6L9 17L4 12" stroke="#B5F23A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div>
                  <p className="text-xs font-bold text-[#B5F23A]">Bounty closed</p>
                  <p className="text-[11px] text-[#5A6070] mt-0.5">
                    Prizes have been distributed to {approvedCount} winner{approvedCount !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            )}

            {actionError && (
              <div
                className="rounded-xl px-3 py-2 mb-3 text-xs"
                style={{ background: "#F8717120", color: "#F87171", border: "1px solid #F8717140" }}
              >
                {actionError}
              </div>
            )}

            {submissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: "#141619", border: "1px solid #1E2127" }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <rect x="5" y="4" width="14" height="17" rx="2" stroke="#5A6070" strokeWidth="1.5" />
                    <path d="M9 9H15M9 13H13" stroke="#5A6070" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-[#EAEAEA]">No submissions yet</p>
                <p className="text-xs text-[#5A6070] text-center" style={{ maxWidth: 200 }}>
                  Participants will show here once they submit their proof
                </p>
              </div>
            ) : (
              submissions.map((s) => (
                <SubmissionCard
                  key={s.id}
                  sub={s}
                  canApprove={canApprove || s.status === "approved"}
                  locked={isClosed}
                  onStatusChange={handleStatusChange}
                />
              ))
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
