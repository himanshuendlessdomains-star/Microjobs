import { Router } from "express";
import type { Request, Response } from "express";
import { db } from "../db/client.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// ── GET /api/bounties ────────────────────────────────────────────────────────
// Public. Supports ?category=Creative&status=active&search=poster&limit=20&offset=0
router.get("/", async (req: Request, res: Response) => {
  const { category, status = "active", search, limit = "20", offset = "0" } = req.query;

  let query = db
    .from("bounties")
    .select("*")
    .eq("status", status)
    .order("is_hot", { ascending: false })
    .order("created_at", { ascending: false })
    .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

  if (category && category !== "All") {
    query = query.eq("category", category);
  }
  if (search) {
    query = query.ilike("title", `%${search}%`);
  }

  const { data, error } = await query;
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json(data);
});

// ── GET /api/bounties/:id ────────────────────────────────────────────────────
// Public.
router.get("/:id", async (req: Request, res: Response) => {
  const { data, error } = await db
    .from("bounties")
    .select("*, participations(count)")
    .eq("id", req.params.id)
    .single();

  if (error || !data) {
    res.status(404).json({ error: "Bounty not found" });
    return;
  }
  res.json(data);
});

// ── POST /api/bounties ───────────────────────────────────────────────────────
// Auth required. Creates a new bounty.
// Smart-contract deployment happens after the creator funds the on-chain escrow;
// the tx_hash is provided by the client once the contract is deployed.
router.post("/", requireAuth, async (req: Request, res: Response) => {
  const {
    title,
    description,
    category,
    pool_amount,
    winner_count,
    winner_selection,
    deadline,
    icon,
  } = req.body;

  if (!title || !category || !pool_amount || !winner_count || !winner_selection || !deadline || !icon) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const { data, error } = await db
    .from("bounties")
    .insert({
      creator_address: req.user!.sub,
      title,
      description: description ?? null,
      category,
      pool_amount: parseFloat(pool_amount),
      winner_count: parseInt(winner_count),
      winner_selection,
      deadline,
      icon,
      status: "active",
    })
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.status(201).json(data);
});

// ── PATCH /api/bounties/:id/tx ───────────────────────────────────────────────
// Auth required. Attach the smart-contract tx hash after on-chain deployment.
router.patch("/:id/tx", requireAuth, async (req: Request, res: Response) => {
  const { tx_hash } = req.body;
  if (!tx_hash) {
    res.status(400).json({ error: "tx_hash is required" });
    return;
  }

  const { data, error } = await db
    .from("bounties")
    .update({ tx_hash })
    .eq("id", req.params.id)
    .eq("creator_address", req.user!.sub)
    .select()
    .single();

  if (error || !data) {
    res.status(404).json({ error: "Bounty not found or not owned by you" });
    return;
  }
  res.json(data);
});

// ── POST /api/bounties/:id/join ──────────────────────────────────────────────
// Auth required. Mark the caller as participating.
router.post("/:id/join", requireAuth, async (req: Request, res: Response) => {
  const { error } = await db.from("participations").insert({
    bounty_id: req.params.id,
    user_address: req.user!.sub,
    status: "submitted",
  });

  if (error) {
    if (error.code === "23505") {
      res.status(409).json({ error: "Already joined this bounty" });
    } else {
      res.status(500).json({ error: error.message });
    }
    return;
  }
  res.status(201).json({ ok: true });
});

// ── POST /api/bounties/:id/submit ────────────────────────────────────────────
// Auth required. Attach proof to an existing participation.
router.post("/:id/submit", requireAuth, async (req: Request, res: Response) => {
  const { proof_url, proof_notes } = req.body;

  if (!proof_url) {
    res.status(400).json({ error: "proof_url is required" });
    return;
  }

  const { data, error } = await db
    .from("participations")
    .update({ proof_url, proof_notes: proof_notes ?? null })
    .eq("bounty_id", req.params.id)
    .eq("user_address", req.user!.sub)
    .select()
    .single();

  if (error || !data) {
    res.status(404).json({ error: "Participation not found — join the bounty first" });
    return;
  }
  res.json(data);
});

// ── GET /api/bounties/user/me ─────────────────────────────────────────────────
// Auth required. Returns bounties the caller created and bounties they joined.
router.get("/user/me", requireAuth, async (req: Request, res: Response) => {
  const address = req.user!.sub;

  const [created, joined] = await Promise.all([
    db.from("bounties").select("*").eq("creator_address", address).order("created_at", { ascending: false }),
    db
      .from("participations")
      .select("*, bounties(*)")
      .eq("user_address", address)
      .order("submitted_at", { ascending: false }),
  ]);

  if (created.error || joined.error) {
    res.status(500).json({ error: "Failed to fetch user bounties" });
    return;
  }

  res.json({
    created: created.data,
    joined: joined.data,
  });
});

export default router;
