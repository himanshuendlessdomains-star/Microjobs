"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  TonDiamond,
  ChevronRightIcon,
  BellIcon,
  GlobeIcon,
  InfoIcon,
  ShareIcon,
  SpinnerIcon,
} from "@/components/icons";
import { formatTON } from "@/lib/utils";
import { useWallet } from "@/hooks/useTonWallet";
import { getUserStats, trackReferral } from "@/lib/api";
import type { UserStats } from "@/lib/types";

function StatCard({
  value,
  label,
  loading,
  lime,
  withDiamond,
}: {
  value: string;
  label: string;
  loading?: boolean;
  lime?: boolean;
  withDiamond?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-surface-border shadow-sm p-4 text-center">
      {loading ? (
        <div className="flex justify-center py-1">
          <SpinnerIcon size={18} color="#8BBD1E" />
        </div>
      ) : (
        <div className="flex items-center justify-center gap-1">
          {withDiamond && <TonDiamond size={14} />}
          <p className={`text-2xl font-black ${lime ? "text-lime-dim" : "text-slate-900"}`}>
            {value}
          </p>
        </div>
      )}
      <p className="text-xs text-slate-500 mt-1">{label}</p>
    </div>
  );
}

function SettingsRow({
  icon,
  label,
  sublabel,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  sublabel?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-4 hover:bg-surface-hover transition-colors duration-150 press-scale cursor-pointer border-b border-surface-border last:border-0"
    >
      <div className="w-9 h-9 bg-surface-tint rounded-lg flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 text-left min-w-0">
        <p className="text-sm font-medium text-slate-900">{label}</p>
        {sublabel && <p className="text-xs text-slate-400 mt-0.5 truncate">{sublabel}</p>}
      </div>
      <ChevronRightIcon size={18} color="#CBD5E1" />
    </button>
  );
}

function AboutModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl md:rounded-3xl p-6 w-full md:max-w-sm mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #B5F23A, #8BBD1E)" }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <polygon points="12,2 22,9 18,22 6,22 2,9" fill="#0D0E12" />
            </svg>
          </div>
          <div>
            <p className="font-black text-slate-900 text-lg">BountyHive</p>
            <p className="text-xs text-slate-400">Earn on TON</p>
          </div>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          BountyHive is an on-chain bounty platform built on the TON blockchain.
          Create or complete tasks and earn real TON rewards, paid automatically via smart contracts.
        </p>
        <p className="text-xs text-slate-400 mt-4">Version 1.0.0 — Built on TON</p>
        <button
          onClick={onClose}
          className="mt-5 w-full bg-surface-tint text-slate-700 font-semibold rounded-xl py-3 press-scale"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function ReferralCard({
  address,
  referralCount,
  loading,
}: {
  address: string;
  referralCount: number;
  loading: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const refLink = `${typeof window !== "undefined" ? window.location.origin : ""}/ref/${encodeURIComponent(address)}`;

  function copyLink() {
    navigator.clipboard.writeText(refLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  return (
    <div className="mt-4 bg-white rounded-2xl border border-surface-border shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-slate-900">Referral Program</p>
        {loading ? (
          <SpinnerIcon size={14} color="#8BBD1E" />
        ) : (
          <span className="text-xs text-lime-dim font-bold">{referralCount} referred</span>
        )}
      </div>
      <p className="text-xs text-slate-500 mb-3 leading-relaxed">
        Share your link and earn recognition when friends join BountyHive.
      </p>
      <div className="flex items-center gap-2 bg-surface-tint rounded-xl px-3 py-2.5">
        <p className="text-xs font-mono text-slate-600 flex-1 truncate">{refLink}</p>
        <button
          onClick={copyLink}
          className="text-xs font-semibold text-lime-dim shrink-0 press-scale"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}

export function ProfileScreen() {
  const router = useRouter();
  const { isConnected, rawAddress, friendlyAddress, shortAddress, connect, disconnect } = useWallet();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const didTrackRef = useRef(false);

  useEffect(() => {
    if (!isConnected || !rawAddress) {
      setStats(null);
      return;
    }
    setStatsLoading(true);
    getUserStats(rawAddress)
      .then(setStats)
      .catch(() => setStats({ created: 0, won: 0, earned: "0", referrals: 0 }))
      .finally(() => setStatsLoading(false));

    if (!didTrackRef.current) {
      didTrackRef.current = true;
      try {
        const refCode = localStorage.getItem("refCode");
        if (refCode && refCode !== rawAddress && refCode !== friendlyAddress) {
          void trackReferral(rawAddress, refCode).then(() => {
            localStorage.removeItem("refCode");
          }).catch(() => {});
        }
      } catch {
        // localStorage unavailable
      }
    }
  }, [isConnected, rawAddress, friendlyAddress]);

  function handleShare() {
    if (!rawAddress) return;
    const refLink = `${window.location.origin}/ref/${encodeURIComponent(rawAddress)}`;
    if (navigator.share) {
      void navigator.share({
        title: "BountyHive — Earn on TON",
        text: "Join BountyHive and earn TON by completing on-chain bounties!",
        url: refLink,
      });
    } else {
      void navigator.clipboard.writeText(refLink);
    }
  }

  const initials = friendlyAddress ? friendlyAddress.slice(0, 1).toUpperCase() : "?";

  return (
    <div className="min-h-screen px-4 py-6 md:py-8 pb-20 md:pb-8">
      <div className="max-w-xl mx-auto">
        {/* Profile header card */}
        <div className="bg-white rounded-3xl shadow-md p-6 text-center">
          <div
            className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #B5F23A, #8BBD1E)" }}
          >
            <span className="text-2xl font-black text-dark">{initials}</span>
          </div>
          {isConnected ? (
            <>
              <p className="mt-3 font-mono text-sm text-slate-500 bg-surface-tint px-3 py-1.5 rounded-lg inline-block">
                {shortAddress(friendlyAddress)}
              </p>
              <div>
                <button
                  type="button"
                  onClick={disconnect}
                  className="mt-3 text-xs text-red-400 border border-red-200 rounded-lg px-3 py-1.5 press-scale"
                >
                  Disconnect
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={connect}
              className="mt-4 w-full bg-lime text-dark font-bold rounded-xl py-3 px-5 press-scale"
            >
              Connect Wallet
            </button>
          )}
        </div>

        {/* Stats grid */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <StatCard
            value={String(stats?.created ?? 0)}
            label="Created"
            loading={statsLoading}
          />
          <StatCard
            value={String(stats?.won ?? 0)}
            label="Won"
            loading={statsLoading}
          />
          <StatCard
            value={formatTON(stats?.earned ?? "0")}
            label="TON Earned"
            loading={statsLoading}
            lime
            withDiamond
          />
        </div>

        {/* Referral card — only when connected */}
        {isConnected && rawAddress && (
          <ReferralCard
            address={rawAddress}
            referralCount={stats?.referrals ?? 0}
            loading={statsLoading}
          />
        )}

        {/* Settings */}
        <div className="mt-4 bg-white rounded-2xl border border-surface-border shadow-sm overflow-hidden">
          <SettingsRow
            icon={<BellIcon dot={false} size={18} color="#475569" />}
            label="Notifications"
            onClick={() => router.push("/notifications")}
          />
          <SettingsRow
            icon={<GlobeIcon size={18} color="#475569" />}
            label="Language"
            sublabel="English only"
            onClick={() => {}}
          />
          <SettingsRow
            icon={<InfoIcon size={18} color="#475569" />}
            label="About BountyHive"
            onClick={() => setShowAbout(true)}
          />
          <SettingsRow
            icon={<ShareIcon size={18} color="#475569" />}
            label="Share App"
            onClick={handleShare}
          />
        </div>
      </div>

      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </div>
  );
}
