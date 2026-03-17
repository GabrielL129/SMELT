import { Router } from "express";
import { supabase } from "../supabase";
import { requireAuth } from "../middleware/auth";
import { generateChallenge } from "../challenges/generator";
import { getCurrentEpoch } from "../services/epochService";

const router = Router();

const TIER_DEPTHS: Record<string, string[]> = {
  scout:    ["shallow"],
  operator: ["shallow", "medium"],
  overseer: ["shallow", "medium", "deep"],
};

const TIER_CREDITS: Record<string, number> = {
  scout: 1, operator: 2, overseer: 3,
};

// GET /v1/drill?miner=0x...&siteId=...&nonce=...
router.get("/", requireAuth, async (req, res) => {
  const miner  = ((req as any).miner as string).toLowerCase();
  const siteId = req.query.siteId as string;
  const nonce  = req.query.nonce as string;

  if (!siteId || !nonce) {
    res.status(400).json({ error: "Missing siteId or nonce" });
    return;
  }
  if (nonce.length > 64) {
    res.status(400).json({ error: "Nonce too long (max 64 chars)" });
    return;
  }

  // Check for in-flight drill
  const { data: inflight } = await supabase
    .from("active_drills")
    .select("id")
    .eq("miner", miner)
    .eq("completed", false)
    .single();

  if (inflight) {
    res.status(409).json({ error: "One drill at a time. Complete or abandon the current drill first." });
    return;
  }

  // Load the foundry zone
  const { data: zone } = await supabase
    .from("foundry_zones")
    .select("*")
    .eq("id", siteId)
    .eq("active", true)
    .single();

  if (!zone) {
    res.status(404).json({ error: "Foundry zone not found or inactive" });
    return;
  }
  if (zone.depletion_pct >= 100) {
    res.status(410).json({ error: "Foundry zone fully depleted" });
    return;
  }

  // Get miner's stake tier
  const { data: minerProfile } = await supabase
    .from("miner_profiles")
    .select("stake_tier, staked_amount")
    .eq("wallet_address", miner)
    .single();

  const tier = minerProfile?.stake_tier || "none";

  if (tier === "none") {
    res.status(403).json({ error: "No active stake. Stake $SMELT to access drill sites." });
    return;
  }

  const allowedDepths = TIER_DEPTHS[tier] || [];
  if (!allowedDepths.includes(zone.depth)) {
    res.status(403).json({
      error: `Your rig tier (${tier.toUpperCase()}) cannot access ${zone.depth} zones`,
    });
    return;
  }

  // Get current epoch
  const epoch = await getCurrentEpoch();
  if (!epoch) {
    res.status(503).json({ error: "No active epoch. Try again shortly." });
    return;
  }

  const credits = TIER_CREDITS[tier] || 1;
  const challenge = generateChallenge(siteId, zone.depth, nonce, credits);

  // Record the active drill
  await supabase.from("active_drills").insert({
    miner,
    site_id:      siteId,
    challenge_id: challenge.challengeId,
    epoch_id:     epoch.epoch_number,
    nonce,
    depth:        zone.depth,
    credits,
    constraints:  JSON.stringify(challenge.constraints),
    completed:    false,
    expires_at:   new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min to solve
  });

  res.json({
    epochId:       epoch.epoch_number,
    challengeId:   challenge.challengeId,
    siteId,
    depth:         zone.depth,
    doc:           challenge.doc,
    questions:     challenge.questions,
    constraints:   challenge.constraints,
    streams:       challenge.streams,
    creditsPerSolve: credits,
    expiresIn:     1800,
  });
});

export default router;
