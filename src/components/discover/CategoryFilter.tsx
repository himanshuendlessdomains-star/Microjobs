"use client";

import { CATEGORIES } from "@/lib/data";
import { cn } from "@/lib/utils";

type Category = (typeof CATEGORIES)[number];

interface CategoryFilterProps {
  active: Category;
  onChange: (c: Category) => void;
}

export function CategoryFilter({ active, onChange }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 px-4 mb-5 overflow-x-auto scrollbar-hide">
      {CATEGORIES.map((cat) => {
        const isActive = cat === active;
        return (
          <button
            key={cat}
            onClick={() => onChange(cat)}
            className={cn(
              "flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-150 press-scale",
              isActive
                ? "bg-lime text-[#0D0E10]"
                : "text-[#9CA3AF] border border-[#1E2127] bg-[#141619] hover:border-[#2E333D]"
            )}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}
