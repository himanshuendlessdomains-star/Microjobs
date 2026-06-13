"use client";

import { useEffect } from "react";
import { useTonConnectUI } from "@tonconnect/ui-react";

const TG_UID_KEY = "bh_tg_uid";

// Detects when the user switches between Telegram accounts and resets all
// local session state (wallet connection, referral code) so the new account
// starts with a completely fresh session.
export function TelegramAccountGuard() {
  const [tonConnectUI] = useTonConnectUI();

  useEffect(() => {
    // Only active inside a Telegram WebApp context. Returns early for plain browser.
    const tg = (window as unknown as { Telegram?: { WebApp?: { initDataUnsafe?: { user?: { id?: number } } } } }).Telegram?.WebApp;
    const currentId = tg?.initDataUnsafe?.user?.id
      ? String(tg.initDataUnsafe.user.id)
      : null;

    if (!currentId) return;

    const storedId = localStorage.getItem(TG_UID_KEY);

    if (storedId !== null && storedId !== currentId) {
      // A different Telegram account has opened the app. Wipe the previous
      // user's wallet connection and any cached tokens so nothing leaks.
      void tonConnectUI.disconnect();
      localStorage.removeItem("refCode");
    }

    localStorage.setItem(TG_UID_KEY, currentId);
  }, [tonConnectUI]);

  return null;
}
