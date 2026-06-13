import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { mapNotification, type DbNotification } from "@/lib/db-mappers";

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
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("wallet_address", address)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) return NextResponse.json({ error: "Failed to load notifications" }, { status: 500 });

    return NextResponse.json((data as DbNotification[]).map(mapNotification));
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
