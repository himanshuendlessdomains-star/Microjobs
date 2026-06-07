import type { SwapTokenInfo } from "./types";

export const SWAP_TOKENS: SwapTokenInfo[] = [
  {
    symbol: "TON",
    name: "Toncoin",
    decimals: 9,
    color: "#0098EA",
    isNative: true,
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
    color: "#26A17B",
    isNative: false,
    jettonAddress: "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs",
  },
  {
    symbol: "NOT",
    name: "Notcoin",
    decimals: 9,
    color: "#E8D447",
    isNative: false,
    jettonAddress: "EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT",
  },
  {
    symbol: "STON",
    name: "STON.fi",
    decimals: 9,
    color: "#7B61FF",
    isNative: false,
    jettonAddress: "EQA2kCVNwVsil2EM2mB0SkXytxCqQjS4mttjDpnXmwG9T6bO",
  },
];

export function toNanoUnits(amount: string, decimals: number): string {
  const parsed = parseFloat(amount);
  if (isNaN(parsed) || parsed <= 0) return "0";
  return Math.floor(parsed * 10 ** decimals).toString();
}

export function fromNanoUnits(units: string, decimals: number): string {
  const n = parseFloat(units);
  if (isNaN(n)) return "0";
  const result = n / 10 ** decimals;
  const str = result.toFixed(decimals);
  return parseFloat(str).toString();
}
