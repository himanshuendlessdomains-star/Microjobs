"use client";

import { TonConnectUIProvider } from "@tonconnect/ui-react";
import type { ReactNode } from "react";

const manifestUrl =
  (process.env.NEXT_PUBLIC_APP_URL ?? "https://microjobs-nine.vercel.app") +
  "/tonconnect-manifest.json";

export function TonProvider({ children }: { children: ReactNode }) {
  return (
    <TonConnectUIProvider
      manifestUrl={manifestUrl}
      actionsConfiguration={{
        // "back" tells TonConnect to return to the app after wallet actions in
        // Telegram Mini App context rather than leaving the user in the wallet app.
        returnStrategy: "back",
        // Restore connection on mount — default true but being explicit here.
        // This allows the session stored in localStorage to be resumed when the
        // user reopens the app without having to reconnect manually.
      }}
      walletsListConfiguration={{
        includeWallets: [
          {
            appName: "tonkeeper",
            name: "Tonkeeper",
            imageUrl: "https://tonkeeper.com/assets/tonconnect-icon.png",
            aboutUrl: "https://tonkeeper.com",
            universalLink: "https://app.tonkeeper.com/ton-connect",
            deepLink: "tonkeeper://",
            bridgeUrl: "https://bridge.tonapi.io/bridge",
            platforms: ["ios", "android", "chrome", "firefox", "safari"],
          },
        ],
      }}
    >
      {children}
    </TonConnectUIProvider>
  );
}
