"use client";

import { useState, useEffect, useRef } from "react";
import { BottomNav } from "@/components/layout/BottomNav";
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
} from "@/components/icons";
import { cn, formatCountdown, formatTON } from "@/lib/utils";
import { USER_BOUNTIES } from "@/lib/data";
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
      <div
        className="inline-flex items-center gap-1.5 flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold"
        style={{ background: "#B5F23A18", color: "#B5F23A", border: "1px solid #B5F23A40" }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#B5F23A]" />
        Active
      </div>
    );
  }
  if (status === "won") {
    return (
      <div
        className="inline-flex items-center flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold"
        style={{ background: "#F59E0B18", color: "#F59E0B", border: "1px solid #F59E0B40" }}
      >
        Won
      </div>
    );
  }
  return (
    <div
      className="inline-flex items-center flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold"
      style={{ background: "#1E2127", color: "#5A6070" }}
    >
      Ended
    </div>
  );
}

function UserBountyRow({ bounty }: { bounty: UserBounty }) {
  const [seconds, setSeconds] = useState(bounty.timeLeftSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (bounty.status !== "active") return;
    intervalRef.current = setInterval(() => {
      setSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [bounty.status]);

  const BountyIcon = ICON_MAP[bounty.icon];
  const isUrgent = seconds > 0 && seconds < 3600;

  return (
    <div
      className="rounded-2xl p-4 mb-3 cursor-pointer press-scale"
      style={{ background: "#111317", border: "1.5px solid #1E2127" }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "#1A1F14" }}
        >
          <div className="scale-75 origin-center">
            <BountyIcon />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="font-semibold text-sm text-[#EAEAEA] leading-snug line-clamp-1 flex-1">
              {bounty.title}
            </p>
            <StatusBadge status={bounty.status} />
          </div>

          <div className="flex items-center gap-4 mb-1.5">
            <div className="flex items-center gap-1">
              <TonDiamond size={12} />
              <span className="text-xs font-bold text-[#B5F23A]">
                {formatTON(bounty.poolAmount)} TON
              </span>
            </div>
            <div className="flex items-center gap-1">
              <PeopleIcon size={12} />
              <span className="text-xs text-[#9CA3AF]">{bounty.participants}</span>
            </div>
          </div>

          {bounty.status === "active" && (
            <div className="flex items-center gap-1">
              <ClockIcon size={12} color={isUrgent ? "#F87171" : "#9CA3AF"} />
              <span
                className={cn(
                  "font-mono text-xs tabular-nums",
                  isUrgent ? "text-red-400" : "text-[#9CA3AF]"
                )}
              >
                {formatCountdown(seconds)} left
              </span>
            </div>
          )}
          {bounty.status === "won" && (
            <p className="text-xs font-bold text-[#B5F23A]">
              Won +{formatTON(bounty.perWinnerAmount)} TON
            </p>
          )}
          {bounty.status === "ended" && bounty.role === "joined" && (
            <p className="text-xs text-[#5A6070]">Ended</p>
          )}
          {bounty.status === "ended" && bounty.role === "created" && (
            <p className="text-xs text-[#5A6070]">
              Ended · {bounty.winnerCount} winner{bounty.winnerCount > 1 ? "s" : ""} selected
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ role }: { role: BountyRole }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: "#141619", border: "1px solid #1E2127" }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          {role === "joined" ? (
            <>
              <circle cx="11" cy="11" r="7" stroke="#5A6070" strokeWidth="1.5" />
              <path d="M17 17L21 21" stroke="#5A6070" strokeWidth="1.5" strokeLinecap="round" />
            </>
          ) : (
            <>
              <rect x="5" y="4" width="14" height="17" rx="2" stroke="#5A6070" strokeWidth="1.5" />
              <path d="M9 9H15M9 13H13" stroke="#5A6070" strokeWidth="1.5" strokeLinecap="round" />
            </>
          )}
        </svg>
      </div>
      <p className="text-sm font-semibold text-[#EAEAEA]">
        {role === "joined" ? "No bounties joined yet" : "No bounties created yet"}
      </p>
      <p className="text-xs text-[#5A6070] text-center leading-relaxed" style={{ maxWidth: 220 }}>
        {role === "joined"
          ? "Browse Discover to find bounties and start earning TON"
          : "Creating bounties is coming soon"}
      </p>
    </div>
  );
}

export function MyBountiesScreen() {
  const [role, setRole] = useState<BountyRole>("joined");
  const bounties = USER_BOUNTIES.filter((b) => b.role === role);

  return (
    <div className="flex flex-col h-full relative">
      <header className="px-5 pt-6 pb-4 flex-shrink-0">
        <h1 className="text-[17px] font-bold text-[#EAEAEA] text-center">My Bounties</h1>
      </header>

      <div className="px-4 mb-4 flex-shrink-0">
        <div
          className="flex gap-1 p-1 rounded-2xl"
          style={{ background: "#141619", border: "1px solid #1E2127" }}
        >
          {(["joined", "created"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={cn(
                "flex-1 py-2 rounded-xl text-sm font-semibold transition-all duration-200 press-scale",
                role === r ? "text-[#EAEAEA]" : "text-[#5A6070]"
              )}
              style={role === r ? { background: "#1E2127" } : {}}
            >
              {r === "joined" ? "Participating" : "Created"}
            </button>
          ))}
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto scrollbar-hide px-4"
        style={{ paddingBottom: 90 }}
      >
        {bounties.length === 0 ? (
          <EmptyState role={role} />
        ) : (
          bounties.map((b) => <UserBountyRow key={b.id} bounty={b} />)
        )}
      </div>

      <BottomNav />
    </div>
  );
}
