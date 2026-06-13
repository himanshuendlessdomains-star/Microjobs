import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

const TON_ADDRESS_RE = /^[A-Za-z0-9_-]{48}$|^-?\d+:[0-9a-fA-F]{64}$/;

export async function POST(request: Request) {
  let body: { referredAddress: string; referrerCode: string };
  try {
    body = (await request.json()) as { referredAddress: string; referrerCode: string };
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { referredAddress, referrerCode } = body;

  if (!referredAddress || !TON_ADDRESS_RE.test(referredAddress)) {
    return NextResponse.json({ error: "Invalid referred address" }, { status: 400 });
  }
  if (!referrerCode || !TON_ADDRESS_RE.test(referrerCode)) {
    return NextResponse.json({ error: "Invalid referrer code" }, { status: 400 });
  }
  if (referredAddress === referrerCode) {
    return NextResponse.json({ error: "Cannot refer yourself" }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServer();

    const { error } = await supabase.from("referrals").insert({
      referrer_address: referrerCode,
      referred_address: referredAddress,
    });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ ok: true, duplicate: true });
      }
      if (error.code === "42P01") {
        return NextResponse.json({ error: "needsMigration" }, { status: 422 });
      }
      return NextResponse.json({ error: "Service error" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Service error" }, { status: 500 });
  }
}
