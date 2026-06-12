import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

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

    if (b.creator_address !== body.creatorAddress) {
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
      // Retry without optional column if it doesn't exist in schema yet
      if (error.code === "42703" || error.message?.includes("prize_tx_boc")) {
        const { error: retryErr } = await supabase
          .from("bounties")
          .update({ status: "closed" })
          .eq("id", params.id);
        if (retryErr) return NextResponse.json({ error: retryErr.message }, { status: 500 });
      } else {
        return NextResponse.json({ error: error.message }, { status: 500 });
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
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
