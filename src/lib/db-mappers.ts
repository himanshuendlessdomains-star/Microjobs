import type {
  Bounty,
  UserBounty,
  AppNotification,
  Submission,
  BountyType,
  BountyStatus,
  BountyRole,
  Category,
  WinnerSelection,
  NotificationType,
  ProofType,
  SubmissionStatus,
} from "./types";

export type DbBounty = {
  id: string;
  title: string;
  description: string;
  type: string;
  category: string;
  pool_amount: number;
  pool_usd: number;
  winner_count: number;
  per_winner_amount: number;
  winner_selection: string;
  participants: number;
  deadline_at: string;
  is_hot: boolean;
  icon: string;
  creator_name: string | null;
  creator_address: string;
  creator_avatar: string | null;
  entry_fee: number | null;
  status: string;
  created_at: string;
};

export type DbSubmission = {
  id: string;
  bounty_id: string;
  wallet_address: string;
  proof_type: string;
  content: string;
  notes: string;
  status: string;
  submitted_at: string;
};

export type DbNotification = {
  id: string;
  wallet_address: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
};

export function mapBounty(row: DbBounty): Bounty {
  const timeLeftSeconds = Math.max(
    0,
    Math.floor((new Date(row.deadline_at).getTime() - Date.now()) / 1000)
  );
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    type: row.type as BountyType,
    category: row.category as Category,
    poolAmount: String(row.pool_amount),
    poolUsd: String(row.pool_usd ?? 0),
    winnerCount: row.winner_count,
    perWinnerAmount: String(row.per_winner_amount),
    winnerSelection: row.winner_selection as WinnerSelection,
    participants: row.participants,
    timeLeftSeconds,
    isHot: row.is_hot,
    icon: (row.icon as Bounty["icon"]) ?? "rocket",
    creatorName: row.creator_name ?? "Anonymous",
    creatorAvatar: row.creator_avatar ?? undefined,
    entryFee: row.entry_fee != null ? String(row.entry_fee) : undefined,
  };
}

export function mapUserBounty(
  row: DbBounty,
  role: BountyRole,
  submissionStatus: string | null
): UserBounty {
  const timeLeftSeconds = Math.max(
    0,
    Math.floor((new Date(row.deadline_at).getTime() - Date.now()) / 1000)
  );
  let status: BountyStatus;
  if (row.status === "active") {
    status = "active";
  } else if (role === "joined" && submissionStatus === "approved") {
    status = "won";
  } else {
    status = "ended";
  }
  return {
    id: row.id,
    title: row.title,
    poolAmount: String(row.pool_amount),
    perWinnerAmount: String(row.per_winner_amount),
    winnerCount: row.winner_count,
    participants: row.participants,
    timeLeftSeconds,
    status,
    role,
    icon: (row.icon as UserBounty["icon"]) ?? "rocket",
    category: row.category as Category,
  };
}

export function mapSubmission(row: DbSubmission): Submission {
  return {
    id: row.id,
    bountyId: row.bounty_id,
    walletAddress: row.wallet_address,
    proofType: row.proof_type as ProofType,
    content: row.content,
    notes: row.notes,
    status: row.status as SubmissionStatus,
    submittedAt: row.submitted_at,
  };
}

export function mapNotification(row: DbNotification): AppNotification {
  const { timeAgo, isToday } = computeTimeAgo(row.created_at);
  return {
    id: row.id,
    type: row.type as NotificationType,
    title: row.title,
    body: row.body,
    timeAgo,
    isToday,
    read: row.read,
  };
}

function computeTimeAgo(createdAt: string): { timeAgo: string; isToday: boolean } {
  const diff = Date.now() - new Date(createdAt).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const isToday = new Date().toDateString() === new Date(createdAt).toDateString();

  let timeAgo: string;
  if (minutes < 1) timeAgo = "just now";
  else if (minutes < 60) timeAgo = `${minutes}m ago`;
  else if (hours < 24) timeAgo = `${hours}h ago`;
  else timeAgo = `${days}d ago`;

  return { timeAgo, isToday };
}
