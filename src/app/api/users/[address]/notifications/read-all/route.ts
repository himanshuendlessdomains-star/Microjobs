import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

export async function POST(
  _request: Request,
  { params }: { params: { address: string } }
) {
  const address = decodeURIComponent(params.address);

  try {
    const supabase = getSupabaseServer();
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("wallet_address", address)
      .eq("read", false);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 503 });
  }
}
