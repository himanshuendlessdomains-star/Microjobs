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
import { formatTON, toFriendlyAddress, tonToNanoton } from "@/lib/utils";
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
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-lime-subtle text-lime-dim border border-lime-border">
        Winner
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-400 border border-red-200">
        Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-tint text-slate-400 border border-surface-border">
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
    <div className="bg-white rounded-2xl border border-surface-border shadow-sm p-4 mb-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-surface-tint flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0">
            {sub.walletAddress.slice(0, 2).toUpperCase()}
          </div>
          <span className="text-xs text-slate-500 font-mono truncate">{shortAddr}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-slate-400">{submittedDate}</span>
          <StatusChip status={sub.status} />
        </div>
      </div>

      <div className="bg-surface-tint rounded-xl p-3 mt-3 mb-3">
        {sub.proofType === "link" ? (
          <a
            href={sub.content}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-lime-dim underline break-all"
          >
            {sub.content}
          </a>
        ) : (
          <p className="text-sm text-slate-700 leading-relaxed">{sub.content}</p>
        )}
        {sub.notes && (
          <p className="text-xs text-slate-400 mt-1.5 italic leading-relaxed">{sub.notes}</p>
        )}
      </div>

      {!locked && sub.status === "pending" && (
        <div className="flex gap-2">
          <button
            disabled={!canApprove || busy}
            onClick={() => handleAction("approved")}
            className="flex-1 py-2 rounded-xl text-xs font-bold bg-lime text-dark press-scale disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {busy ? "..." : canApprove ? "Mark Winner" : "Limit Reached"}
          </button>
          <button
            disabled={busy}
            onClick={() => handleAction("rejected")}
            className="flex-1 py-2 rounded-xl text-xs font-bold border border-red-200 text-red-500 press-scale disabled:opacity-40 hover:bg-red-50 transition-colors duration-150"
          >
            {busy ? "..." : "Reject"}
          </button>
        </div>
      )}

      {!locked && sub.status === "approved" && (
        <button
          disabled={busy}
          onClick={() => handleAction("rejected")}
          className="w-full py-2 rounded-xl text-xs font-semibold border border-red-200 text-red-500 press-scale disabled:opacity-40 hover:bg-red-50 transition-colors duration-150"
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
  const [distributeStep, setDistributeStep] = useState<"idle" | "ready" | "signing" | "closing" | "done">("idle");

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
      try {
        await updateSubmission(bountyId, submissionId, status);
        setSubmissions((list) => {
          const updated = list.map((s) => (s.id === submissionId ? { ...s, status } : s));
          const newApproved = updated.filter((s) => s.status === "approved").length;
          setApprovedCount(newApproved);
          // When all winner slots are filled, prompt to distribute
          if (bounty && newApproved >= bounty.winnerCount) {
            setDistributeStep("ready");
          }
          return updated;
        });
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Action failed.");
      }
    },
    [bounty, bountyId]
  );

  const handleFinalize = useCallback(async () => {
    if (!bounty || !rawAddress) return;
    const winners = submissions.filter((s) => s.status === "approved");
    if (!winners.length) return;

    setFinalizing(true);
    setFinalizeError("");

    // Convert TON amount to nanotons using integer math (avoids float precision errors)
    const nanotons = tonToNanoton(bounty.perWinnerAmount);

    // Build messages: winner wallets are non-bounceable (UQ...) — raw 0:hex addresses
    // stored in DB must be converted to user-friendly format that TonConnect accepts.
    const messages = winners.map((w) => ({
      address: toFriendlyAddress(w.walletAddress, false),
      amount: nanotons,
    }));

    let txBoc: string | undefined;

    setDistributeStep("signing");
    try {
      const result = await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages,
      });
      txBoc = result?.boc;
    } catch (txErr) {
      const msg = txErr instanceof Error ? txErr.message : String(txErr);
      const isRejected = msg.toLowerCase().includes("reject") || msg.toLowerCase().includes("cancel") || msg.toLowerCase().includes("declined");
      setFinalizeError(isRejected ? "Transaction cancelled in wallet." : `Wallet error: ${msg}`);
      setFinalizing(false);
      setDistributeStep("idle");
      return;
    }

    setDistributeStep("closing");
    try {
      await closeBounty(bountyId, rawAddress, { winnerCount: winners.length, txBoc });
      setBounty((b) => (b ? { ...b, status: "closed" } : b));
      setDistributeStep("done");
    } catch {
      // Prizes were sent — only the DB update failed. Show a softer warning.
      setFinalizeError(
        `Prizes sent to ${winners.length} winner${winners.length > 1 ? "s" : ""}! Note: bounty status update failed — please contact support with tx reference.`
      );
      setDistributeStep("done");
    } finally {
      setFinalizing(false);
    }
  }, [bounty, bountyId, rawAddress, submissions, tonConnectUI]);

  const isClosed = bounty?.status === "closed" || distributeStep === "done";
  const canApprove = bounty ? approvedCount < bounty.winnerCount : false;
  const canFinalize = approvedCount > 0 && !isClosed;
  const allSlotsReady = bounty ? approvedCount >= bounty.winnerCount : false;
  const BountyIcon = bounty ? ICON_MAP[bounty.icon] : null;

  const distributeLabel = (() => {
    if (distributeStep === "signing") return "Waiting for wallet approval...";
    if (distributeStep === "closing") return "Recording on-chain...";
    if (distributeStep === "done") return "Prizes distributed!";
    const count = submissions.filter((s) => s.status === "approved").length;
    return `Distribute ${formatTON(bounty?.perWinnerAmount ?? "0")} TON to ${count} winner${count !== 1 ? "s" : ""}`;
  })();

  return (
    <div className="min-h-screen px-4 py-6 md:py-8">
      <div className="max-w-2xl mx-auto">
        <header className="flex items-center gap-3 sticky top-0 z-10 bg-[#F2F4FA]/90 backdrop-blur-md py-3 -mx-4 px-4">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 bg-white border border-surface-border rounded-xl shadow-sm flex items-center justify-center press-scale flex-shrink-0 hover:bg-surface-hover transition-colors duration-150"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="#3B3F55" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="font-semibold text-slate-900 flex-1 truncate">
            {isClosed ? "Bounty Closed" : "Review Submissions"}
          </h1>
          {isClosed && (
            <span className="bg-lime-subtle text-lime-dim border border-lime-border text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0">
              Closed
            </span>
          )}
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <SpinnerIcon size={28} />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <span className="text-3xl">⚠️</span>
            <p className="text-sm text-text-muted">{error}</p>
          </div>
        ) : bounty ? (
          <>
            <div className="mt-4 bg-white rounded-2xl shadow-md border border-surface-border p-5 mb-4">
              <div className="flex items-center gap-3">
                {BountyIcon && (
                  <div className="w-10 h-10 rounded-xl bg-surface-tint flex items-center justify-center flex-shrink-0">
                    <div className="scale-75 origin-center">
                      <BountyIcon />
                    </div>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-slate-900 leading-snug truncate">{bounty.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1">
                      <TonDiamond size={11} />
                      <span className="text-xs font-bold text-lime-dim">{formatTON(bounty.poolAmount)} TON</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <PeopleIcon size={11} />
                      <span className="text-xs text-slate-500">{submissions.length} submissions</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Winners selected</span>
                  <span className="text-xs font-bold text-slate-900">
                    {approvedCount}/{bounty.winnerCount}
                  </span>
                </div>
                <div className="h-2 bg-surface-tint rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="h-full bg-lime-DEFAULT rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (approvedCount / Math.max(1, bounty.winnerCount)) * 100)}%`,
                      background: "#B5F23A",
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-slate-500">Prize per winner</span>
                <div className="flex items-center gap-1">
                  <TonDiamond size={11} />
                  <span className="text-sm font-bold text-lime-dim">{formatTON(bounty.perWinnerAmount)} TON</span>
                </div>
              </div>
            </div>

            {canFinalize && (
              <div className="mb-4">
                {/* All slots filled — prominent "ready" banner */}
                {allSlotsReady && distributeStep === "ready" && (
                  <div className="bg-lime-subtle border border-lime-border rounded-2xl p-4 flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-lime-DEFAULT flex items-center justify-center flex-shrink-0">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2L13.09 8.26L19 7L14.74 11.74L20 14L13.74 14.91L15 21L10.26 16.74L7 22L7.91 15.74L2 14L7.26 10.26L6 4L11.74 8.26L12 2Z" fill="#0D0E12" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900">All {bounty.winnerCount} winner{bounty.winnerCount !== 1 ? "s" : ""} selected!</p>
                      <p className="text-xs text-slate-500 mt-0.5">Tap below to send prizes to all winners at once.</p>
                    </div>
                  </div>
                )}

                {/* Partial winners warning */}
                {!allSlotsReady && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded-xl px-3 py-2 mb-3">
                    {bounty.winnerCount - approvedCount} winner slot{bounty.winnerCount - approvedCount > 1 ? "s" : ""} still open — you can finalize early or select more winners
                  </div>
                )}

                {/* Distribute button */}
                <button
                  disabled={finalizing || distributeStep === "signing" || distributeStep === "closing"}
                  onClick={handleFinalize}
                  className="w-full font-bold py-3.5 rounded-xl press-scale disabled:opacity-60 mt-2 text-sm flex items-center justify-center gap-2 transition-all duration-200"
                  style={{
                    background: allSlotsReady ? "#B5F23A" : "#B5F23A",
                    color: "#0D0E12",
                    boxShadow: allSlotsReady ? "0 0 20px 4px rgba(181,242,58,0.3)" : undefined,
                  }}
                >
                  {(distributeStep === "signing" || distributeStep === "closing") && (
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="#0D0E12" strokeWidth="3" strokeDasharray="31 63" />
                    </svg>
                  )}
                  {distributeLabel}
                </button>

                {finalizeError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-3 py-2 mt-3 leading-relaxed">
                    {finalizeError}
                  </div>
                )}
              </div>
            )}

            {isClosed && (
              <div className="bg-lime-subtle border border-lime-border rounded-2xl p-4 flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17L4 12" stroke="#8BBD1E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Bounty closed</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Prizes have been distributed to {approvedCount} winner{approvedCount !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            )}

            {actionError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-3 py-2 mb-3">
                {actionError}
              </div>
            )}

            {submissions.length === 0 ? (
              <div className="bg-white rounded-2xl border border-surface-border shadow-sm flex flex-col items-center justify-center py-12 gap-3 px-4">
                <div className="w-14 h-14 rounded-2xl bg-surface-tint flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <rect x="5" y="4" width="14" height="17" rx="2" stroke="#7A8099" strokeWidth="1.5" />
                    <path d="M9 9H15M9 13H13" stroke="#7A8099" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-slate-900">No submissions yet</p>
                <p className="text-xs text-slate-500 text-center" style={{ maxWidth: 220 }}>
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
