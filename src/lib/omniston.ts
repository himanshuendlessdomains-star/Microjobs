import { Omniston } from "@ston-fi/omniston-sdk";
import type { Quote, QuoteRequest, BuildTonSwapRequest, TonTransaction } from "@ston-fi/omniston-sdk";
import type { SwapTokenInfo } from "./types";

export const omniston = new Omniston({
  apiUrl: "wss://omni-ws.ston.fi",
});

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
    error: (err: unknown) => onError(err instanceof Error ? err : new Error(String(err))),
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

export function tonTransactionToTonConnect(tx: TonTransaction) {
  return {
    validUntil: Math.floor(Date.now() / 1000) + 600,
    messages: tx.messages.map((msg) => ({
      address: msg.targetAddress,
      amount: msg.sendAmount,
      // payload and stateInit arrive from Omniston already base64-encoded
      payload: msg.payload || undefined,
      stateInit: msg.jettonWalletStateInit || undefined,
    })),
  };
}
