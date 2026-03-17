import { Router } from "express";
import { supabase } from "../supabase";

const router = Router();

// GET /v1/credits?miner=0x...
router.get("/", async (req, res) => {
  const miner = (req.query.miner as string)?.toLowerCase();
  if (!miner) { res.status(400).json({ error: "Missing miner address" }); return; }

  // Current epoch
  const { data: epoch } = await supabase
    .from("protocol_epochs")
    .select("epoch_number, total_credits")
    .eq("active", true)
    .single();

  // Miner's credits this epoch
  const { data: lots } = await supabase
    .from("smelt_lots")
    .select("credits, status")
    .eq("miner", miner)
    .eq("epoch_id", epoch?.epoch_number ?? 0);

  const refined  = (lots || []).filter((l) => l.status === "ready" || l.status === "claimed")
    .reduce((sum, l) => sum + l.credits, 0);
  const smelting = (lots || []).filter((l) => l.status === "smelting")
    .reduce((sum, l) => sum + l.credits, 0);
  const lotsCompleted = (lots || []).filter((l) => l.status !== "smelting").length;

  // All-time stats
  const { data: allLots } = await supabase
    .from("smelt_lots")
    .select("credits")
    .eq("miner", miner)
    .in("status", ["ready", "claimed"]);

  const totalAllTime = (allLots || []).reduce((sum, l) => sum + l.credits, 0);

  res.json({
    miner,
    epochId:          epoch?.epoch_number ?? null,
    refinedCredits:   refined,
    smeltingCredits:  smelting,
    totalEpochCredits: epoch?.total_credits ?? 0,
    lotsCompleted,
    totalCreditsAllTime: totalAllTime,
  });
});

export default router;
