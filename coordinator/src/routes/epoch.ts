import { Router } from "express";
import { supabase } from "../supabase";
import { getSteelPrice } from "../services/oracle";

const router = Router();

// GET /v1/epoch
router.get("/", async (_req, res) => {
  const { data: current } = await supabase
    .from("protocol_epochs")
    .select("*")
    .eq("active", true)
    .single();

  const { data: prev } = await supabase
    .from("protocol_epochs")
    .select("*")
    .eq("active", false)
    .order("epoch_number", { ascending: false })
    .limit(1)
    .single();

  const steel = await getSteelPrice();

  res.json({
    epochId:               current?.epoch_number ?? null,
    startedAt:             current?.started_at ?? null,
    endsAt:                current?.ends_at ?? null,
    nextEpochStartTimestamp: current?.ends_at ? new Date(current.ends_at).getTime() : null,
    epochDurationSeconds:  Number(process.env.EPOCH_DURATION_SECONDS || 86400),
    totalCredits:          current?.total_credits ?? 0,
    rewardAmount:          current?.reward_amount ?? 0,
    funded:                current?.funded ?? false,
    prevEpochId:           prev?.epoch_number ?? null,
    prevEpochFunded:       prev?.funded ?? false,
    prevEpochReward:       prev?.reward_amount ?? 0,
    steel: {
      priceUsdPerTon: steel.priceUsdPerTon,
      multiplier:     steel.multiplier,
      band:           steel.band,
      fetchedAt:      steel.fetchedAt,
    },
  });
});

export default router;
