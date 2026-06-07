import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { mapNotification, type DbNotification } from "@/lib/db-mappers";

export async function GET(
  _request: Request,
  { params }: { params: { address: string } }
) {
  const address = decodeURIComponent(params.address);

  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("wallet_address", address)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json((data as DbNotification[]).map(mapNotification));
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 503 });
  }
}
