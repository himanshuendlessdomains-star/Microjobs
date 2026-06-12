"use client";

import { useEffect, useState, type ReactNode } from "react";
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
import { getUserBounties } from "@/lib/api";

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
          <p className={`text-2xl font-black ${lime ? "text-lime-dim" : "text-slate-900"}`}>{value}</p>
        </div>
      )}
      <p className="text-xs text-slate-500 mt-1">{label}</p>
    </div>
  );
}

function SettingsRow({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: string;
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
      <p className="text-sm font-medium text-slate-900 flex-1 text-left">{label}</p>
      <ChevronRightIcon size={18} color="#CBD5E1" />
    </button>
  );
}

export function ProfileScreen() {
  const { isConnected, rawAddress, friendlyAddress, shortAddress, connect, disconnect } = useWallet();
  const [statsLoading, setStatsLoading] = useState(false);
  const [created, setCreated] = useState(0);
  const [won, setWon] = useState(0);
  const [earned, setEarned] = useState(0);

  useEffect(() => {
    if (!isConnected || !rawAddress) {
      setCreated(0); setWon(0); setEarned(0);
      return;
    }
    setStatsLoading(true);
    getUserBounties(rawAddress)
      .then((bounties) => {
        setCreated(bounties.filter((b) => b.role === "created").length);
        const wonBounties = bounties.filter((b) => b.role === "joined" && b.status === "won");
        setWon(wonBounties.length);
        setEarned(wonBounties.reduce((sum, b) => sum + parseFloat(b.perWinnerAmount), 0));
      })
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, [isConnected, rawAddress]);

  const initials = friendlyAddress ? friendlyAddress.slice(0, 1).toUpperCase() : "?";

  return (
    <div className="min-h-screen px-4 py-6 md:py-8">
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
          <StatCard value={String(created)} label="Created" loading={statsLoading} />
          <StatCard value={String(won)} label="Won" loading={statsLoading} />
          <StatCard
            value={formatTON(String(earned))}
            label="TON Earned"
            loading={statsLoading}
            lime
            withDiamond
          />
        </div>

        {/* Settings */}
        <div className="mt-4 bg-white rounded-2xl border border-surface-border shadow-sm overflow-hidden">
          <SettingsRow icon={<BellIcon dot={false} size={18} color="#475569" />} label="Notifications" />
          <SettingsRow icon={<GlobeIcon size={18} color="#475569" />} label="Language" />
          <SettingsRow icon={<InfoIcon size={18} color="#475569" />} label="About BountyHive" />
          <SettingsRow icon={<ShareIcon size={18} color="#475569" />} label="Share App" />
        </div>
      </div>
    </div>
  );
}
