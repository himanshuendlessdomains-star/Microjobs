import { Router } from "express";
import type { Request, Response } from "express";
import { db } from "../db/client.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// ── GET /api/users/me ────────────────────────────────────────────────────────
router.get("/me", requireAuth, async (req: Request, res: Response) => {
  const { data, error } = await db
    .from("users")
    .select("*")
    .eq("address", req.user!.sub)
    .single();

  if (error || !data) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(data);
});

// ── PUT /api/users/me ────────────────────────────────────────────────────────
// Allows updating username and telegram_id.
router.put("/me", requireAuth, async (req: Request, res: Response) => {
  const { username, telegram_id } = req.body;
  const updates: Record<string, unknown> = {};

  if (username !== undefined) updates.username = username;
  if (telegram_id !== undefined) updates.telegram_id = telegram_id;

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "No updatable fields provided (username, telegram_id)" });
    return;
  }

  const { data, error } = await db
    .from("users")
    .update(updates)
    .eq("address", req.user!.sub)
    .select()
    .single();

  if (error || !data) {
    res.status(500).json({ error: error?.message ?? "Update failed" });
    return;
  }
  res.json(data);
});

// ── GET /api/users/:address ──────────────────────────────────────────────────
// Public profile view.
router.get("/:address", async (req: Request, res: Response) => {
  const { data, error } = await db
    .from("users")
    .select("address, username, created_at")
    .eq("address", req.params.address)
    .single();

  if (error || !data) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(data);
});

export default router;
