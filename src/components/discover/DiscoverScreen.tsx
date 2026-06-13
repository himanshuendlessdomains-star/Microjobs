"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TonDiamond, PlusIcon, SpinnerIcon } from "@/components/icons";
import { SearchBar } from "./SearchBar";
import { CategoryFilter } from "./CategoryFilter";
import { BountyCard } from "./BountyCard";
import { CATEGORIES } from "@/lib/data";
import { getBounties, getPlatformStats } from "@/lib/api";
import type { Bounty, PlatformStats } from "@/lib/types";
import { formatTON } from "@/lib/utils";

type Category = (typeof CATEGORIES)[number];

const ESCROW_ADDRESS = process.env.NEXT_PUBLIC_ESCROW_ADDRESS ?? "";

function PlatformStatsBar({ stats }: { stats: PlatformStats | null }) {
  function fmt(n: number) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return formatTON(String(n));
  }

  const items = [
    { label: "Open", value: stats ? String(stats.bountiesActive) : "—", desc: "Active bounties" },
    { label: "Escrow", value: stats ? `${fmt(stats.totalEscrow)} TON` : "—", desc: "Locked in active bounties" },
    { label: "Claimable", value: stats ? `${fmt(stats.totalClaimable)} TON` : "—", desc: "Refundable by creators" },
    { label: "Distributed", value: stats ? `${fmt(stats.totalDistributed)} TON` : "—", desc: "Paid to winners" },
    { label: "Closed", value: stats ? String(stats.bountiesClosed) : "—", desc: "Finalized" },
  ];

  return (
    <div
      className="mt-3 rounded-2xl border border-dark-border p-4"
      style={{ background: "#0D0E12" }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse" />
          <p className="text-xs font-semibold text-ink-muted tracking-wide uppercase">
            Platform Escrow — Live
          </p>
        </div>
        {ESCROW_ADDRESS && (
          <a
            href={`https://tonviewer.com/${ESCROW_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="text-[10px] font-mono text-ink-faint hover:text-lime transition-colors"
            title="View escrow wallet on TON explorer"
          >
            {ESCROW_ADDRESS.slice(0, 8)}…{ESCROW_ADDRESS.slice(-6)}
          </a>
        )}
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {items.map(({ label, value, desc }) => (
          <div key={label} className="bg-dark-elevated rounded-xl p-3">
            <p className="text-[10px] text-ink-faint uppercase tracking-widest">{label}</p>
            <p className="text-sm font-black text-lime mt-0.5">{value}</p>
            <p className="text-[10px] text-ink-muted mt-0.5 leading-tight">{desc}</p>
          </div>
        ))}
      </div>
      {ESCROW_ADDRESS && (
        <div className="mt-3 flex items-center gap-2 bg-dark-elevated rounded-xl px-3 py-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
            <path d="M12 2L4 6V12C4 17 12 22 12 22C12 22 20 17 20 12V6L12 2Z" stroke="#B5F23A" strokeWidth="2" strokeLinejoin="round" />
          </svg>
          <p className="text-[10px] text-ink-muted flex-1">
            All bounty funds are held in escrow at{" "}
            <a
              href={`https://tonviewer.com/${ESCROW_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-lime font-mono hover:underline"
            >
              {ESCROW_ADDRESS}
            </a>
          </p>
        </div>
      )}
    </div>
  );
}

export function DiscoverScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("All");
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);

  const loadStats = useCallback(() => {
    getPlatformStats().then(setPlatformStats).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    loadStats();
    try {
      const data = await getBounties({ category, search });
      setBounties(data);
    } catch {
      setError("Could not load bounties.");
      setBounties([]);
    } finally {
      setLoading(false);
    }
  }, [category, search, loadStats]);

  useEffect(() => {
    const t = setTimeout(load, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const hotBounties = bounties.filter((b) => b.isHot);
  const allBounties = bounties.filter((b) => !b.isHot);

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        {/* ── Hero ── */}
        <div className="relative bg-dark-card border border-dark-border rounded-3xl p-6 md:p-8 mt-4 md:mt-8 overflow-hidden">
          <div
            className="absolute right-6 top-6 pointer-events-none"
            style={{ filter: "drop-shadow(0 0 30px #B5F23A) drop-shadow(0 0 10px #B5F23A30)" }}
          >
            <TonDiamond size={40} />
          </div>
          <h1 className="text-3xl font-black text-ink-primary tracking-tight">
            Discover Bounties
          </h1>
          <p className="text-ink-muted text-sm mt-1">
            Complete tasks. Earn TON on the blockchain.
          </p>
          <div className="mt-4">
            <SearchBar value={search} onChange={setSearch} dark />
          </div>
        </div>

        <PlatformStatsBar stats={platformStats} />

        {/* ── Category filter ── */}
        <div className="mt-4">
          <CategoryFilter active={category} onChange={setCategory} />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <SpinnerIcon size={28} />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <span className="text-3xl">⚠️</span>
            <p className="text-slate-500 text-sm font-medium">{error}</p>
            <button onClick={load} className="text-xs text-lime-dim font-semibold press-scale">
              Retry
            </button>
          </div>
        ) : bounties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <span className="text-4xl">🔍</span>
            <p className="text-slate-500 text-sm font-medium">No bounties found</p>
            <button
              onClick={() => { setSearch(""); setCategory("All"); }}
              className="text-xs text-lime-dim font-semibold mt-1 press-scale"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            {/* ── Hot Right Now ── */}
            {hotBounties.length > 0 && (
              <section className="mt-6">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900">
                    🔥 Hot Right Now
                  </span>
                  <button className="text-lime-dim text-sm font-semibold press-scale">
                    See all
                  </button>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide mt-3">
                  {hotBounties.map((b) => (
                    <div key={b.id} className="min-w-[260px] md:min-w-[300px]">
                      <BountyCard bounty={b} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── All Bounties ── */}
            <section className="mt-6 pb-24 md:pb-8">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900">All Bounties</span>
                <span className="bg-surface-tint text-slate-500 text-xs px-2 py-0.5 rounded-full">
                  {bounties.length}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
                {allBounties.map((b) => (
                  <BountyCard key={b.id} bounty={b} />
                ))}
              </div>
            </section>
          </>
        )}
      </div>

      {/* ── Create FAB ── */}
      <button
        onClick={() => router.push("/create")}
        className="fixed bottom-20 right-4 md:bottom-8 md:right-8 w-14 h-14 rounded-full bg-lime flex items-center justify-center shadow-lime press-scale"
      >
        <PlusIcon size={22} color="#0D0E12" />
      </button>
    </div>
  );
}
