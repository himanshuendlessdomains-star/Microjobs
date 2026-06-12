import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; submissionId: string } }
) {
  try {
    const body = (await request.json()) as { status: "approved" | "rejected" };

    if (!["approved", "rejected"].includes(body.status)) {
      return NextResponse.json({ error: "status must be approved or rejected" }, { status: 400 });
    }

    const supabase = getSupabaseServer();

    const { data: bounty } = await supabase
      .from("bounties")
      .select("winner_count, title, per_winner_amount")
      .eq("id", params.id)
      .single();

    if (!bounty) {
      return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
    }

    const b = bounty as { winner_count: number; title: string; per_winner_amount: number | null };

    if (body.status === "approved") {
      const { count } = await supabase
        .from("submissions")
        .select("*", { count: "exact", head: true })
        .eq("bounty_id", params.id)
        .eq("status", "approved");

      if ((count ?? 0) >= b.winner_count) {
        return NextResponse.json(
          { error: `Winner limit of ${b.winner_count} already reached` },
          { status: 409 }
        );
      }
    }

    // Fetch the submission so we know the wallet address for the notification
    const { data: sub } = await supabase
      .from("submissions")
      .select("wallet_address, status")
      .eq("id", params.submissionId)
      .eq("bounty_id", params.id)
      .single();

    if (!sub) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    const { error } = await supabase
      .from("submissions")
      .update({ status: body.status })
      .eq("id", params.submissionId)
      .eq("bounty_id", params.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Fire winner-selected notification when approved (non-blocking — ignore failures)
    if (body.status === "approved" && sub.status !== "approved") {
      const perWinner = b.per_winner_amount
        ? Number(b.per_winner_amount).toFixed(2)
        : null;

      const notifBody = perWinner
        ? `You've been selected as a winner for "${b.title}". Your prize of ${perWinner} TON will be sent to your wallet once the creator finalizes the bounty.`
        : `You've been selected as a winner for "${b.title}". Your prize will be sent once the creator finalizes the bounty.`;

      void supabase.from("notifications").insert({
        wallet_address: sub.wallet_address,
        type: "winner",
        title: "You're a winner! 🏆",
        body: notifBody,
        read: false,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
