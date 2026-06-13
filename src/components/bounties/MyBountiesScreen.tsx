"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  TonDiamond,
  ClockIcon,
  PeopleIcon,
  RocketBountyIcon,
  XBountyIcon,
  ChartBountyIcon,
  CodeBountyIcon,
  StarBountyIcon,
  TrophyBountyIcon,
  SpinnerIcon,
} from "@/components/icons";
import { cn, formatCountdown, formatTON } from "@/lib/utils";
import { getUserBounties } from "@/lib/api";
import { useWallet } from "@/hooks/useTonWallet";
import type { UserBounty, BountyRole } from "@/lib/types";

const ICON_MAP = {
  rocket: RocketBountyIcon,
  x: XBountyIcon,
  chart: ChartBountyIcon,
  code: CodeBountyIcon,
  star: StarBountyIcon,
  trophy: TrophyBountyIcon,
};

function StatusBadge({ status }: { status: UserBounty["status"] }) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1.5 flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold bg-lime-subtle text-lime-dim border border-lime-border">
        <span className="w-1.5 h-1.5 rounded-full bg-lime" />
        Active
      </span>
    );
  }
  if (status === "won") {
    return (
      <span className="inline-flex items-center flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold bg-yellow-50 text-yellow-600 border border-yellow-200">
        Won
      </span>
    );
  }
  if (status === "closed") {
    return (
      <span className="inline-flex items-center flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white text-lime-dim border border-lime-border">
        Closed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold bg-surface-tint text-slate-400 border border-surface-border">
      Ended
    </span>
  );
}

function UserBountyRow({
  bounty,
  onReview,
  onRefund,
}: {
  bounty: UserBounty;
  onReview?: (id: string) => void;
  onRefund?: (id: string) => void;
}) {
  const [seconds, setSeconds] = useState(bounty.timeLeftSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (bounty.status !== "active") return;
    intervalRef.current = setInterval(() => {
      setSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [bounty.status]);

  const BountyIcon = ICON_MAP[bounty.icon];
  const isUrgent = seconds > 0 && seconds < 3600;

  return (
    <div className="bg-white rounded-2xl border border-surface-border shadow-sm p-4 mb-3">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-surface-tint flex items-center justify-center flex-shrink-0">
          <div className="scale-75 origin-center">
            <BountyIcon />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <p className="font-semibold text-sm text-slate-900 leading-snug line-clamp-1 flex-1">
              {bounty.title}
            </p>
            <StatusBadge status={bounty.status} />
          </div>

          <div className="flex items-center gap-4 mb-1.5">
            <div className="flex items-center gap-1">
              <TonDiamond size={12} />
              <span className="text-xs font-bold text-lime-dim">{formatTON(bounty.poolAmount)} TON</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <PeopleIcon size={12} />
              <span>{bounty.participants}</span>
            </div>
          </div>

          {bounty.status === "active" && (
            <div className="flex items-center gap-1">
              <ClockIcon size={12} color={isUrgent ? "#F87171" : "#7A8099"} />
              <span className={cn("font-mono text-xs tabular-nums", isUrgent ? "text-red-400" : "text-slate-400")}>
                {formatCountdown(seconds)} left
              </span>
            </div>
          )}
          {bounty.status === "won" && (
            <p className="text-xs font-bold text-lime-dim">Won +{formatTON(bounty.perWinnerAmount)} TON</p>
          )}
          {bounty.status === "ended" && bounty.role === "joined" && (
            <p className="text-xs text-slate-400">Ended</p>
          )}
          {bounty.status === "ended" && bounty.role === "created" && (
            <p className="text-xs text-slate-400">Deadline passed — no prize distributed</p>
          )}
        </div>
      </div>

      {bounty.role === "created" && (
        <div className="mt-2 flex items-center gap-3">
          {onReview && (
            <button
              onClick={() => onReview(bounty.id)}
              className="text-xs font-semibold text-lime-dim hover:text-text-primary transition-colors duration-150 press-scale"
            >
              {bounty.status === "ended" ? "Review & Refund →" : "Review Submissions →"}
            </button>
          )}
          {bounty.status === "ended" && onRefund && (
            <button
              onClick={() => onRefund(bounty.id)}
              className="text-xs font-semibold text-red-400 border border-red-200 rounded-lg px-2.5 py-1 press-scale"
            >
              Claim Refund
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState({ role }: { role: BountyRole }) {
  return (
    <div className="bg-white rounded-2xl border border-surface-border shadow-sm flex flex-col items-center justify-center py-14 px-6 gap-3 text-center">
      <div className="w-16 h-16 rounded-2xl bg-surface-tint border border-surface-border flex items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          {role === "joined" ? (
            <>
              <circle cx="11" cy="11" r="7" stroke="#A8AEBF" strokeWidth="1.5" />
              <path d="M17 17L21 21" stroke="#A8AEBF" strokeWidth="1.5" strokeLinecap="round" />
            </>
          ) : (
            <>
              <rect x="5" y="4" width="14" height="17" rx="2" stroke="#A8AEBF" strokeWidth="1.5" />
              <path d="M9 9H15M9 13H13" stroke="#A8AEBF" strokeWidth="1.5" strokeLinecap="round" />
            </>
          )}
        </svg>
      </div>
      <p className="text-lg font-bold text-slate-900">
        {role === "joined" ? "No bounties joined yet" : "No bounties created yet"}
      </p>
      <p className="text-sm text-slate-500 leading-relaxed" style={{ maxWidth: 260 }}>
        {role === "joined"
          ? "Browse Discover to find bounties and start earning TON"
          : "Create your first bounty using the + button on Discover"}
      </p>
    </div>
  );
}

function ClosedEmptyState() {
  return (
    <div className="bg-white rounded-2xl border border-surface-border shadow-sm flex flex-col items-center justify-center py-14 px-6 gap-3 text-center">
      <div className="w-16 h-16 rounded-2xl bg-surface-tint border border-surface-border flex items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path d="M9 12L11 14L15 10" stroke="#A8AEBF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="4" y="4" width="16" height="16" rx="3" stroke="#A8AEBF" strokeWidth="1.5" />
        </svg>
      </div>
      <p className="text-lg font-bold text-slate-900">No closed bounties</p>
      <p className="text-sm text-slate-500 leading-relaxed" style={{ maxWidth: 260 }}>
        Bounties you finalize and distribute prizes for will appear here
      </p>
    </div>
  );
}

function WalletGate({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="bg-white rounded-3xl shadow-md p-10 text-center flex flex-col items-center mt-6">
      <div
        className="w-20 h-20 rounded-3xl bg-surface-tint flex items-center justify-center"
        style={{ boxShadow: "0 0 20px 4px rgba(181,242,58,0.25)" }}
      >
        <TonDiamond size={48} />
      </div>
      <h2 className="text-xl font-bold text-slate-900 mt-4">Connect Wallet</h2>
      <p className="text-slate-500 text-sm mt-2 leading-relaxed" style={{ maxWidth: 280 }}>
        Connect your TON wallet to view the bounties you&apos;ve joined and created.
      </p>
      <button
        onClick={onConnect}
        className="mt-6 w-full max-w-xs bg-lime text-dark font-bold rounded-xl py-3 px-5 text-sm press-scale"
      >
        Connect Wallet
      </button>
    </div>
  );
}

type Tab = "joined" | "created" | "closed";

export function MyBountiesScreen() {
  const { isConnected, rawAddress, connect } = useWallet();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("joined");
  const [allBounties, setAllBounties] = useState<UserBounty[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isConnected || !rawAddress) return;
    setLoading(true);
    setError("");
    getUserBounties(rawAddress)
      .then(setAllBounties)
      .catch(() => setError("Could not load your bounties."))
      .finally(() => setLoading(false));
  }, [isConnected, rawAddress]);

  function handleRefund(bountyId: string) {
    // Navigate to CreatorReviewScreen where the full contract-aware refund flow
    // lives. Calling requestRefund() directly here would mark the DB as closed
    // but leave TON locked in the escrow contract if one exists.
    router.push(`/review/${bountyId}`);
  }

  const bounties =
    tab === "joined"
      ? allBounties.filter((b) => b.role === "joined")
      : tab === "created"
      ? allBounties.filter((b) => b.role === "created" && b.status !== "closed")
      : allBounties.filter((b) => b.role === "created" && b.status === "closed");

  const closedCount = allBounties.filter((b) => b.role === "created" && b.status === "closed").length;

  const TABS: { key: Tab; label: string }[] = [
    { key: "joined", label: "Participating" },
    { key: "created", label: "Created" },
    { key: "closed", label: "Closed" },
  ];

  return (
    <div className="min-h-screen px-4 py-6 md:py-8 pb-20 md:pb-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">My Bounties</h1>

        {!isConnected ? (
          <WalletGate onConnect={connect} />
        ) : (
          <>
            <div className="mt-4 mb-5 bg-white border border-surface-border rounded-2xl p-1 flex gap-1 shadow-sm">
              {TABS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-sm transition-colors duration-150 press-scale relative",
                    tab === key
                      ? "bg-lime text-dark font-bold"
                      : "text-slate-500 font-medium hover:bg-surface-tint"
                  )}
                >
                  {label}
                  {key === "closed" && closedCount > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-lime text-dark text-[9px] font-bold flex items-center justify-center">
                      {closedCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <SpinnerIcon size={28} />
              </div>
            ) : error ? (
              <div className="bg-white rounded-2xl border border-surface-border shadow-sm flex flex-col items-center justify-center py-14 gap-3 text-center">
                <span className="text-3xl">⚠️</span>
                <p className="text-slate-500 text-sm font-medium">{error}</p>
              </div>
            ) : bounties.length === 0 ? (
              tab === "closed" ? (
                <ClosedEmptyState />
              ) : (
                <EmptyState role={tab === "joined" ? "joined" : "created"} />
              )
            ) : (
              bounties.map((b) => (
                <UserBountyRow
                  key={b.id}
                  bounty={b}
                  onReview={b.role === "created" ? (id) => router.push(`/review/${id}`) : undefined}
                  onRefund={b.role === "created" && b.status === "ended" ? handleRefund : undefined}
                />
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
