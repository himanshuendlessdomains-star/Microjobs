import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const VALID_PROOF_TYPES = ["text", "link", "image"] as const;
  const TON_ADDRESS_RE = /^[A-Za-z0-9_-]{48}$|^-?\d+:[0-9a-fA-F]{64}$/;

  try {
    const body = (await request.json()) as {
      walletAddress: string;
      proofType: string;
      content: string;
      notes?: string;
    };

    // Presence checks
    if (!body.walletAddress || !body.content?.trim()) {
      return NextResponse.json(
        { error: "walletAddress and content are required" },
        { status: 400 }
      );
    }

    // Wallet address format
    if (!TON_ADDRESS_RE.test(body.walletAddress)) {
      return NextResponse.json({ error: "Invalid wallet address format" }, { status: 400 });
    }

    // Proof type whitelist
    if (!VALID_PROOF_TYPES.includes(body.proofType as (typeof VALID_PROOF_TYPES)[number])) {
      return NextResponse.json({ error: "proofType must be text, link, or image" }, { status: 400 });
    }

    // Content length limits
    if (body.content.trim().length > 5000) {
      return NextResponse.json({ error: "Content must be 5000 characters or fewer" }, { status: 400 });
    }
    if ((body.notes ?? "").length > 1000) {
      return NextResponse.json({ error: "Notes must be 1000 characters or fewer" }, { status: 400 });
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
      notes: (body.notes ?? "").trim(),
      status: "pending",
    });

    if (subErr) return NextResponse.json({ error: "Failed to submit proof" }, { status: 500 });

    // Increment participant count
    await supabase.rpc("increment_participants", { bounty_id: params.id });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
