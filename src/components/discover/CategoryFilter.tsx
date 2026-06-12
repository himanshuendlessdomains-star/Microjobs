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
    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
      {CATEGORIES.map((cat) => {
        const isActive = cat === active;
        return (
          <button
            key={cat}
            onClick={() => onChange(cat)}
            className={cn(
              "flex-shrink-0 text-sm px-4 py-2 rounded-full press-scale transition-colors whitespace-nowrap",
              isActive
                ? "bg-lime text-dark font-bold"
                : "bg-white border border-surface-border text-slate-500 hover:bg-surface-tint hover:border-surface-hover font-semibold"
            )}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}
