"use client";

import type { ReactNode } from "react";
import { BottomNav } from "@/components/layout/BottomNav";
import {
  TonDiamond,
  ChevronRightIcon,
  WalletIcon,
  BellIcon,
  GlobeIcon,
  InfoIcon,
  ShareIcon,
} from "@/components/icons";
import { USER_BOUNTIES } from "@/lib/data";
import { formatTON } from "@/lib/utils";
import { useWallet } from "@/hooks/useTonWallet";

const MOCK_USER = {
  name: "Alex",
  handle: "@alex.ton",
  initials: "A",
};

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div
      className="flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-2xl"
      style={{ background: "#141619", border: "1px solid #1E2127" }}
    >
      <p className="text-base font-bold text-[#EAEAEA]">{value}</p>
      <p className="text-[10px] font-medium text-[#5A6070] text-center leading-tight">{label}</p>
    </div>
  );
}

function SettingsRow({
  icon,
  label,
  sublabel,
}: {
  icon: ReactNode;
  label: string;
  sublabel?: string;
}) {
  return (
    <button type="button" className="w-full flex items-center gap-3.5 px-4 py-3.5 press-scale">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: "#1A1D22" }}
      >
        {icon}
      </div>
      <div className="flex-1 text-left">
        <p className="text-sm font-semibold text-[#EAEAEA]">{label}</p>
        {sublabel && (
          <p className="text-xs text-[#5A6070] mt-0.5">{sublabel}</p>
        )}
      </div>
      <ChevronRightIcon size={14} color="#3A3F4A" />
    </button>
  );
}

function WalletSection() {
  const { isConnected, friendlyAddress, shortAddress, connect, disconnect } = useWallet();

  if (isConnected) {
    return (
      <div
        className="rounded-2xl p-4 mb-4"
        style={{ background: "#111317", border: "1.5px solid #1E2127" }}
      >
        <div className="flex items-center gap-2 mb-3">
          <WalletIcon size={14} color="#5A6070" />
          <p className="text-[10px] font-bold text-[#5A6070] uppercase tracking-widest">
            Wallet
          </p>
        </div>

        <div
          className="flex items-center gap-3 p-3 rounded-xl mb-3"
          style={{ background: "#141619", border: "1px solid #B5F23A30" }}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "#B5F23A18" }}
          >
            <TonDiamond size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-[#5A6070] font-medium mb-0.5">Connected</p>
            <p className="text-sm font-mono font-semibold text-[#EAEAEA] truncate">
              {shortAddress(friendlyAddress)}
            </p>
          </div>
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: "#B5F23A" }}
          />
        </div>

        <button
          type="button"
          onClick={disconnect}
          className="w-full py-2.5 rounded-xl text-sm font-bold press-scale"
          style={{
            background: "#1E2127",
            border: "1.5px solid #2E333D",
            color: "#9CA3AF",
          }}
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl p-4 mb-4"
      style={{ background: "#111317", border: "1.5px solid #1E2127" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <WalletIcon size={14} color="#5A6070" />
        <p className="text-[10px] font-bold text-[#5A6070] uppercase tracking-widest">
          Wallet
        </p>
      </div>
      <p className="text-sm text-[#9CA3AF] mb-4 leading-relaxed">
        Connect your TON wallet to create bounties, submit proof, and claim rewards.
      </p>
      <div className="flex items-center gap-2">
        <TonDiamond size={14} />
        <button
          type="button"
          onClick={connect}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold press-scale"
          style={{
            background: "#B5F23A18",
            border: "1.5px solid #B5F23A50",
            color: "#B5F23A",
          }}
        >
          Connect Wallet
        </button>
      </div>
    </div>
  );
}

export function ProfileScreen() {
  const created = USER_BOUNTIES.filter((b) => b.role === "created").length;
  const won = USER_BOUNTIES.filter(
    (b) => b.role === "joined" && b.status === "won"
  ).length;
  const earnedTON = USER_BOUNTIES.filter(
    (b) => b.role === "joined" && b.status === "won"
  ).reduce((sum, b) => sum + parseFloat(b.perWinnerAmount), 0);

  return (
    <div className="flex flex-col h-full relative">
      <header className="px-5 pt-6 pb-4 flex-shrink-0">
        <h1 className="text-[17px] font-bold text-[#EAEAEA] text-center">Profile</h1>
      </header>

      <div
        className="flex-1 overflow-y-auto scrollbar-hide px-4"
        style={{ paddingBottom: 90 }}
      >
        {/* Avatar + name */}
        <div className="flex flex-col items-center mb-6 pt-2">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center mb-3"
            style={{
              background: "linear-gradient(135deg, #1A2409 0%, #232E0F 100%)",
              border: "2px solid #B5F23A40",
            }}
          >
            <span className="text-3xl font-bold" style={{ color: "#B5F23A" }}>
              {MOCK_USER.initials}
            </span>
          </div>
          <p className="text-lg font-bold text-[#EAEAEA]">{MOCK_USER.name}</p>
          <p className="text-sm text-[#5A6070] mt-0.5">{MOCK_USER.handle}</p>
        </div>

        {/* Stats */}
        <div className="flex gap-2 mb-4">
          <StatCard value={String(created)} label="Bounties Created" />
          <StatCard value={String(won)} label="Bounties Won" />
          <StatCard value={formatTON(String(earnedTON))} label="TON Earned" />
        </div>

        {/* Wallet — real TonConnect */}
        <WalletSection />

        {/* Settings */}
        <div
          className="rounded-2xl overflow-hidden mb-6 divide-y"
          style={{
            background: "#111317",
            border: "1.5px solid #1E2127",
            borderColor: "#1E2127",
          }}
        >
          <SettingsRow
            icon={<BellIcon active={false} dot={false} />}
            label="Notifications"
            sublabel="Push alerts for bounty updates"
          />
          <SettingsRow
            icon={<GlobeIcon size={18} />}
            label="Language"
            sublabel="English"
          />
          <SettingsRow
            icon={<InfoIcon size={18} />}
            label="About BountyHive"
            sublabel="v0.1.0 · Built on TON"
          />
          <SettingsRow
            icon={<ShareIcon size={18} />}
            label="Share App"
          />
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
