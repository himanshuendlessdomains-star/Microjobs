export type BountyStatus = "active" | "ended" | "cancelled";
export type WinnerSelection = "draw" | "manual";
export type ParticipationStatus = "submitted" | "won" | "not_selected";
export type NotificationType = "winner" | "deadline" | "submission" | "funded";
export type TonNetwork = "mainnet" | "testnet";

// ── Database row shapes (mirroring Supabase schema) ─────────────────────────

export interface DbUser {
  address: string;
  username: string | null;
  telegram_id: number | null;
  created_at: string;
}

export interface DbBounty {
  id: string;
  creator_address: string;
  title: string;
  description: string | null;
  category: string;
  pool_amount: number;
  winner_count: number;
  winner_selection: WinnerSelection;
  deadline: string;
  status: BountyStatus;
  icon: string;
  is_hot: boolean;
  tx_hash: string | null;
  created_at: string;
}

export interface DbParticipation {
  id: string;
  bounty_id: string;
  user_address: string;
  proof_url: string | null;
  proof_notes: string | null;
  status: ParticipationStatus;
  submitted_at: string;
}

export interface DbNotification {
  id: string;
  user_address: string;
  type: NotificationType;
  title: string;
  body: string;
  bounty_id: string | null;
  is_read: boolean;
  created_at: string;
}

// ── TonConnect proof payload ─────────────────────────────────────────────────

export interface TonProofPayload {
  address: string;
  network: "-239" | "-3";          // -239 = mainnet, -3 = testnet
  public_key: string;
  proof: {
    timestamp: number;
    domain: {
      lengthBytes: number;
      value: string;
    };
    signature: string;
    payload: string;
    state_init?: string;
  };
}

// ── JWT claims ────────────────────────────────────────────────────────────────

export interface JwtPayload {
  sub: string;          // wallet address
  network: TonNetwork;
  iat: number;
  exp: number;
}

// ── Express augmentation ──────────────────────────────────────────────────────

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
