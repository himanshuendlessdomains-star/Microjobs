import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

// Never prerender — always fetch live from DB
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = getSupabaseServer();
    const now = new Date().toISOString();

    const [activeResult, closedResult] = await Promise.all([
      supabase
        .from("bounties")
        .select("id, pool_amount, deadline_at")
        .eq("status", "active"),
      supabase
        .from("bounties")
        .select("pool_amount")
        .eq("status", "closed"),
    ]);

    const activeBounties = (activeResult.data ?? []) as {
      id: string;
      pool_amount: number;
      deadline_at: string;
    }[];
    const closedBounties = (closedResult.data ?? []) as { pool_amount: number }[];

    const totalEscrow = activeBounties.reduce((sum, b) => sum + (b.pool_amount ?? 0), 0);
    const totalDistributed = closedBounties.reduce((sum, b) => sum + (b.pool_amount ?? 0), 0);
    const bountiesClosed = closedBounties.length;
    const bountiesActive = activeBounties.length;

    const expiredBounties = activeBounties.filter((b) => b.deadline_at < now);

    let totalClaimable = 0;
    if (expiredBounties.length > 0) {
      const { data: approvedSubs } = await supabase
        .from("submissions")
        .select("bounty_id")
        .in("bounty_id", expiredBounties.map((b) => b.id))
        .eq("status", "approved");

      const hasApprovedSet = new Set((approvedSubs ?? []).map((s) => s.bounty_id as string));
      totalClaimable = expiredBounties
        .filter((b) => !hasApprovedSet.has(b.id))
        .reduce((sum, b) => sum + (b.pool_amount ?? 0), 0);
    }

    return NextResponse.json({
      totalEscrow,
      totalClaimable,
      totalDistributed,
      bountiesClosed,
      bountiesActive,
    });
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
