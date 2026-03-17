import { Router } from "express";
import { supabase } from "../supabase";
import { requireAuth } from "../middleware/auth";
import { generateChallenge, verifyArtifact } from "../challenges/generator";
import { SMELT_DELAYS } from "../services/smeltingQueue";

const router = Router();

// POST /v1/submit
router.post("/", requireAuth, async (req, res) => {
  const miner        = ((req as any).miner as string).toLowerCase();
  const { challengeId, artifact, nonce } = req.body;

  if (!challengeId || !artifact || !nonce) {
    res.status(400).json({ error: "Missing challengeId, artifact, or nonce" });
    return;
  }

  // Load active drill
  const { data: drill } = await supabase
    .from("active_drills")
    .select("*")
    .eq("miner", miner)
    .eq("challenge_id", challengeId)
    .eq("nonce", nonce)
    .eq("completed", false)
    .single();

  if (!drill) {
    res.status(404).json({ error: "Challenge not found or already completed" });
    return;
  }

  if (new Date(drill.expires_at) < new Date()) {
    await supabase.from("active_drills").update({ completed: true }).eq("id", drill.id);
    res.status(410).json({ error: "Challenge expired. Request a new drill." });
    return;
  }

  // Regenerate constraints deterministically to verify
  const challenge = generateChallenge(drill.site_id, drill.depth, nonce, drill.credits);
  const { pass, failedConstraintIndices } = verifyArtifact(artifact, challenge.constraints);

  // Mark drill as completed
  await supabase.from("active_drills").update({
    completed: true,
    passed:    pass,
    artifact,
  }).eq("id", drill.id);

  if (!pass) {
    res.json({ pass: false, failedConstraintIndices });
    return;
  }

  // Get next solve index for this miner
  const { count } = await supabase
    .from("smelt_lots")
    .select("*", { count: "exact", head: true })
    .eq("miner", miner);

  const solveIndex = (count || 0) + 1;
  const delaySeconds = SMELT_DELAYS[drill.depth] || SMELT_DELAYS.shallow;
  const availableAt = new Date(Date.now() + delaySeconds * 1000).toISOString();

  // Create smelt lot
  const { data: lot } = await supabase
    .from("smelt_lots")
    .insert({
      miner,
      site_id:      drill.site_id,
      challenge_id: challengeId,
      epoch_id:     drill.epoch_id,
      depth:        drill.depth,
      credits:      drill.credits,
      solve_index:  solveIndex,
      nonce,
      artifact,
      status:       "smelting",
      available_at: availableAt,
    })
    .select()
    .single();

  // Update zone depletion — atomic decrement
  const { data: zone } = await supabase
    .from("foundry_zones")
    .select("remaining_batches, total_batches")
    .eq("id", drill.site_id)
    .single();

  if (zone) {
    const remaining = Math.max(0, zone.remaining_batches - 1);
    const depletionPct = Math.round(((zone.total_batches - remaining) / zone.total_batches) * 100);
    const isLastBatch = remaining === 0;

    await supabase.from("foundry_zones").update({
      remaining_batches: remaining,
      depletion_pct:     depletionPct,
      active:            remaining > 0,
    }).eq("id", drill.site_id);

    // Depletion bonus — +5 credits for last batch
    if (isLastBatch && lot) {
      await supabase.from("smelt_lots").update({ credits: drill.credits + 5 }).eq("id", lot.id);
      console.log(`[SUBMIT] Depletion bonus awarded to ${miner} on zone ${drill.site_id}`);
    }
  }

  // Update epoch total credits
  await supabase.rpc("increment_epoch_credits", {
    p_epoch_number: drill.epoch_id,
    p_credits:      drill.credits,
  });

  res.json({
    pass: true,
    crudeLotId:      lot?.id,
    smeltLotId:      lot?.id,
    credits:         drill.credits,
    depth:           drill.depth,
    smeltingDelay:   delaySeconds,
    availableAt,
    solveIndex,
  });
});

export default router;
