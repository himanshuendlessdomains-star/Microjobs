import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { mapBounty, type DbBounty } from "@/lib/db-mappers";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServer();

    const { data, error } = await supabase
      .from("bounties")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
    }

    const bounty = mapBounty(data as DbBounty);

    // Fetch real submission count and winner wallets in parallel
    const [subCountResult, winnersResult] = await Promise.all([
      supabase
        .from("submissions")
        .select("*", { count: "exact", head: true })
        .eq("bounty_id", params.id),
      bounty.status === "closed"
        ? supabase
            .from("submissions")
            .select("wallet_address")
            .eq("bounty_id", params.id)
            .eq("status", "approved")
        : Promise.resolve({ data: [] as { wallet_address: string }[] }),
    ]);

    // Override the denormalized participant counter with the real count
    if (subCountResult.count !== null) {
      bounty.participants = subCountResult.count;
    }

    // Attach winner wallets when closed
    if (bounty.status === "closed" && winnersResult.data && winnersResult.data.length > 0) {
      bounty.winners = winnersResult.data.map((r) => r.wallet_address);
    }

    return NextResponse.json(bounty);
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
