import { Router } from "express";
import { supabase } from "../supabase";

const router = Router();

// GET /v1/sites
router.get("/", async (req, res) => {
  const depth = req.query.depth as string | undefined;

  let query = supabase
    .from("foundry_zones")
    .select("*")
    .eq("active", true)
    .lt("depletion_pct", 100)
    .order("richness_multiplier", { ascending: false });

  if (depth) query = query.eq("depth", depth);

  const { data, error } = await query;

  if (error) {
    res.status(500).json({ error: "Failed to fetch sites" });
    return;
  }

  res.json({
    sites: (data || []).map((z) => ({
      siteId:          z.id,
      region:          z.region,
      name:            z.name,
      depth:           z.depth,
      challengeType:   "scrap_analysis",
      reserveEstimate: z.reserve_estimate_label,
      depletionPct:    z.depletion_pct,
      richness:        z.richness_multiplier,
      richnessLabel:   getRichnessLabel(z.richness_multiplier),
      remainingBatches:z.remaining_batches,
    })),
  });
});

function getRichnessLabel(r: number): string {
  if (r >= 5) return "BONANZA";
  if (r >= 3) return "RICH";
  if (r >= 2) return "STANDARD";
  return "DEPLETED";
}

export default router;
