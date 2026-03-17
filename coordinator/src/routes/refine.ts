// refine.ts — GET /v1/refine/status
import { Router } from "express";
import { supabase } from "../supabase";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.get("/status", requireAuth, async (req, res) => {
  const lotId = req.query.crudeLotId as string || req.query.smeltLotId as string;
  if (!lotId) { res.status(400).json({ error: "Missing smeltLotId" }); return; }

  const { data: lot } = await supabase
    .from("smelt_lots")
    .select("id, status, available_at, credits, depth, epoch_id")
    .eq("id", lotId)
    .single();

  if (!lot) { res.status(404).json({ error: "Lot not found" }); return; }

  res.json({
    smeltLotId:  lot.id,
    crudeLotId:  lot.id,
    status:      lot.status,       // "smelting" | "ready" | "claimed"
    availableAt: lot.available_at,
    credits:     lot.credits,
    depth:       lot.depth,
    epochId:     lot.epoch_id,
  });
});

export default router;
