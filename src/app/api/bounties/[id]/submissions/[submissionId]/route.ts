import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; submissionId: string } }
) {
  try {
    const body = (await request.json()) as { status: "approved" | "rejected" };

    if (!["approved", "rejected"].includes(body.status)) {
      return NextResponse.json({ error: "status must be approved or rejected" }, { status: 400 });
    }

    const supabase = getSupabaseServer();

    const { data: bounty } = await supabase
      .from("bounties")
      .select("winner_count")
      .eq("id", params.id)
      .single();

    if (!bounty) {
      return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
    }

    if (body.status === "approved") {
      const { count } = await supabase
        .from("submissions")
        .select("*", { count: "exact", head: true })
        .eq("bounty_id", params.id)
        .eq("status", "approved");

      if ((count ?? 0) >= (bounty as { winner_count: number }).winner_count) {
        return NextResponse.json(
          { error: `Winner limit of ${(bounty as { winner_count: number }).winner_count} already reached` },
          { status: 409 }
        );
      }
    }

    const { error } = await supabase
      .from("submissions")
      .update({ status: body.status })
      .eq("id", params.submissionId)
      .eq("bounty_id", params.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
