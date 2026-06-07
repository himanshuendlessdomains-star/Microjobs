"use client";

import { useRouter, usePathname } from "next/navigation";
import { CompassIcon, ClipboardIcon, BellIcon, UserIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "discover",      label: "Discover",       Icon: CompassIcon,   href: "/" },
  { key: "bounties",      label: "My Bounties",    Icon: ClipboardIcon, href: "/bounties" },
  { key: "notifications", label: "Notifications",  Icon: BellIcon,      href: "/notifications" },
  { key: "profile",       label: "Profile",        Icon: UserIcon,      href: "/profile" },
] as const;

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <nav
      className="absolute bottom-0 left-0 right-0 flex items-center justify-around px-1 pt-3 pb-7"
      style={{
        background: "linear-gradient(to top, #0D0E10 85%, transparent)",
        borderTop: "1px solid #1A1D22",
      }}
    >
      {TABS.map(({ key, label, Icon, href }) => {
        const isActive = pathname === href;
        return (
          <button
            key={key}
            onClick={() => router.push(href)}
            className={cn(
              "flex flex-col items-center gap-1.5 px-3 press-scale",
              "transition-opacity duration-150",
              isActive ? "opacity-100" : "opacity-60 hover:opacity-80"
            )}
          >
            <Icon
              active={isActive}
              {...(key === "notifications" ? { dot: true } : {})}
            />
            <span
              className="text-[10px] font-semibold tracking-wide"
              style={{ color: isActive ? "#B5F23A" : "#5A6070" }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
