import type { Metadata } from "next";
import localFont from "next/font/local";
import { TonProvider } from "@/components/providers/TonConnectProvider";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "BountyHive — Earn TON by completing bounties",
  description: "The Telegram-native bounty platform on TON blockchain.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <TonProvider>{children}</TonProvider>
      </body>
    </html>
  );
}
