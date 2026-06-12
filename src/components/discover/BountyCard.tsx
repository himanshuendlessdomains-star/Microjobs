"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
import type { Bounty, Category } from "@/lib/types";

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
};

function CategoryChip({ category }: { category: Category }) {
  const color = CATEGORY_COLORS[category] ?? "#7A8099";
  return (
    <span
      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={{ background: `${color}1A`, color }}
    >
      {category}
    </span>
  );
}

function WinnerBadge({ type, dark }: { type: "draw" | "manual"; dark: boolean }) {
  if (type === "draw") {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
        style={{
          background: "#B5F23A15",
          color: dark ? "#B5F23A" : "#8BBD1E",
          border: "1px solid #B5F23A40",
        }}
      >
        <DrawBadgeIcon size={11} />
        Draw
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold",
        dark
          ? "bg-dark-elevated text-ink-muted border border-dark-border"
          : "bg-surface-tint text-slate-500 border border-surface-border"
      )}
    >
      <ManualBadgeIcon size={11} />
      Manual
    </span>
  );
}

interface BountyCardProps {
  bounty: Bounty;
  onClick?: () => void;
}

export function BountyCard({ bounty, onClick }: BountyCardProps) {
  const router = useRouter();
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
  const handleClick = onClick ?? (() => router.push(`/bounty/${bounty.id}`));

  /* ── HOT — dark featured card ── */
  if (bounty.isHot) {
    return (
      <div
        onClick={handleClick}
        className="relative bg-dark-card rounded-2xl border border-lime-border shadow-[0_0_20px_4px_rgba(181,242,58,0.12)] p-4 cursor-pointer press-scale animate-pulse-lime"
      >
        <div className="absolute top-3 right-3 bg-lime text-dark text-[10px] font-black px-2 py-0.5 rounded-full">
          Hot 🔥
        </div>

        <div className="flex items-center justify-between">
          <div className="w-10 h-10 bg-dark-elevated rounded-xl flex items-center justify-center flex-shrink-0">
            <div className="scale-75">
              <BountyIcon />
            </div>
          </div>
          <div className="pr-14">
            <CategoryChip category={bounty.category} />
          </div>
        </div>

        <p className="mt-3 font-semibold text-sm text-ink-primary leading-snug line-clamp-2">
          {bounty.title}
        </p>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <TonDiamond size={12} />
            <span className="text-lime font-black text-base">
              {formatTON(bounty.poolAmount)} TON
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <ClockIcon size={14} color={isUrgent ? "#F87171" : "#9CA3AF"} />
            <span
              className={cn(
                "font-mono text-xs font-semibold tabular-nums",
                isUrgent ? "text-urgent" : "text-ink-muted",
                seconds === 0 && "text-ink-faint"
              )}
            >
              {seconds === 0 ? "Ended" : formatCountdown(seconds)}
            </span>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <PeopleIcon size={14} color="#5A6070" />
            <span className="text-ink-faint text-xs font-medium">
              {bounty.participants.toLocaleString()} joined
            </span>
          </div>
          <WinnerBadge type={bounty.winnerSelection} dark />
        </div>
      </div>
    );
  }

  /* ── NORMAL — light card ── */
  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-2xl border border-surface-border shadow-sm p-4 cursor-pointer press-scale hover:shadow-md transition-shadow duration-200"
    >
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 bg-surface-tint rounded-xl flex items-center justify-center flex-shrink-0">
          <div className="scale-75">
            <BountyIcon />
          </div>
        </div>
        <CategoryChip category={bounty.category} />
      </div>

      <p className="mt-3 font-semibold text-sm text-slate-900 leading-snug line-clamp-2">
        {bounty.title}
      </p>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <TonDiamond size={12} />
          <span className="text-lime font-bold text-sm">
            {formatTON(bounty.poolAmount)} TON
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <ClockIcon size={14} color={isUrgent ? "#F87171" : "#7A8099"} />
          <span
            className={cn(
              "font-mono text-xs font-semibold tabular-nums",
              isUrgent ? "text-urgent" : "text-slate-500",
              seconds === 0 && "text-slate-300"
            )}
          >
            {seconds === 0 ? "Ended" : formatCountdown(seconds)}
          </span>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <PeopleIcon size={14} color="#7A8099" />
          <span className="text-slate-500 text-xs font-medium">
            {bounty.participants.toLocaleString()} joined
          </span>
        </div>
        <WinnerBadge type={bounty.winnerSelection} dark={false} />
      </div>
    </div>
  );
}
