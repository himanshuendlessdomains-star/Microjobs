import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { mapBounty, type DbBounty } from "@/lib/db-mappers";
import type { Bounty } from "@/lib/types";

const ICON_FOR_CATEGORY: Record<string, Bounty["icon"]> = {
  Creative: "star",
  Social: "x",
  Analytics: "chart",
  Dev: "code",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search");

  try {
    const supabase = getSupabaseServer();
    let query = supabase
      .from("bounties")
      .select("*")
      .eq("status", "active")
      .order("is_hot", { ascending: false })
      .order("created_at", { ascending: false });

    if (category) query = query.eq("category", category);
    if (search) query = query.ilike("title", `%${search}%`);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json((data as DbBounty[]).map(mapBounty));
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      title: string;
      description: string;
      category: string;
      type: string;
      poolAmount: string;
      winnerCount: number;
      winnerSelection: string;
      durationHours: number;
      creatorAddress: string;
      creatorName?: string;
    };

    const pool = parseFloat(body.poolAmount);
    if (!pool || pool <= 0) {
      return NextResponse.json({ error: "Invalid pool amount" }, { status: 400 });
    }
    if (!body.title?.trim() || !body.creatorAddress) {
      return NextResponse.json({ error: "title and creatorAddress are required" }, { status: 400 });
    }

    const deadlineAt = new Date(Date.now() + body.durationHours * 3600 * 1000).toISOString();
    const perWinner = pool / (body.winnerCount || 1);
    const icon = ICON_FOR_CATEGORY[body.category] ?? "rocket";

    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("bounties")
      .insert({
        title: body.title.trim(),
        description: body.description?.trim() ?? "",
        type: body.type ?? "task",
        category: body.category,
        pool_amount: pool,
        pool_usd: 0,
        winner_count: body.winnerCount || 1,
        per_winner_amount: perWinner,
        winner_selection: body.winnerSelection ?? "draw",
        participants: 0,
        deadline_at: deadlineAt,
        is_hot: false,
        icon,
        creator_address: body.creatorAddress,
        creator_name: body.creatorName ?? "Anonymous",
        status: "active",
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(mapBounty(data as DbBounty), { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
