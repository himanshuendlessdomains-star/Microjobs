"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useWallet } from "@/hooks/useTonWallet";
import { getNotifications } from "@/lib/api";

interface NotifCtx {
  unreadCount: number;
  refresh: () => void;
}

const NotificationContext = createContext<NotifCtx>({ unreadCount: 0, refresh: () => {} });

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { isConnected, rawAddress } = useWallet();
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(() => {
    if (!rawAddress) return;
    getNotifications(rawAddress)
      .then((notifs) => setUnreadCount(notifs.filter((n) => !n.read).length))
      .catch(() => {});
  }, [rawAddress]);

  useEffect(() => {
    if (!isConnected || !rawAddress) {
      setUnreadCount(0);
      return;
    }
    refresh();
    const id = setInterval(refresh, 30_000);
    return () => clearInterval(id);
  }, [isConnected, rawAddress, refresh]);

  return (
    <NotificationContext.Provider value={{ unreadCount, refresh }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationCount() {
  return useContext(NotificationContext);
}
