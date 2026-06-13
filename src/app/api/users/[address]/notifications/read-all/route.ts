import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

const TON_ADDRESS_RE = /^[A-Za-z0-9_-]{48}$|^-?\d+:[0-9a-fA-F]{64}$/;

export async function POST(
  _request: Request,
  { params }: { params: { address: string } }
) {
  const address = decodeURIComponent(params.address);

  if (!TON_ADDRESS_RE.test(address)) {
    return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServer();
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("wallet_address", address)
      .eq("read", false);

    if (error) return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
