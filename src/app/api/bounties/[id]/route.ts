import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { mapBounty, type DbBounty } from "@/lib/db-mappers";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("bounties")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
    }

    return NextResponse.json(mapBounty(data as DbBounty));
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 503 });
  }
}
