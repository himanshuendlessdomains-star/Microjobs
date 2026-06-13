import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

const TON_ADDRESS_RE = /^[A-Za-z0-9_-]{48}$|^-?\d+:[0-9a-fA-F]{64}$/;

export async function GET(
  _request: Request,
  { params }: { params: { address: string } }
) {
  const address = decodeURIComponent(params.address);
  if (!TON_ADDRESS_RE.test(address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServer();

    const [createdResult, wonResult] = await Promise.all([
      supabase
        .from("bounties")
        .select("*", { count: "exact", head: true })
        .eq("creator_address", address),

      supabase
        .from("submissions")
        .select("bounties!inner(per_winner_amount, status)")
        .eq("wallet_address", address)
        .eq("status", "approved"),
    ]);

    const created = createdResult.count ?? 0;

    type WonRow = { bounties: { per_winner_amount: number; status: string } | { per_winner_amount: number; status: string }[] | null };
    const wonRows = ((wonResult.data ?? []) as unknown as WonRow[]).filter((r) => {
      const b = Array.isArray(r.bounties) ? r.bounties[0] : r.bounties;
      return b?.status === "closed";
    });
    const won = wonRows.length;
    const earnedNano = wonRows.reduce((sum, r) => {
      const b = Array.isArray(r.bounties) ? r.bounties[0] : r.bounties;
      return sum + (b?.per_winner_amount ?? 0);
    }, 0);

    let referrals = 0;
    try {
      const { count } = await supabase
        .from("referrals")
        .select("*", { count: "exact", head: true })
        .eq("referrer_address", address);
      referrals = count ?? 0;
    } catch {
      // referrals table may not exist yet
    }

    return NextResponse.json({
      created,
      won,
      earned: String(earnedNano),
      referrals,
    });
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
