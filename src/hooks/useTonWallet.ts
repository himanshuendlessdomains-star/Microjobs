"use client";

import { useTonAddress, useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";

export function useWallet() {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const friendlyAddress = useTonAddress();       // UQ... / EQ... format
  const rawAddress = useTonAddress(false);        // 0: raw hex format

  const isConnected = !!wallet;

  function connect() {
    tonConnectUI.openModal();
  }

  function disconnect() {
    tonConnectUI.disconnect();
  }

  function shortAddress(addr?: string) {
    const a = addr ?? friendlyAddress;
    if (!a) return "";
    return `${a.slice(0, 6)}...${a.slice(-4)}`;
  }

  return {
    isConnected,
    wallet,
    friendlyAddress,
    rawAddress,
    shortAddress,
    connect,
    disconnect,
  };
}
