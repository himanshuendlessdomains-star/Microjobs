import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { mapUserBounty, type DbBounty } from "@/lib/db-mappers";

export async function GET(
  _request: Request,
  { params }: { params: { address: string } }
) {
  const address = decodeURIComponent(params.address);

  try {
    const supabase = getSupabaseServer();

    // Bounties this wallet created
    const { data: created, error: createdErr } = await supabase
      .from("bounties")
      .select("*")
      .eq("creator_address", address)
      .order("created_at", { ascending: false });

    if (createdErr) return NextResponse.json({ error: createdErr.message }, { status: 500 });

    // Bounties this wallet submitted to (with submission status)
    const { data: subs, error: subsErr } = await supabase
      .from("submissions")
      .select("status, bounties(*)")
      .eq("wallet_address", address)
      .order("submitted_at", { ascending: false });

    if (subsErr) return NextResponse.json({ error: subsErr.message }, { status: 500 });

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
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 503 });
  }
}
