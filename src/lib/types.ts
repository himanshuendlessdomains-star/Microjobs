export type WinnerSelection = "draw" | "manual";
export type BountyType = "task" | "quiz" | "creative";
export type Category = "All" | "Creative" | "Social" | "Analytics" | "Dev";
export type BountyStatus = "active" | "ended" | "won";
export type BountyRole = "created" | "joined";
export type NotificationType = "winner" | "deadline" | "submission" | "funded";

export interface Bounty {
  id: string;
  title: string;
  description: string;
  type: BountyType;
  category: Category;
  poolAmount: string;
  poolUsd: string;
  winnerCount: number;
  perWinnerAmount: string;
  winnerSelection: WinnerSelection;
  participants: number;
  timeLeftSeconds: number;
  isHot: boolean;
  icon: "rocket" | "x" | "chart" | "code" | "star" | "trophy";
  creatorName: string;
  creatorAvatar?: string;
}

export interface UserBounty {
  id: string;
  title: string;
  poolAmount: string;
  perWinnerAmount: string;
  winnerCount: number;
  participants: number;
  timeLeftSeconds: number;
  status: BountyStatus;
  role: BountyRole;
  icon: "rocket" | "x" | "chart" | "code" | "star" | "trophy";
  category: Category;
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  timeAgo: string;
  isToday: boolean;
  read: boolean;
}
