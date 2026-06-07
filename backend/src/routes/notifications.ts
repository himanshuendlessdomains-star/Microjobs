import { Router } from "express";
import type { Request, Response } from "express";
import { db } from "../db/client.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// ── GET /api/notifications ───────────────────────────────────────────────────
// Auth required. Returns the caller's notifications, newest first.
router.get("/", requireAuth, async (req: Request, res: Response) => {
  const { limit = "50", offset = "0" } = req.query;

  const { data, error } = await db
    .from("notifications")
    .select("*")
    .eq("user_address", req.user!.sub)
    .order("created_at", { ascending: false })
    .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json(data);
});

// ── PUT /api/notifications/read-all ─────────────────────────────────────────
// Auth required. Mark all unread notifications as read.
router.put("/read-all", requireAuth, async (req: Request, res: Response) => {
  const { error } = await db
    .from("notifications")
    .update({ is_read: true })
    .eq("user_address", req.user!.sub)
    .eq("is_read", false);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json({ ok: true });
});

// ── PUT /api/notifications/:id/read ─────────────────────────────────────────
// Auth required. Mark a single notification as read.
router.put("/:id/read", requireAuth, async (req: Request, res: Response) => {
  const { data, error } = await db
    .from("notifications")
    .update({ is_read: true })
    .eq("id", req.params.id)
    .eq("user_address", req.user!.sub)
    .select()
    .single();

  if (error || !data) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }
  res.json(data);
});

export default router;
