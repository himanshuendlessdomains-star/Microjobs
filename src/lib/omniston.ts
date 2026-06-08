import { Omniston } from "@ston-fi/omniston-sdk";
import type { Quote, QuoteRequest, BuildTonSwapRequest, TonTransaction } from "@ston-fi/omniston-sdk";
import type { SwapTokenInfo } from "./types";

export const omniston = new Omniston({
  apiUrl: "wss://omni-ws.ston.fi",
});

// ---------------------------------------------------------------------------
// Address helpers
// ---------------------------------------------------------------------------

/**
 * Convert a raw TON address (workchain:hex64) to the user-friendly base64url
 * format required by TonConnect (EQ... for bounceable, UQ... for wallets).
 * If the address is already in friendly format it is returned unchanged.
 */
function toFriendlyAddress(addr: string, bounceable = true): string {
  if (!addr) return addr;
  // Already in friendly format — 48-char base64url string
  if (/^[A-Za-z0-9_-]{48}$/.test(addr)) return addr;

  // Raw format: "workchain:hexaddr"
  const m = addr.match(/^(-?\d+):([0-9a-fA-F]{64})$/);
  if (!m) return addr; // unknown format, pass through unchanged

  const workchain = parseInt(m[1], 10);
  const hexAddr = m[2];
  const buf = new Uint8Array(36);

  // Flag byte: bounceable mainnet = 0x11, non-bounceable mainnet = 0x51
  buf[0] = bounceable ? 0x11 : 0x51;
  buf[1] = workchain & 0xff;
  for (let i = 0; i < 32; i++) {
    buf[2 + i] = parseInt(hexAddr.slice(i * 2, i * 2 + 2), 16);
  }

  // CRC16-CCITT over the first 34 bytes
  let crc = 0;
  for (let i = 0; i < 34; i++) {
    crc ^= buf[i] << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) : crc << 1;
      crc &= 0xffff;
    }
  }
  buf[34] = (crc >> 8) & 0xff;
  buf[35] = crc & 0xff;

  // Encode as URL-safe base64 (the standard TON friendly address format)
  let binary = "";
  for (let i = 0; i < 36; i++) binary += String.fromCharCode(buf[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// ---------------------------------------------------------------------------
// BOC encoding helper
// ---------------------------------------------------------------------------

/**
 * The Omniston SDK returns payload and stateInit as HEX-encoded BOC strings.
 * TonConnect wallets require standard base64-encoded BOC.
 * This converts hex → base64, while also gracefully handling the case where
 * the string is already base64 or base64url (from an older SDK version).
 */
function bocToBase64(s: string): string {
  if (!s) return s;

  // Looks like a valid hex BOC (even length, only hex chars)
  if (s.length % 2 === 0 && /^[0-9a-fA-F]+$/.test(s)) {
    const bytes = new Uint8Array(s.length / 2);
    for (let i = 0; i < s.length; i += 2) {
      bytes[i / 2] = parseInt(s.slice(i, i + 2), 16);
    }
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  // Fallback: treat as base64url and normalise to standard base64
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4;
  return pad ? b64 + "=".repeat(4 - pad) : b64;
}

// ---------------------------------------------------------------------------
// Asset / address builders for QuoteRequest
// ---------------------------------------------------------------------------

function buildAssetId(token: SwapTokenInfo) {
  if (token.isNative) {
    return {
      chain: {
        $case: "ton" as const,
        value: { kind: { $case: "native" as const, value: {} } },
      },
    };
  }
  return {
    chain: {
      $case: "ton" as const,
      value: {
        kind: { $case: "jetton" as const, value: token.jettonAddress! },
      },
    },
  };
}

function buildChainAddress(address: string) {
  return { chain: { $case: "ton" as const, value: address } };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function buildOmnistonSwapRequest(
  fromToken: SwapTokenInfo,
  toToken: SwapTokenInfo,
  inputUnits: string
): QuoteRequest {
  return {
    inputAsset: buildAssetId(fromToken),
    outputAsset: buildAssetId(toToken),
    amount: { $case: "inputUnits", value: inputUnits },
    settlementParams: [
      {
        params: {
          $case: "swap",
          value: {
            maxPriceSlippagePips: 10_000,
            maxRoutes: 4,
            allowRiskyRoutes: false,
          },
        },
      },
    ],
  };
}

export function subscribeToQuote(
  fromToken: SwapTokenInfo,
  toToken: SwapTokenInfo,
  inputUnits: string,
  onQuote: (quote: Quote) => void,
  onNoQuote: () => void,
  onError: (err: Error) => void
): () => void {
  const request = buildOmnistonSwapRequest(fromToken, toToken, inputUnits);
  const sub = omniston.requestForQuote(request).subscribe({
    next: (event) => {
      if (!event || !("$case" in event)) return;
      if (event.$case === "quoteUpdated") {
        onQuote(event.value);
      } else if (event.$case === "noQuote") {
        onNoQuote();
      }
    },
    error: (err: unknown) =>
      onError(err instanceof Error ? err : new Error(String(err))),
  });
  return () => sub.unsubscribe();
}

export async function buildSwapTransaction(
  quote: Quote,
  walletAddress: string
): Promise<TonTransaction> {
  const request: BuildTonSwapRequest = {
    quoteId: quote.quoteId,
    transferSrcAddress: buildChainAddress(walletAddress),
    traderDstAddress: buildChainAddress(walletAddress),
    refundSrcAddress: buildChainAddress(walletAddress),
    gasExcessAddress: buildChainAddress(walletAddress),
    useRecommendedSlippage: true,
  };
  return omniston.tonBuildSwap(request);
}

/**
 * Convert an Omniston TonTransaction into the format TonConnect wallets
 * expect for sendTransaction().
 *
 * Key conversions per the TonConnect spec and Omniston SDK types:
 *  - address  : must be in user-friendly format (EQ.../UQ...) — converted
 *               from raw 0:... if necessary
 *  - amount   : nanotons as a decimal string — passed through as-is
 *  - payload  : BOC as standard base64 — SDK returns hex, so hex→base64
 *  - stateInit: BOC as standard base64 — same hex→base64 conversion
 *  - from     : sender's non-bounceable friendly address (wallet address)
 */
export function tonTransactionToTonConnect(
  tx: TonTransaction,
  walletAddress?: string
) {
  const request: {
    validUntil: number;
    from?: string;
    messages: {
      address: string;
      amount: string;
      payload?: string;
      stateInit?: string;
    }[];
  } = {
    validUntil: Math.floor(Date.now() / 1000) + 600,
    messages: tx.messages.map((msg) => ({
      // Destination is a smart contract → bounceable (EQ...)
      address: toFriendlyAddress(msg.targetAddress, true),
      amount: msg.sendAmount,
      // SDK delivers BOC as hex; TonConnect needs standard base64
      payload: msg.payload ? bocToBase64(msg.payload) : undefined,
      stateInit: msg.jettonWalletStateInit
        ? bocToBase64(msg.jettonWalletStateInit)
        : undefined,
    })),
  };

  if (walletAddress) {
    // Sender is a wallet → non-bounceable (UQ...)
    request.from = toFriendlyAddress(walletAddress, false);
  }

  return request;
}
