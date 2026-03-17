import { Router } from "express";
import { supabase } from "../supabase";

const router = Router();

router.get("/", async (_req, res) => {
  let dbOk = false;
  try {
    const { error } = await supabase.from("protocol_epochs").select("id").limit(1);
    dbOk = !error;
  } catch {}

  res.json({
    status:      dbOk ? "ok" : "degraded",
    service:     "smelt-coordinator",
    version:     "0.1.0",
    timestamp:   new Date().toISOString(),
    db:          dbOk ? "connected" : "error",
    chain:       process.env.CHAIN_ID || "8453",
    settlement:  process.env.SETTLEMENT_CONTRACT_ADDRESS || "not_set",
  });
});

export default router;
