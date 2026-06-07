import type { Bounty, UserBounty, AppNotification } from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

export async function getBounties(params?: {
  category?: string;
  search?: string;
}): Promise<Bounty[]> {
  const q = new URLSearchParams();
  if (params?.category && params.category !== "All") q.set("category", params.category);
  if (params?.search) q.set("search", params.search);
  const qs = q.toString() ? `?${q.toString()}` : "";
  return get<Bounty[]>(`/api/bounties${qs}`);
}

export async function getBounty(id: string): Promise<Bounty> {
  return get<Bounty>(`/api/bounties/${id}`);
}

export async function getUserBounties(walletAddress: string): Promise<UserBounty[]> {
  return get<UserBounty[]>(`/api/users/${encodeURIComponent(walletAddress)}/bounties`);
}

export async function getNotifications(walletAddress: string): Promise<AppNotification[]> {
  return get<AppNotification[]>(`/api/users/${encodeURIComponent(walletAddress)}/notifications`);
}

export async function markAllRead(walletAddress: string): Promise<void> {
  await post(`/api/users/${encodeURIComponent(walletAddress)}/notifications/read-all`);
}
