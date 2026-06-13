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

const VALID_CATEGORIES = ["Creative", "Social", "Analytics", "Dev"] as const;
const VALID_WINNER_SELECTIONS = ["draw", "manual"] as const;
const TON_ADDRESS_RE = /^[A-Za-z0-9_-]{48}$|^-?\d+:[0-9a-fA-F]{64}$/;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawCategory = searchParams.get("category");
  const rawSearch = searchParams.get("search");

  // Whitelist category; silently ignore unknown values
  const category =
    rawCategory && VALID_CATEGORIES.includes(rawCategory as (typeof VALID_CATEGORIES)[number])
      ? rawCategory
      : null;
  // Cap search length to prevent excessive DB load
  const search = rawSearch ? rawSearch.slice(0, 100) : null;

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
    if (error) return NextResponse.json({ error: "Failed to load bounties" }, { status: 500 });

    return NextResponse.json((data as DbBounty[]).map(mapBounty));
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
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

    // Required field presence
    if (!body.title?.trim() || !body.creatorAddress || !body.poolAmount) {
      return NextResponse.json({ error: "title, creatorAddress, and poolAmount are required" }, { status: 400 });
    }

    // Title and description length limits
    if (body.title.trim().length > 200) {
      return NextResponse.json({ error: "Title must be 200 characters or fewer" }, { status: 400 });
    }
    if ((body.description ?? "").length > 2000) {
      return NextResponse.json({ error: "Description must be 2000 characters or fewer" }, { status: 400 });
    }

    // Creator address format
    if (!TON_ADDRESS_RE.test(body.creatorAddress)) {
      return NextResponse.json({ error: "Invalid creator address format" }, { status: 400 });
    }

    // Pool amount — must be a finite positive number
    const pool = parseFloat(body.poolAmount);
    if (!Number.isFinite(pool) || pool <= 0 || pool > 1_000_000) {
      return NextResponse.json({ error: "Pool amount must be between 0 and 1,000,000 TON" }, { status: 400 });
    }

    // Winner count — positive integer, max 100
    const winnerCount = Math.round(body.winnerCount ?? 1);
    if (!Number.isInteger(winnerCount) || winnerCount < 1 || winnerCount > 100) {
      return NextResponse.json({ error: "Winner count must be between 1 and 100" }, { status: 400 });
    }

    // Duration — 1 hour to 30 days
    const durationHours = Number(body.durationHours);
    if (!Number.isFinite(durationHours) || durationHours < 1 || durationHours > 720) {
      return NextResponse.json({ error: "Duration must be between 1 and 720 hours" }, { status: 400 });
    }

    // Winner selection whitelist
    if (!VALID_WINNER_SELECTIONS.includes(body.winnerSelection as (typeof VALID_WINNER_SELECTIONS)[number])) {
      return NextResponse.json({ error: "winnerSelection must be draw or manual" }, { status: 400 });
    }

    // Category whitelist
    if (!VALID_CATEGORIES.includes(body.category as (typeof VALID_CATEGORIES)[number])) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    const deadlineAt = new Date(Date.now() + durationHours * 3600 * 1000).toISOString();
    const perWinner = pool / winnerCount;
    const icon = ICON_FOR_CATEGORY[body.category] ?? "rocket";

    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("bounties")
      .insert({
        title: body.title.trim(),
        description: (body.description ?? "").trim(),
        type: body.type ?? "task",
        category: body.category,
        pool_amount: pool,
        pool_usd: 0,
        winner_count: winnerCount,
        per_winner_amount: perWinner,
        winner_selection: body.winnerSelection,
        participants: 0,
        deadline_at: deadlineAt,
        is_hot: false,
        icon,
        creator_address: body.creatorAddress,
        creator_name: (body.creatorName ?? "Anonymous").slice(0, 100),
        status: "active",
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: "Failed to create bounty" }, { status: 500 });
    return NextResponse.json(mapBounty(data as DbBounty), { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
