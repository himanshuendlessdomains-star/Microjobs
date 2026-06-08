import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { mapSubmission, type DbSubmission } from "@/lib/db-mappers";
import type { ReviewBounty } from "@/lib/types";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServer();

    const { data: bounty, error: bountyErr } = await supabase
      .from("bounties")
      .select("id, title, winner_count, winner_selection, pool_amount, per_winner_amount, icon, category, creator_address, status")
      .eq("id", params.id)
      .single();

    if (bountyErr || !bounty) {
      return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
    }

    const { data: subs, error: subsErr } = await supabase
      .from("submissions")
      .select("*")
      .eq("bounty_id", params.id)
      .order("submitted_at", { ascending: false });

    if (subsErr) {
      return NextResponse.json({ error: subsErr.message }, { status: 500 });
    }

    const submissions = (subs ?? []).map((row) => mapSubmission(row as DbSubmission));
    const approvedCount = submissions.filter((s) => s.status === "approved").length;

    const reviewBounty: ReviewBounty = {
      id: bounty.id,
      title: bounty.title,
      winnerCount: bounty.winner_count,
      winnerSelection: bounty.winner_selection as "draw" | "manual",
      poolAmount: String(bounty.pool_amount),
      perWinnerAmount: String(bounty.per_winner_amount ?? bounty.pool_amount / (bounty.winner_count || 1)),
      icon: bounty.icon as ReviewBounty["icon"],
      category: bounty.category,
      creatorAddress: bounty.creator_address,
      status: bounty.status as ReviewBounty["status"],
    };

    return NextResponse.json({ bounty: reviewBounty, submissions, approvedCount });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 503 });
  }
}
