"use client";

import { TonConnectUIProvider } from "@tonconnect/ui-react";
import type { ReactNode } from "react";

const manifestUrl =
  (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000") +
  "/tonconnect-manifest.json";

export function TonProvider({ children }: { children: ReactNode }) {
  return (
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      {children}
    </TonConnectUIProvider>
  );
}
