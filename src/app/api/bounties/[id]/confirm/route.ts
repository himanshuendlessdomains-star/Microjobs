import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

const TON_ADDRESS_RE = /^[A-Za-z0-9_-]{48}$|^-?\d+:[0-9a-fA-F]{64}$/;

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = (await request.json()) as { creatorAddress: string };
    if (!body.creatorAddress || !TON_ADDRESS_RE.test(body.creatorAddress)) {
      return NextResponse.json({ error: "creatorAddress is required" }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    const { data: bounty, error: fetchErr } = await supabase
      .from("bounties")
      .select("creator_address, funded")
      .eq("id", params.id)
      .single();

    if (fetchErr || !bounty) {
      return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
    }

    const b = bounty as { creator_address: string; funded: boolean | null };

    if (b.creator_address.toLowerCase() !== body.creatorAddress.toLowerCase()) {
      return NextResponse.json({ error: "Not the creator" }, { status: 403 });
    }

    if (b.funded === true) {
      return NextResponse.json({ ok: true });
    }

    const { error } = await supabase
      .from("bounties")
      .update({ funded: true })
      .eq("id", params.id);

    if (error) {
      // Column may not exist yet — treat as success (backward-compat hot-wallet mode)
      if (error.code === "42703" || error.message?.includes("funded")) {
        return NextResponse.json({ ok: true });
      }
      return NextResponse.json({ error: "Failed to confirm bounty" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
