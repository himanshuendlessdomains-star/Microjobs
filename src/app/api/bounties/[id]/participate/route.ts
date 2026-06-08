import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = (await request.json()) as {
      walletAddress: string;
      proofType: string;
      content: string;
      notes?: string;
    };

    if (!body.walletAddress || !body.content?.trim()) {
      return NextResponse.json(
        { error: "walletAddress and content are required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();

    // Check bounty exists and is active
    const { data: bounty, error: bountyErr } = await supabase
      .from("bounties")
      .select("id, status, creator_address")
      .eq("id", params.id)
      .maybeSingle();

    if (bountyErr || !bounty) {
      return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
    }
    const row = bounty as { id: string; status: string; creator_address: string };
    if (row.status !== "active") {
      return NextResponse.json({ error: "Bounty is no longer active" }, { status: 400 });
    }
    if (row.creator_address === body.walletAddress) {
      return NextResponse.json({ error: "Creators cannot participate in their own bounty" }, { status: 403 });
    }

    // Prevent duplicate submissions
    const { data: existing } = await supabase
      .from("submissions")
      .select("id")
      .eq("bounty_id", params.id)
      .eq("wallet_address", body.walletAddress)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "Already submitted" }, { status: 409 });
    }

    // Insert submission
    const { error: subErr } = await supabase.from("submissions").insert({
      bounty_id: params.id,
      wallet_address: body.walletAddress,
      proof_type: body.proofType,
      content: body.content.trim(),
      notes: body.notes?.trim() ?? "",
      status: "pending",
    });

    if (subErr) return NextResponse.json({ error: subErr.message }, { status: 500 });

    // Increment participant count
    await supabase.rpc("increment_participants", { bounty_id: params.id });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
