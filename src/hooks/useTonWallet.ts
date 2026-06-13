"use client";

import { useEffect } from "react";
import { useTonAddress, useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";

const WALLET_ADDR_KEY = "bh_wallet_addr";

export function useWallet() {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const friendlyAddress = useTonAddress();       // UQ... / EQ... format
  const rawAddress = useTonAddress(false);        // 0: raw hex format

  const isConnected = !!wallet;
  const isMainnet = wallet?.account.chain === "-239";

  // Persist the friendly address in localStorage so components can detect
  // "was previously connected" and show a reconnect prompt instead of a blank gate.
  useEffect(() => {
    if (friendlyAddress) {
      try { localStorage.setItem(WALLET_ADDR_KEY, friendlyAddress); } catch {}
    }
  }, [friendlyAddress]);

  function connect() {
    tonConnectUI.openModal();
  }

  function disconnect() {
    try { localStorage.removeItem(WALLET_ADDR_KEY); } catch {}
    tonConnectUI.disconnect();
  }

  function shortAddress(addr?: string) {
    const a = addr ?? friendlyAddress;
    if (!a) return "";
    return `${a.slice(0, 6)}...${a.slice(-4)}`;
  }

  // Returns the last known friendly address even when currently disconnected.
  // Use this to offer a "Reconnect [address]" prompt instead of a plain connect gate.
  function getLastKnownAddress(): string {
    try { return localStorage.getItem(WALLET_ADDR_KEY) ?? ""; } catch { return ""; }
  }

  return {
    isConnected,
    isMainnet,
    wallet,
    friendlyAddress,
    rawAddress,
    shortAddress,
    connect,
    disconnect,
    getLastKnownAddress,
  };
}
