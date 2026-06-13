import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

// PostgreSQL error code for check-constraint violation
const PG_CHECK_VIOLATION = "23514";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = (await request.json()) as { creatorAddress: string };

    if (!body.creatorAddress) {
      return NextResponse.json({ error: "creatorAddress is required" }, { status: 400 });
    }

    const supabase = getSupabaseServer();

    const { data: bounty } = await supabase
      .from("bounties")
      .select("creator_address, status, title, pool_amount")
      .eq("id", params.id)
      .single();

    if (!bounty) {
      return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
    }

    const b = bounty as {
      creator_address: string;
      status: string;
      title: string;
      pool_amount: number;
    };

    if (b.creator_address !== body.creatorAddress) {
      return NextResponse.json({ error: "Only the creator can claim a refund" }, { status: 403 });
    }

    if (b.status === "closed") {
      return NextResponse.json({ ok: true, alreadyRefunded: true });
    }

    // Confirm no submissions were approved (nobody won — safe to refund)
    const { count: approvedCount } = await supabase
      .from("submissions")
      .select("*", { count: "exact", head: true })
      .eq("bounty_id", params.id)
      .eq("status", "approved");

    if ((approvedCount ?? 0) > 0) {
      return NextResponse.json(
        { error: "Winners have been selected — cannot refund a bounty with approved submissions." },
        { status: 409 }
      );
    }

    const { error } = await supabase
      .from("bounties")
      .update({ status: "closed" })
      .eq("id", params.id);

    if (error) {
      // Check-constraint violation: the DB schema needs a one-time migration.
      if (error.code === PG_CHECK_VIOLATION || error.message?.includes("bounties_status_check")) {
        return NextResponse.json(
          {
            error:
              "Database schema needs updating. Run this SQL once in your Supabase SQL Editor:\n\n" +
              "ALTER TABLE bounties DROP CONSTRAINT bounties_status_check;\n" +
              "ALTER TABLE bounties ADD CONSTRAINT bounties_status_check\n" +
              "  CHECK (status IN ('active', 'closed'));",
            needsMigration: true,
          },
          { status: 422 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Notify the creator that the refund has been initiated (non-blocking)
    const poolTon = Number(b.pool_amount).toFixed(2);
    void supabase.from("notifications").insert({
      wallet_address: b.creator_address,
      type: "refund",
      title: "Refund initiated",
      body: `Your bounty "${b.title}" had no participants. Your pool of ${poolTon} TON has been marked for refund and will be returned to your wallet.`,
      read: false,
    });

    return NextResponse.json({ ok: true, poolAmount: b.pool_amount });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
