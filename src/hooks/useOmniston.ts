"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Quote } from "@ston-fi/omniston-sdk";
import { useTonConnectUI } from "@tonconnect/ui-react";
import {
  subscribeToQuote,
  buildSwapTransaction,
  tonTransactionToTonConnect,
} from "@/lib/omniston";
import { SWAP_TOKENS, toNanoUnits, fromNanoUnits } from "@/lib/tokens";
import type { SwapTokenInfo } from "@/lib/types";

export type SwapStatus = "idle" | "quoting" | "quoted" | "no_quote" | "swapping" | "done" | "error";

interface UseOmnistonOptions {
  defaultFromToken?: SwapTokenInfo;
  defaultToToken?: SwapTokenInfo;
}

export function useOmniston(walletAddress: string | null, opts?: UseOmnistonOptions) {
  const [fromToken, setFromToken] = useState<SwapTokenInfo>(
    opts?.defaultFromToken ?? SWAP_TOKENS[1]
  );
  const [toToken, setToToken] = useState<SwapTokenInfo>(
    opts?.defaultToToken ?? SWAP_TOKENS[0]
  );
  const [fromAmount, setFromAmount] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [status, setStatus] = useState<SwapStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const [tonConnectUI] = useTonConnectUI();
  const unsubRef = useRef<(() => void) | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const estimatedOutput = quote
    ? fromNanoUnits(quote.outputUnits, toToken.decimals)
    : "";

  const requestQuote = useCallback(() => {
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }

    const amount = parseFloat(fromAmount);
    if (!fromAmount || isNaN(amount) || amount <= 0) {
      setStatus("idle");
      setQuote(null);
      return;
    }

    setStatus("quoting");
    setQuote(null);
    setErrorMsg("");

    const inputUnits = toNanoUnits(fromAmount, fromToken.decimals);

    unsubRef.current = subscribeToQuote(
      fromToken,
      toToken,
      inputUnits,
      (q) => {
        setQuote(q);
        setStatus("quoted");
      },
      () => {
        setStatus("no_quote");
        setErrorMsg("No route found for this swap.");
      },
      (err) => {
        setStatus("error");
        setErrorMsg(err.message || "Failed to get quote.");
      }
    );
  }, [fromAmount, fromToken, toToken]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(requestQuote, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [requestQuote]);

  useEffect(() => {
    return () => {
      if (unsubRef.current) unsubRef.current();
    };
  }, []);

  const executeSwap = useCallback(async () => {
    if (!quote || !walletAddress) return;
    setStatus("swapping");
    try {
      const tx = await buildSwapTransaction(quote, walletAddress);
      const tcTx = tonTransactionToTonConnect(tx);
      await tonConnectUI.sendTransaction(tcTx);
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Swap failed.");
    }
  }, [quote, walletAddress, tonConnectUI]);

  const reset = useCallback(() => {
    if (unsubRef.current) unsubRef.current();
    setFromAmount("");
    setQuote(null);
    setStatus("idle");
    setErrorMsg("");
  }, []);

  return {
    fromToken,
    toToken,
    fromAmount,
    quote,
    status,
    errorMsg,
    estimatedOutput,
    setFromToken,
    setToToken,
    setFromAmount,
    executeSwap,
    reset,
    tokens: SWAP_TOKENS,
  };
}
