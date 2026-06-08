import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

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
      .select("creator_address, status")
      .eq("id", params.id)
      .single();

    if (!bounty) {
      return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
    }

    if (bounty.creator_address !== body.creatorAddress) {
      return NextResponse.json({ error: "Only the creator can close this bounty" }, { status: 403 });
    }

    if (bounty.status === "closed") {
      return NextResponse.json({ ok: true });
    }

    const { error } = await supabase
      .from("bounties")
      .update({ status: "closed" })
      .eq("id", params.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
