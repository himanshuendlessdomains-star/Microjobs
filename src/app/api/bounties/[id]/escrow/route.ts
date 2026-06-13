import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import {
  isContractReady,
  buildSetWinnersTx,
  buildCancelTx,
} from "@/lib/escrow-builder";

const TON_ADDRESS_RE = /^[A-Za-z0-9_-]{48}$|^-?\d+:[0-9a-fA-F]{64}$/;

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!isContractReady()) {
    return NextResponse.json({ error: "Contract not compiled yet" }, { status: 503 });
  }

  try {
    const body = (await request.json()) as {
      operation: string;
      creatorAddress: string;
      winners?: string[];
    };

    if (!body.operation || !body.creatorAddress) {
      return NextResponse.json({ error: "operation and creatorAddress are required" }, { status: 400 });
    }
    if (!TON_ADDRESS_RE.test(body.creatorAddress)) {
      return NextResponse.json({ error: "Invalid creator address" }, { status: 400 });
    }
    if (!["settle", "cancel"].includes(body.operation)) {
      return NextResponse.json({ error: "operation must be settle or cancel" }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    const { data: bounty, error } = await supabase
      .from("bounties")
      .select("creator_address, escrow_address, status")
      .eq("id", params.id)
      .single();

    if (error || !bounty) {
      return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
    }
    if (bounty.creator_address.toLowerCase() !== body.creatorAddress.toLowerCase()) {
      return NextResponse.json({ error: "Not the creator" }, { status: 403 });
    }
    if (!bounty.escrow_address) {
      return NextResponse.json({ error: "No escrow contract for this bounty" }, { status: 422 });
    }

    if (body.operation === "settle") {
      const winners = body.winners ?? [];
      if (!winners.length || winners.length > 100) {
        return NextResponse.json({ error: "1-100 winner addresses required" }, { status: 400 });
      }
      for (const w of winners) {
        if (!TON_ADDRESS_RE.test(w)) {
          return NextResponse.json({ error: `Invalid winner address: ${w.slice(0, 12)}…` }, { status: 400 });
        }
      }
      const tx = buildSetWinnersTx(winners);
      return NextResponse.json({
        escrowAddress: bounty.escrow_address,
        payloadBoc: tx.payloadBoc,
        gasNanotons: tx.gasNanotons,
      });
    }

    // cancel
    const tx = buildCancelTx();
    return NextResponse.json({
      escrowAddress: bounty.escrow_address,
      payloadBoc: tx.payloadBoc,
      gasNanotons: tx.gasNanotons,
    });
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
