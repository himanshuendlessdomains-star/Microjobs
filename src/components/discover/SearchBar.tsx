"use client";

import { SearchIcon, SlidersIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  dark?: boolean;
}

export function SearchBar({ value, onChange, dark = false }: SearchBarProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 h-11 px-4 rounded-2xl",
        dark
          ? "bg-white/10 border border-white/20 backdrop-blur-sm"
          : "bg-white border border-surface-border"
      )}
    >
      <SearchIcon size={18} color={dark ? "rgba(255,255,255,0.5)" : "#A8AEBF"} />

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search bounties..."
        className={cn(
          "flex-1 min-w-0 bg-transparent text-sm outline-none",
          dark
            ? "text-white placeholder:text-white/50"
            : "text-slate-900 placeholder:text-slate-300"
        )}
      />

      {value && (
        <button
          onClick={() => onChange("")}
          className={cn(
            "text-xs font-medium px-1 transition-colors",
            dark
              ? "text-white/50 hover:text-white/80"
              : "text-slate-300 hover:text-slate-500"
          )}
        >
          Clear
        </button>
      )}

      <div
        className={cn(
          "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0",
          dark ? "bg-white/10" : "bg-surface-tint"
        )}
      >
        <SlidersIcon size={16} color={dark ? "rgba(255,255,255,0.7)" : "#7A8099"} />
      </div>
    </div>
  );
}
