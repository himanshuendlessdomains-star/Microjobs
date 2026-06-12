"use client";

import { useRouter, usePathname } from "next/navigation";
import { CompassIcon, ClipboardIcon, BellIcon, UserIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "discover",      label: "Discover",      Icon: CompassIcon,   href: "/" },
  { key: "bounties",      label: "My Bounties",   Icon: ClipboardIcon, href: "/bounties" },
  { key: "notifications", label: "Notifications", Icon: BellIcon,      href: "/notifications" },
  { key: "profile",       label: "Profile",       Icon: UserIcon,      href: "/profile" },
] as const;

/**
 * BottomNav — mobile-only tab bar (hidden at md and above).
 * Frosted light glass bar fixed to the bottom of the viewport.
 * Rendered by AppLayout — screens must never render this directly.
 */
export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 flex items-center justify-around px-2 z-50"
      style={{
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(12px)",
        borderTop: "1px solid #E0E4F0",
        height: 72,
      }}
    >
      {TABS.map(({ key, label, Icon, href }) => {
        const isActive = pathname === href;
        return (
          <button
            key={key}
            onClick={() => router.push(href)}
            className="flex flex-col items-center gap-1 py-2 px-3 press-scale"
          >
            <span
              className="rounded-full"
              style={{
                width: 4,
                height: 4,
                background: isActive ? "#B5F23A" : "transparent",
              }}
            />
            <span className={cn(!isActive && "opacity-50")}>
              <Icon
                active={isActive}
                {...(key === "notifications" ? { dot: isActive } : {})}
              />
            </span>
            <span
              className={cn(
                "text-[10px] tracking-wide",
                isActive
                  ? "text-lime font-semibold"
                  : "text-slate-500 font-medium"
              )}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
