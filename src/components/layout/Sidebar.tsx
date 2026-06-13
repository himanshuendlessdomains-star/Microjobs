"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  HexLogo,
  CompassIcon,
  ClipboardIcon,
  BellIcon,
  UserIcon,
  PlusIcon,
} from "@/components/icons";
import { cn } from "@/lib/utils";
import { useNotificationCount } from "@/lib/NotificationContext";

const NAV_LINKS = [
  { key: "discover",      label: "Discover",       href: "/" },
  { key: "bounties",      label: "My Bounties",    href: "/bounties" },
  { key: "notifications", label: "Notifications",  href: "/notifications" },
  { key: "profile",       label: "Profile",        href: "/profile" },
] as const;

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { unreadCount } = useNotificationCount();

  return (
    <aside
      className="hidden md:flex flex-col sticky top-0 shrink-0"
      style={{ width: 240, height: "100vh", background: "#0D0E12" }}
    >
      {/* Brand */}
      <div className="p-5 pb-4">
        <div className="flex items-center gap-2">
          <HexLogo size={22} />
          <span className="text-lime font-bold text-lg leading-none">
            BountyHive
          </span>
        </div>
        <p className="text-ink-faint text-xs mt-0.5">Earn on TON</p>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 flex flex-col gap-1 mt-6">
        {NAV_LINKS.map(({ key, label, href }) => {
          const isActive = pathname === href;
          const isNotif = key === "notifications";
          const Icon = key === "discover" ? CompassIcon
            : key === "bounties" ? ClipboardIcon
            : key === "notifications" ? BellIcon
            : UserIcon;

          return (
            <button
              key={href}
              onClick={() => router.push(href)}
              className={cn(
                "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium press-scale transition-colors",
                isActive
                  ? "bg-dark-elevated text-lime"
                  : "text-ink-faint hover:text-ink-primary hover:bg-dark-surface"
              )}
            >
              <span className="relative">
                <Icon active={isActive} {...(isNotif ? { dot: unreadCount > 0 } : {})} />
                {isNotif && unreadCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center"
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </span>
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Create Bounty CTA */}
      <div className="p-4 mt-auto">
        <button
          onClick={() => router.push("/create")}
          className="w-full bg-lime text-dark font-bold py-3 rounded-xl press-scale flex items-center justify-center gap-2"
        >
          <PlusIcon size={16} color="#0D0E12" />
          Create Bounty
        </button>
      </div>
    </aside>
  );
}
