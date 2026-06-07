import { Router } from "express";
import type { Request, Response } from "express";
import { verifyTonProof } from "../lib/tonProof.js";
import { signToken } from "../middleware/auth.js";
import { db } from "../db/client.js";
import type { TonProofPayload } from "../types/index.js";

const router = Router();

/**
 * POST /auth/proof
 *
 * Body: TonProofPayload (the full TonConnect wallet + proof object)
 *
 * Verifies the TonConnect Ed25519 proof, upserts the user in the database,
 * and returns a signed JWT the client should include in subsequent requests
 * as "Authorization: Bearer <token>".
 */
router.post("/proof", async (req: Request, res: Response) => {
  const body = req.body as TonProofPayload;

  if (!body?.address || !body?.proof) {
    res.status(400).json({ error: "address and proof are required" });
    return;
  }

  const isValid = verifyTonProof(body);
  if (!isValid) {
    res.status(401).json({ error: "Proof verification failed" });
    return;
  }

  // Upsert user — create on first connect, no-op on reconnect
  const { error: upsertErr } = await db
    .from("users")
    .upsert({ address: body.address }, { onConflict: "address", ignoreDuplicates: true });

  if (upsertErr) {
    console.error("upsert user:", upsertErr);
    res.status(500).json({ error: "Failed to create user record" });
    return;
  }

  const network = body.network === "-3" ? "testnet" : "mainnet";
  const token = signToken(body.address, network);

  res.json({ token, address: body.address, network });
});

export default router;
