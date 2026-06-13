import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { mapUserBounty, type DbBounty } from "@/lib/db-mappers";

const TON_ADDRESS_RE = /^[A-Za-z0-9_-]{48}$|^-?\d+:[0-9a-fA-F]{64}$/;

export async function GET(
  _request: Request,
  { params }: { params: { address: string } }
) {
  const address = decodeURIComponent(params.address);

  if (!TON_ADDRESS_RE.test(address)) {
    return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServer();

    // Bounties this wallet created
    const { data: created, error: createdErr } = await supabase
      .from("bounties")
      .select("*")
      .eq("creator_address", address)
      .order("created_at", { ascending: false });

    if (createdErr) return NextResponse.json({ error: "Failed to load bounties" }, { status: 500 });

    // Bounties this wallet submitted to (with submission status).
    // Explicit FK hint avoids Supabase ambiguity errors.
    const { data: subs, error: subsErr } = await supabase
      .from("submissions")
      .select("status, bounties!bounty_id(*)")
      .eq("wallet_address", address)
      .order("submitted_at", { ascending: false });

    if (subsErr) return NextResponse.json({ error: "Failed to load submissions" }, { status: 500 });

    const createdIds = new Set((created ?? []).map((b) => b.id));

    const result = [
      ...(created ?? []).map((row) => mapUserBounty(row as DbBounty, "created", null)),
      ...(subs ?? [])
        .filter((s) => {
          const bounty = s.bounties as unknown as DbBounty | null;
          return bounty && !createdIds.has(bounty.id);
        })
        .map((s) =>
          mapUserBounty(s.bounties as unknown as DbBounty, "joined", s.status as string)
        ),
    ];

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
