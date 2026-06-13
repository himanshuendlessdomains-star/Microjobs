import type {
  Bounty,
  UserBounty,
  AppNotification,
  CreateBountyFormData,
  ProofSubmission,
  Submission,
  ReviewBounty,
  SubmissionStatus,
  UserStats,
  PlatformStats,
} from "./types";

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

export interface EscrowDeployTx {
  stateInitBoc: string;
  fundPayloadBoc: string;
  totalNanotons: string;
}

export async function createBounty(
  data: CreateBountyFormData & { creatorAddress: string; creatorName?: string }
): Promise<Bounty & { escrowDeployTx: EscrowDeployTx | null }> {
  return post<Bounty & { escrowDeployTx: EscrowDeployTx | null }>("/api/bounties", data);
}

export async function confirmBounty(bountyId: string, creatorAddress: string): Promise<void> {
  const res = await fetch(`${BASE}/api/bounties/${bountyId}/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creatorAddress }),
  });
  if (!res.ok) {
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(json.error ?? `API ${res.status}`);
  }
}

export async function getEscrowTx(
  bountyId: string,
  creatorAddress: string,
  operation: "settle" | "cancel",
  winners?: string[]
): Promise<{ escrowAddress: string; payloadBoc: string; gasNanotons: string }> {
  const res = await fetch(`${BASE}/api/bounties/${bountyId}/escrow`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ operation, creatorAddress, winners }),
  });
  if (!res.ok) {
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(json.error ?? `API ${res.status}`);
  }
  return res.json() as Promise<{ escrowAddress: string; payloadBoc: string; gasNanotons: string }>;
}

export async function getSubmissions(
  bountyId: string
): Promise<{ bounty: ReviewBounty; submissions: Submission[]; approvedCount: number }> {
  return get(`/api/bounties/${bountyId}/submissions`);
}

export async function updateSubmission(
  bountyId: string,
  submissionId: string,
  status: SubmissionStatus,
  creatorAddress: string
): Promise<void> {
  const res = await fetch(`${BASE}/api/bounties/${bountyId}/submissions/${submissionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, creatorAddress }),
  });
  if (!res.ok) {
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(json.error ?? `API ${res.status}`);
  }
}

export async function closeBounty(
  bountyId: string,
  creatorAddress: string,
  opts?: { winnerCount?: number; txBoc?: string }
): Promise<void> {
  const res = await fetch(`${BASE}/api/bounties/${bountyId}/close`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creatorAddress, ...opts }),
  });
  if (!res.ok) {
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(json.error ?? `API ${res.status}`);
  }
}

export async function requestRefund(
  bountyId: string,
  creatorAddress: string
): Promise<{ poolAmount: number }> {
  const res = await fetch(`${BASE}/api/bounties/${bountyId}/refund`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creatorAddress }),
  });
  if (!res.ok) {
    const json = (await res.json().catch(() => ({}))) as {
      error?: string;
      needsMigration?: boolean;
    };
    const err = new Error(json.error ?? `API ${res.status}`);
    if (json.needsMigration) Object.assign(err, { needsMigration: true });
    throw err;
  }
  return res.json() as Promise<{ poolAmount: number }>;
}

export async function getPlatformStats(): Promise<PlatformStats> {
  return get<PlatformStats>("/api/stats");
}

export async function getUserStats(walletAddress: string): Promise<UserStats> {
  return get<UserStats>(`/api/users/${encodeURIComponent(walletAddress)}/stats`);
}

export async function trackReferral(
  referredAddress: string,
  referrerCode: string
): Promise<void> {
  const res = await fetch(`${BASE}/api/referrals/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ referredAddress, referrerCode }),
  });
  if (!res.ok && res.status !== 422) {
    throw new Error(`API ${res.status}`);
  }
}

export async function submitProof(
  bountyId: string,
  sub: ProofSubmission & { walletAddress: string }
): Promise<void> {
  await post(`/api/bounties/${bountyId}/participate`, {
    walletAddress: sub.walletAddress,
    proofType: sub.proofType,
    content: sub.content,
    notes: sub.notes,
  });
}
