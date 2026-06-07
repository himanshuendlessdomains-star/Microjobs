"use client";

import { useEffect, useRef, useState } from "react";
import {
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
} from "@/components/icons";
import { cn, formatCountdown, formatTON } from "@/lib/utils";
import type { Bounty } from "@/lib/types";

const ICON_MAP = {
  rocket: RocketBountyIcon,
  x: XBountyIcon,
  chart: ChartBountyIcon,
  code: CodeBountyIcon,
  star: StarBountyIcon,
  trophy: TrophyBountyIcon,
};

function WinnerBadge({ type }: { type: "draw" | "manual" }) {
  if (type === "draw") {
    return (
      <div
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
        style={{
          background: "#B5F23A18",
          color: "#B5F23A",
          border: "1px solid #B5F23A40",
        }}
      >
        <DrawBadgeIcon />
        Draw
      </div>
    );
  }
  return (
    <div
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
      style={{
        background: "#1E2127",
        color: "#9CA3AF",
        border: "1px solid #2E333D",
      }}
    >
      <ManualBadgeIcon />
      Manual
    </div>
  );
}

interface BountyCardProps {
  bounty: Bounty;
}

export function BountyCard({ bounty }: BountyCardProps) {
  const [seconds, setSeconds] = useState(bounty.timeLeftSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const isUrgent = seconds > 0 && seconds < 3600;
  const BountyIcon = ICON_MAP[bounty.icon];

  return (
    <div
      className={cn(
        "rounded-2xl p-4 mb-3 relative overflow-hidden transition-all duration-200 cursor-pointer",
        "hover:scale-[1.01] active:scale-[0.99]",
        bounty.isHot && "animate-pulse-lime"
      )}
      style={{
        background: bounty.isHot
          ? "linear-gradient(135deg, #13150D 0%, #0F1209 100%)"
          : "#111317",
        border: bounty.isHot ? "1.5px solid #B5F23A" : "1.5px solid #1E2127",
        boxShadow: bounty.isHot ? "0 0 20px 3px #B5F23A28" : "none",
      }}
    >
      {/* Hot badge */}
      {bounty.isHot && (
        <div
          className="absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full"
          style={{ background: "#B5F23A", color: "#0D0E10" }}
        >
          Hot 🔥
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "#1A1F14" }}
        >
          <BountyIcon />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p
            className="font-semibold text-sm leading-snug mb-3 text-[#EAEAEA]"
            style={{ paddingRight: bounty.isHot ? 64 : 0 }}
          >
            {bounty.title}
          </p>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
            {/* Pool */}
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider mb-1 text-[#5A6070]">
                Pool
              </p>
              <div className="flex items-center gap-1.5">
                <TonDiamond size={14} />
                <span className="font-bold text-sm text-[#B5F23A]">
                  {formatTON(bounty.poolAmount)} TON
                </span>
              </div>
            </div>

            {/* Time Left */}
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider mb-1 text-[#5A6070]">
                Time Left
              </p>
              <div className="flex items-center gap-1.5">
                <ClockIcon color={isUrgent ? "#F87171" : undefined} />
                <span
                  className={cn(
                    "font-mono text-sm font-semibold tabular-nums",
                    isUrgent ? "text-red-400" : "text-[#C8CDD8]",
                    seconds === 0 && "text-[#5A6070]"
                  )}
                >
                  {seconds === 0 ? "Ended" : formatCountdown(seconds)}
                </span>
              </div>
            </div>

            {/* Participants */}
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider mb-1 text-[#5A6070]">
                Participants
              </p>
              <div className="flex items-center gap-1.5">
                <PeopleIcon />
                <span className="text-sm font-semibold text-[#C8CDD8]">
                  {bounty.participants.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Winner Type */}
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider mb-1 text-[#5A6070]">
                Winner Type
              </p>
              <WinnerBadge type={bounty.winnerSelection} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
