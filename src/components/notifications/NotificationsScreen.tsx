"use client";

import { useEffect, useState } from "react";
import { CheckCircleIcon, AlarmIcon, FileCheckIcon, ZapIcon, SpinnerIcon } from "@/components/icons";
import { getNotifications, markAllRead } from "@/lib/api";
import { useWallet } from "@/hooks/useTonWallet";
import type { AppNotification, NotificationType } from "@/lib/types";

function NotifIcon({ type }: { type: NotificationType }) {
  const map: Partial<Record<NotificationType, { bg: string; icon: React.ReactNode }>> = {
    winner:     { bg: "bg-lime-subtle", icon: <CheckCircleIcon size={20} /> },
    deadline:   { bg: "bg-amber-50",    icon: <AlarmIcon size={20} /> },
    submission: { bg: "bg-blue-50",     icon: <FileCheckIcon size={20} /> },
    funded:     { bg: "bg-purple-50",   icon: <ZapIcon size={20} /> },
    refund:     { bg: "bg-blue-50",     icon: <ZapIcon size={20} /> },
  };
  const { bg, icon } = map[type] ?? { bg: "bg-surface-tint", icon: <ZapIcon size={20} /> };
  return (
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
      {icon}
    </div>
  );
}

function NotifItem({ notif }: { notif: AppNotification }) {
  return (
    <div
      className={`flex items-start gap-3 p-4 mb-2 rounded-2xl border border-surface-border shadow-sm press-scale ${
        notif.read ? "bg-white" : "bg-lime-subtle/20 border-l-4 border-l-lime"
      }`}
    >
      <NotifIcon type={notif.type} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-slate-900 leading-snug">{notif.title}</p>
          <span className="text-xs text-slate-400 flex-shrink-0 mt-0.5">{notif.timeAgo}</span>
        </div>
        <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">{notif.body}</p>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mt-6 mb-3">
      {children}
    </p>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-20 h-20 rounded-full bg-surface-tint flex items-center justify-center">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
          <path d="M6 10C6 6.686 8.686 4 12 4C15.314 4 18 6.686 18 10V17H6V10Z" stroke="#7A8099" strokeWidth="1.5" />
          <path d="M10 17C10 18.105 10.895 19 12 19C13.105 19 14 18.105 14 17" stroke="#7A8099" strokeWidth="1.5" />
        </svg>
      </div>
      <p className="text-xl font-bold text-slate-900">All caught up</p>
      <p className="text-sm text-slate-500 text-center leading-relaxed" style={{ maxWidth: 260 }}>
        You will be notified when bounties end, winners are selected, and more
      </p>
    </div>
  );
}

export function NotificationsScreen() {
  const { isConnected, rawAddress } = useWallet();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    if (!isConnected || !rawAddress) return;
    setLoading(true);
    getNotifications(rawAddress)
      .then(setNotifications)
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, [isConnected, rawAddress]);

  const today = notifications.filter((n) => n.isToday);
  const earlier = notifications.filter((n) => !n.isToday);
  const hasUnread = notifications.some((n) => !n.read);

  async function handleMarkAllRead() {
    if (marking || !rawAddress) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setMarking(true);
    try {
      await markAllRead(rawAddress);
    } catch {
      // optimistic update already applied — silent fail
    } finally {
      setMarking(false);
    }
  }

  return (
    <div className="min-h-screen px-4 py-6 md:py-8">
      <div className="max-w-2xl mx-auto">
        <header className="flex justify-between items-center">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Notifications</h1>
          {hasUnread && !marking && (
            <button
              onClick={handleMarkAllRead}
              className="text-sm text-lime-dim font-semibold press-scale"
            >
              Mark all read
            </button>
          )}
          {marking && <SpinnerIcon size={16} color="#8BBD1E" />}
        </header>

        {!isConnected ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-20 h-20 rounded-full bg-surface-tint flex items-center justify-center">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                <path d="M6 10C6 6.686 8.686 4 12 4C15.314 4 18 6.686 18 10V17H6V10Z" stroke="#7A8099" strokeWidth="1.5" />
                <path d="M10 17C10 18.105 10.895 19 12 19C13.105 19 14 18.105 14 17" stroke="#7A8099" strokeWidth="1.5" />
              </svg>
            </div>
            <p className="text-sm text-slate-500 text-center">
              Connect your wallet to see notifications
            </p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <SpinnerIcon size={28} />
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {today.length > 0 && (
              <>
                <SectionLabel>Today</SectionLabel>
                {today.map((n) => <NotifItem key={n.id} notif={n} />)}
              </>
            )}
            {earlier.length > 0 && (
              <>
                <SectionLabel>Earlier</SectionLabel>
                {earlier.map((n) => <NotifItem key={n.id} notif={n} />)}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
