import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

const PG_CHECK_VIOLATION = "23514";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = (await request.json()) as {
      creatorAddress: string;
      winnerCount?: number;
      txBoc?: string;
    };

    if (!body.creatorAddress) {
      return NextResponse.json({ error: "creatorAddress is required" }, { status: 400 });
    }

    const supabase = getSupabaseServer();

    const { data: bounty } = await supabase
      .from("bounties")
      .select("creator_address, status, title, per_winner_amount")
      .eq("id", params.id)
      .single();

    if (!bounty) {
      return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
    }

    const b = bounty as {
      creator_address: string;
      status: string;
      title: string;
      per_winner_amount: number | null;
    };

    if (b.creator_address.toLowerCase() !== body.creatorAddress.toLowerCase()) {
      return NextResponse.json({ error: "Only the creator can close this bounty" }, { status: 403 });
    }

    if (b.status === "closed") {
      return NextResponse.json({ ok: true });
    }

    // Build update payload — prize_tx_boc is optional (column may not exist yet)
    const update: Record<string, unknown> = { status: "closed" };
    if (body.txBoc) update.prize_tx_boc = body.txBoc;

    const { error } = await supabase
      .from("bounties")
      .update(update)
      .eq("id", params.id);

    if (error) {
      // prize_tx_boc column doesn't exist yet — retry without it
      if (error.code === "42703" || error.message?.includes("prize_tx_boc")) {
        const { error: retryErr } = await supabase
          .from("bounties")
          .update({ status: "closed" })
          .eq("id", params.id);
        if (retryErr) {
          if (retryErr.code === PG_CHECK_VIOLATION || retryErr.message?.includes("bounties_status_check")) {
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
          return NextResponse.json({ error: "Failed to close bounty" }, { status: 500 });
        }
      } else if (error.code === PG_CHECK_VIOLATION || error.message?.includes("bounties_status_check")) {
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
      } else {
        return NextResponse.json({ error: "Failed to close bounty" }, { status: 500 });
      }
    }

    // Send "prize distributed" notifications to all approved winners (non-blocking)
    const { data: approvedSubs } = await supabase
      .from("submissions")
      .select("wallet_address")
      .eq("bounty_id", params.id)
      .eq("status", "approved");

    if (approvedSubs && approvedSubs.length > 0) {
      const perWinner = b.per_winner_amount
        ? Number(b.per_winner_amount).toFixed(2)
        : null;

      const notifs = (approvedSubs as { wallet_address: string }[]).map((s) => ({
        wallet_address: s.wallet_address,
        type: "winner",
        title: "Prize sent to your wallet! 💰",
        body: perWinner
          ? `Your prize of ${perWinner} TON from "${b.title}" has been sent to your wallet.`
          : `Your prize from "${b.title}" has been sent to your wallet.`,
        read: false,
      }));

      void supabase.from("notifications").insert(notifs);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
