"use client";

import { useState } from "react";
import { BottomNav } from "@/components/layout/BottomNav";
import { CheckCircleIcon, AlarmIcon, FileCheckIcon, ZapIcon } from "@/components/icons";
import { NOTIFICATIONS } from "@/lib/data";
import type { AppNotification, NotificationType } from "@/lib/types";

function NotifIcon({ type }: { type: NotificationType }) {
  const containers: Record<NotificationType, { bg: string; icon: React.ReactNode }> = {
    winner: {
      bg: "#B5F23A18",
      icon: <CheckCircleIcon size={20} />,
    },
    deadline: {
      bg: "#F59E0B18",
      icon: <AlarmIcon size={20} />,
    },
    submission: {
      bg: "#60A5FA18",
      icon: <FileCheckIcon size={20} />,
    },
    funded: {
      bg: "#A78BFA18",
      icon: <ZapIcon size={20} />,
    },
  };

  const { bg, icon } = containers[type];

  return (
    <div
      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ background: bg }}
    >
      {icon}
    </div>
  );
}

function NotifItem({ notif }: { notif: AppNotification }) {
  return (
    <div
      className="flex items-start gap-3 p-3.5 rounded-2xl mb-2 cursor-pointer press-scale"
      style={{
        background: notif.read ? "#111317" : "#13160F",
        borderTop: "1px solid #1E2127",
        borderRight: "1px solid #1E2127",
        borderBottom: "1px solid #1E2127",
        borderLeft: notif.read ? "1px solid #1E2127" : "3px solid #B5F23A",
      }}
    >
      <NotifIcon type={notif.type} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p
            className="text-sm font-semibold leading-snug"
            style={{ color: notif.read ? "#C8CDD8" : "#EAEAEA" }}
          >
            {notif.title}
          </p>
          <span className="text-[10px] text-[#5A6070] flex-shrink-0 mt-0.5">
            {notif.timeAgo}
          </span>
        </div>
        <p className="text-xs text-[#9CA3AF] leading-relaxed">{notif.body}</p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: "#141619", border: "1px solid #1E2127" }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path
            d="M6 10C6 6.686 8.686 4 12 4C15.314 4 18 6.686 18 10V17H6V10Z"
            stroke="#5A6070"
            strokeWidth="1.5"
          />
          <path
            d="M10 17C10 18.105 10.895 19 12 19C13.105 19 14 18.105 14 17"
            stroke="#5A6070"
            strokeWidth="1.5"
          />
        </svg>
      </div>
      <p className="text-sm font-semibold text-[#EAEAEA]">No notifications</p>
      <p className="text-xs text-[#5A6070] text-center leading-relaxed" style={{ maxWidth: 220 }}>
        You will be notified when bounties end, winners are selected, and more
      </p>
    </div>
  );
}

export function NotificationsScreen() {
  const [notifications, setNotifications] = useState(NOTIFICATIONS);

  const today = notifications.filter((n) => n.isToday);
  const earlier = notifications.filter((n) => !n.isToday);
  const hasUnread = notifications.some((n) => !n.read);

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  return (
    <div className="flex flex-col h-full relative">
      <header className="flex items-center justify-between px-5 pt-6 pb-4 flex-shrink-0">
        <div style={{ width: 80 }} />
        <h1 className="text-[17px] font-bold text-[#EAEAEA]">Notifications</h1>
        <div style={{ width: 80 }} className="flex justify-end">
          {hasUnread && (
            <button
              onClick={markAllRead}
              className="text-xs font-semibold press-scale"
              style={{ color: "#B5F23A" }}
            >
              Mark all read
            </button>
          )}
        </div>
      </header>

      <div
        className="flex-1 overflow-y-auto scrollbar-hide px-4"
        style={{ paddingBottom: 90 }}
      >
        {notifications.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {today.length > 0 && (
              <>
                <p className="text-[11px] font-bold text-[#5A6070] uppercase tracking-widest mb-3">
                  Today
                </p>
                {today.map((n) => (
                  <NotifItem key={n.id} notif={n} />
                ))}
              </>
            )}
            {earlier.length > 0 && (
              <>
                <p
                  className="text-[11px] font-bold text-[#5A6070] uppercase tracking-widest mb-3"
                  style={{ marginTop: today.length > 0 ? 16 : 0 }}
                >
                  Earlier
                </p>
                {earlier.map((n) => (
                  <NotifItem key={n.id} notif={n} />
                ))}
              </>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
