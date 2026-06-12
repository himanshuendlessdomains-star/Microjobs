"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TonDiamond, PlusIcon, SpinnerIcon } from "@/components/icons";
import { SearchBar } from "./SearchBar";
import { CategoryFilter } from "./CategoryFilter";
import { BountyCard } from "./BountyCard";
import { CATEGORIES } from "@/lib/data";
import { getBounties } from "@/lib/api";
import type { Bounty } from "@/lib/types";

type Category = (typeof CATEGORIES)[number];

export function DiscoverScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("All");
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getBounties({ category, search });
      setBounties(data);
    } catch {
      setError("Could not load bounties.");
      setBounties([]);
    } finally {
      setLoading(false);
    }
  }, [category, search]);

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
                  {allBounties.length}
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
