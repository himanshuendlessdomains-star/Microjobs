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

const NAV_LINKS = [
  { label: "Discover", Icon: CompassIcon, href: "/" },
  { label: "My Bounties", Icon: ClipboardIcon, href: "/bounties" },
  { label: "Notifications", Icon: BellIcon, href: "/notifications" },
  { label: "Profile", Icon: UserIcon, href: "/profile" },
] as const;

/**
 * Sidebar — desktop-only left navigation rail (hidden below md).
 * 240px wide, dark surface, sticky full height.
 */
export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

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
        {NAV_LINKS.map(({ label, Icon, href }) => {
          const isActive = pathname === href;
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
              <Icon active={isActive} />
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
