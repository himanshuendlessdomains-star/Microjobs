"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  HexLogo,
  EllipsisIcon,
  TrendingIcon,
  ChevronRightIcon,
  PlusIcon,
} from "@/components/icons";
import { BottomNav } from "@/components/layout/BottomNav";
import { SearchBar } from "./SearchBar";
import { CategoryFilter } from "./CategoryFilter";
import { BountyCard } from "./BountyCard";
import { BOUNTIES, CATEGORIES } from "@/lib/data";

type Category = (typeof CATEGORIES)[number];

export function DiscoverScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("All");

  const filtered = BOUNTIES.filter((b) => {
    const matchCat = category === "All" || b.category === category;
    const matchSearch = b.title.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const hot = filtered.filter((b) => b.isHot);
  const rest = filtered.filter((b) => !b.isHot);

  return (
    <div className="flex flex-col h-full relative">
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-5 pt-6 pb-4 flex-shrink-0">
        <button className="text-sm font-semibold text-[#B5F23A] press-scale">
          Close
        </button>

        <div className="flex items-center gap-2">
          <HexLogo size={36} />
          <div>
            <p className="font-bold text-[15px] leading-tight text-[#EAEAEA]">
              BountyHive
            </p>
            <p className="text-[11px] text-[#5A6070]">mini app</p>
          </div>
        </div>

        <button
          className="w-9 h-9 rounded-full flex items-center justify-center press-scale"
          style={{
            background: "#1A1D22",
            border: "1px solid #B5F23A30",
          }}
        >
          <EllipsisIcon size={18} />
        </button>
      </header>

      {/* ── Scrollable body ── */}
      <div
        className="flex-1 overflow-y-auto scrollbar-hide"
        style={{ paddingBottom: 90 }}
      >
        <SearchBar value={search} onChange={setSearch} />
        <CategoryFilter active={category} onChange={setCategory} />

        {/* Trending section */}
        <div className="px-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingIcon size={18} />
              <span className="font-bold text-[15px] text-[#EAEAEA]">
                Trending Bounties
              </span>
            </div>
            <button className="flex items-center gap-1 text-sm font-semibold text-[#B5F23A] press-scale">
              View All
              <ChevronRightIcon size={14} />
            </button>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <span className="text-4xl">🔍</span>
              <p className="text-[#5A6070] text-sm font-medium">
                No bounties found
              </p>
              <button
                onClick={() => {
                  setSearch("");
                  setCategory("All");
                }}
                className="text-xs text-[#B5F23A] font-semibold mt-1 press-scale"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              {hot.map((b) => (
                <BountyCard key={b.id} bounty={b} />
              ))}
              {rest.map((b) => (
                <BountyCard key={b.id} bounty={b} />
              ))}
            </>
          )}
        </div>
      </div>

      {/* ── Create FAB ── */}
      <button
        onClick={() => router.push("/create")}
        className="absolute press-scale"
        style={{
          bottom: 78,
          right: 18,
          width: 48,
          height: 48,
          borderRadius: 14,
          background: "#B5F23A",
          boxShadow: "0 0 18px 4px #B5F23A40",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <PlusIcon size={22} color="#0D0E10" />
      </button>

      {/* ── Bottom Nav ── */}
      <BottomNav />
    </div>
  );
}
