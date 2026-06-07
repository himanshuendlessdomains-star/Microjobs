"use client";

import { SearchIcon, SlidersIcon } from "@/components/icons";

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="px-4 mb-4">
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-2xl"
        style={{ background: "#141619", border: "1px solid #1E2127" }}
      >
        <SearchIcon />

        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search bounties..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#3A3F4A] text-[#C8CDD8]"
        />

        {value && (
          <button
            onClick={() => onChange("")}
            className="text-[#5A6070] hover:text-[#9CA3AF] transition-colors text-xs font-medium px-1"
          >
            Clear
          </button>
        )}

        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "#1E2127" }}
        >
          <SlidersIcon />
        </div>
      </div>
    </div>
  );
}
