const LIME = "#B5F23A";
const MUTED = "#5A6070";
const SECONDARY = "#9CA3AF";

/* ─── TON Diamond ─── */
export function TonDiamond({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <polygon points="12,2 22,9 18,22 6,22 2,9" fill={LIME} />
    </svg>
  );
}

/* ─── Clock ─── */
export function ClockIcon({ size = 14, color = SECONDARY }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <path d="M12 7V12L15.5 14.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── People ─── */
export function PeopleIcon({ size = 14, color = SECONDARY }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="7" r="3" stroke={color} strokeWidth="2" />
      <path d="M3 20C3 16.686 5.686 14 9 14H10" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="17" cy="9" r="2.5" stroke={color} strokeWidth="2" />
      <path d="M13 20C13 17.239 14.791 15 17 15C19.209 15 21 17.239 21 20" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* ─── Search ─── */
export function SearchIcon({ size = 18, color = MUTED }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <path d="M17 17L21.5 21.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* ─── Sliders (filter) ─── */
export function SlidersIcon({ size = 16, color = SECONDARY }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 6H20M4 12H14M4 18H9" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="17" cy="12" r="2.5" fill={color} />
      <circle cx="11" cy="6" r="2.5" fill={color} />
      <circle cx="7" cy="18" r="2.5" fill={color} />
    </svg>
  );
}

/* ─── Trending arrow ─── */
export function TrendingIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 17L9 11L13 15L21 7" stroke={LIME} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 7H21V13" stroke={LIME} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Chevron right ─── */
export function ChevronRightIcon({ size = 14, color = LIME }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M9 18L15 12L9 6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Ellipsis (three dots) ─── */
export function EllipsisIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="5" cy="12" r="1.5" fill={LIME} />
      <circle cx="12" cy="12" r="1.5" fill={LIME} />
      <circle cx="19" cy="12" r="1.5" fill={LIME} />
    </svg>
  );
}

/* ─── Draw winner badge icon ─── */
export function DrawBadgeIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="3" stroke={LIME} strokeWidth="2" />
      <path d="M9 9L15 15M15 9L9 15" stroke={LIME} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* ─── Manual winner badge icon ─── */
export function ManualBadgeIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="3.5" stroke={SECONDARY} strokeWidth="2" />
      <path d="M5 20C5 16.134 8.134 13 12 13C15.866 13 19 16.134 19 20" stroke={SECONDARY} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* ─── Bottom Nav icons ─── */
export function CompassIcon({ active = false }: { active?: boolean }) {
  const c = active ? LIME : MUTED;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={c} strokeWidth="2" />
      <polygon points="16,8 11,11 8,16 13,13" fill={active ? LIME : MUTED} />
    </svg>
  );
}

export function ClipboardIcon({ active = false }: { active?: boolean }) {
  const c = active ? LIME : MUTED;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="5" y="4" width="14" height="17" rx="2" stroke={c} strokeWidth="2" />
      <path d="M9 4V3C9 2.448 9.448 2 10 2H14C14.552 2 15 2.448 15 3V4" stroke={c} strokeWidth="2" />
      <path d="M9 11H15M9 15H13" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function BellIcon({ active = false, dot = true, size = 22, color }: { active?: boolean; dot?: boolean; size?: number; color?: string }) {
  const c = color ?? (active ? LIME : MUTED);
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M6 10C6 6.686 8.686 4 12 4C15.314 4 18 6.686 18 10V17H6V10Z" stroke={c} strokeWidth="2" />
      <path d="M10 17C10 18.105 10.895 19 12 19C13.105 19 14 18.105 14 17" stroke={c} strokeWidth="2" />
      {dot && <circle cx="17" cy="5" r="3" fill={LIME} />}
    </svg>
  );
}

export function UserIcon({ active = false }: { active?: boolean }) {
  const c = active ? LIME : MUTED;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke={c} strokeWidth="2" />
      <path d="M5 20C5 16.134 8.134 13 12 13C15.866 13 19 16.134 19 20" stroke={c} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* ─── Bounty icon set ─── */
export function RocketBountyIcon() {
  return (
    <svg viewBox="0 0 40 40" fill="none" className="w-9 h-9">
      <path d="M20 4C20 4 13 10 13 19L16 22L20 26L24 22L27 19C27 10 20 4 20 4Z" fill={LIME} opacity="0.85" />
      <circle cx="20" cy="17" r="3" fill="#111317" />
      <path d="M16 22L13 25L15 27.5L18 25" fill={LIME} opacity="0.5" />
      <path d="M24 22L27 25L25 27.5L22 25" fill={LIME} opacity="0.5" />
    </svg>
  );
}

export function XBountyIcon() {
  return (
    <svg viewBox="0 0 40 40" fill="none" className="w-9 h-9">
      <path d="M28 8L21.2 17.2L30 32H23.5L18.5 24L11 32H7L14.2 22.2L6 8H12.8L17.5 15.6L25 8H28Z" fill={LIME} />
    </svg>
  );
}

export function ChartBountyIcon() {
  return (
    <svg viewBox="0 0 40 40" fill="none" className="w-9 h-9">
      <rect x="5" y="22" width="7" height="13" rx="1.5" fill={LIME} opacity="0.45" />
      <rect x="16" y="14" width="7" height="21" rx="1.5" fill={LIME} opacity="0.7" />
      <rect x="27" y="7" width="7" height="28" rx="1.5" fill={LIME} />
    </svg>
  );
}

export function CodeBountyIcon() {
  return (
    <svg viewBox="0 0 40 40" fill="none" className="w-9 h-9">
      <path d="M14 12L6 20L14 28" stroke={LIME} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M26 12L34 20L26 28" stroke={LIME} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function StarBountyIcon() {
  return (
    <svg viewBox="0 0 40 40" fill="none" className="w-9 h-9">
      <path
        d="M20 5L23.5 14.5H34L26 20.5L29 30.5L20 24.5L11 30.5L14 20.5L6 14.5H16.5L20 5Z"
        fill={LIME}
        opacity="0.85"
      />
    </svg>
  );
}

export function TrophyBountyIcon() {
  return (
    <svg viewBox="0 0 40 40" fill="none" className="w-9 h-9">
      <path d="M12 8H28V20C28 25.523 24.418 30 20 30C15.582 30 12 25.523 12 20V8Z" fill={LIME} opacity="0.85" />
      <path d="M8 10H12V20H8C6.895 20 6 19.105 6 18V12C6 10.895 6.895 10 8 10Z" fill={LIME} opacity="0.5" />
      <path d="M28 10H32C33.105 10 34 10.895 34 12V18C34 19.105 33.105 20 32 20H28V10Z" fill={LIME} opacity="0.5" />
      <rect x="17" y="30" width="6" height="4" rx="1" fill={LIME} opacity="0.7" />
      <rect x="13" y="34" width="14" height="2" rx="1" fill={LIME} opacity="0.5" />
    </svg>
  );
}

/* ─── Check Circle (winner notification) ─── */
export function CheckCircleIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" fill="#B5F23A18" stroke="#B5F23A" strokeWidth="1.5" />
      <path d="M8 12L11 15L16 9" stroke="#B5F23A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Alarm (deadline notification) ─── */
export function AlarmIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="13" r="7" stroke="#F59E0B" strokeWidth="1.5" />
      <path d="M12 10V13L14 15" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 4.5L3.5 6.5M18.5 4.5L20.5 6.5" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/* ─── File Check (submission notification) ─── */
export function FileCheckIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M14 3H7C5.895 3 5 3.895 5 5V19C5 20.105 5.895 21 7 21H17C18.105 21 19 20.105 19 19V8L14 3Z" stroke="#60A5FA" strokeWidth="1.5" />
      <path d="M14 3V8H19" stroke="#60A5FA" strokeWidth="1.5" />
      <path d="M9 13L11 15L15 11" stroke="#60A5FA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Zap (funded notification) ─── */
export function ZapIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M13 3L4 14H12L11 21L20 10H12L13 3Z" fill="#A78BFA28" stroke="#A78BFA" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Wallet ─── */
export function WalletIcon({ size = 20, color = "#9CA3AF" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 8C3 6.895 3.895 6 5 6H19C20.105 6 21 6.895 21 8V18C21 19.105 20.105 20 19 20H5C3.895 20 3 19.105 3 18V8Z" stroke={color} strokeWidth="1.5" />
      <path d="M3 10H21" stroke={color} strokeWidth="1.5" />
      <circle cx="16.5" cy="15" r="1.5" fill={color} />
    </svg>
  );
}

/* ─── Globe ─── */
export function GlobeIcon({ size = 20, color = "#9CA3AF" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" />
      <path d="M12 3C12 3 9 7 9 12C9 17 12 21 12 21M12 3C12 3 15 7 15 12C15 17 12 21 12 21" stroke={color} strokeWidth="1.5" />
      <path d="M3.5 9H20.5M3.5 15H20.5" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

/* ─── Info ─── */
export function InfoIcon({ size = 20, color = "#9CA3AF" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" />
      <path d="M12 11V17" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="8" r="0.75" fill={color} stroke={color} strokeWidth="0.5" />
    </svg>
  );
}

/* ─── Share ─── */
export function ShareIcon({ size = 20, color = "#9CA3AF" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="18" cy="5" r="2.5" stroke={color} strokeWidth="1.5" />
      <circle cx="6" cy="12" r="2.5" stroke={color} strokeWidth="1.5" />
      <circle cx="18" cy="19" r="2.5" stroke={color} strokeWidth="1.5" />
      <path d="M8.5 10.5L15.5 6.5M8.5 13.5L15.5 17.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/* ─── Arrow Left (back navigation) ─── */
export function ArrowLeftIcon({ size = 20, color = "#EAEAEA" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Plus (create bounty) ─── */
export function PlusIcon({ size = 20, color = "#0D0E10" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 5V19M5 12H19" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/* ─── Swap arrows ─── */
export function SwapArrowsIcon({ size = 20, color = "#B5F23A" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M7 16V4M7 4L4 7M7 4L10 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 8V20M17 20L14 17M17 20L20 17" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Text proof type ─── */
export function TextIcon({ size = 18, color = "#9CA3AF" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 6H20M4 10H14M4 14H18M4 18H12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/* ─── Link proof type ─── */
export function LinkIcon({ size = 18, color = "#9CA3AF" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Image proof type ─── */
export function ImageIcon({ size = 18, color = "#9CA3AF" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="1.5" />
      <circle cx="8.5" cy="8.5" r="1.5" fill={color} />
      <path d="M3 16L8 11L12 15L15 12L21 18" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Check (success) ─── */
export function CheckIcon({ size = 20, color = "#B5F23A" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M5 13L9 17L19 7" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Spinner (loading) ─── */
export function SpinnerIcon({ size = 18, color = "#B5F23A" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-spin">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" strokeOpacity="0.25" />
      <path d="M12 3a9 9 0 019 9" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* ─── Chevron Down ─── */
export function ChevronDownIcon({ size = 16, color = "#9CA3AF" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M6 9L12 15L18 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── BountyHive hex logo ─── */
export function HexLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none">
      <polygon
        points="22,3 39,12.5 39,31.5 22,41 5,31.5 5,12.5"
        fill={LIME}
        opacity="0.15"
        stroke={LIME}
        strokeWidth="1.5"
      />
      <text x="22" y="29" textAnchor="middle" fontSize="20" fill={LIME}>
        🐝
      </text>
    </svg>
  );
}
