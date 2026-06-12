import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCountdown(totalSeconds: number): string {
  if (totalSeconds <= 0) return "00:00:00";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

export function formatTON(amount: string): string {
  const n = parseFloat(amount);
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(2).replace(/\.?0+$/, "");
}

/**
 * Convert a TON amount string ("2.5", "10") to nanotons string.
 * Uses integer arithmetic to avoid floating-point rounding errors.
 */
export function tonToNanoton(ton: string): string {
  const clean = (ton ?? "0").trim().replace(/,/g, "");
  const [intStr, fracStr = ""] = clean.split(".");
  const frac9 = fracStr.slice(0, 9).padEnd(9, "0");
  return (BigInt(intStr || "0") * 1_000_000_000n + BigInt(frac9)).toString();
}

/**
 * Convert a raw TON address ("workchain:hex64") to user-friendly base64url format.
 * bounceable=true  → EQ... (smart contracts)
 * bounceable=false → UQ... (user wallets — use this for prize distribution)
 *
 * Already-friendly addresses (48-char base64url) are returned unchanged.
 * Unknown formats are passed through as-is so nothing silently breaks.
 */
export function toFriendlyAddress(addr: string, bounceable = true): string {
  if (!addr) return addr;
  if (/^[A-Za-z0-9_-]{48}$/.test(addr)) return addr;

  const m = addr.match(/^(-?\d+):([0-9a-fA-F]{64})$/);
  if (!m) return addr;

  const workchain = parseInt(m[1], 10);
  const hexAddr = m[2];
  const buf = new Uint8Array(36);

  buf[0] = bounceable ? 0x11 : 0x51;
  buf[1] = workchain & 0xff;
  for (let i = 0; i < 32; i++) {
    buf[2 + i] = parseInt(hexAddr.slice(i * 2, i * 2 + 2), 16);
  }

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

  let binary = "";
  for (let i = 0; i < 36; i++) binary += String.fromCharCode(buf[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
