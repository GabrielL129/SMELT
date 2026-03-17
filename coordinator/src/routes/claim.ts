import { Router } from "express";
import { ethers } from "ethers";
import { supabase } from "../supabase";
import { requireAuth } from "../middleware/auth";

const router = Router();

const SETTLEMENT = process.env.SETTLEMENT_CONTRACT_ADDRESS!;
const CHAIN_ID   = Number(process.env.CHAIN_ID || 8453);

// GET /v1/claim-calldata?epochs=1,2,3
router.get("/", requireAuth, async (req, res) => {
  const miner = ((req as any).miner as string).toLowerCase();
  const epochsParam = req.query.epochs as string;

  if (!epochsParam) {
    res.status(400).json({ error: "Missing epochs parameter (e.g. ?epochs=1 or ?epochs=1,2,3)" });
    return;
  }

  const epochIds = epochsParam.split(",").map(Number).filter((n) => !isNaN(n));
  if (!epochIds.length) {
    res.status(400).json({ error: "Invalid epochs format" });
    return;
  }

  // Validate epochs are funded and miner has credits
  const claimable: number[] = [];
  for (const eid of epochIds) {
    const { data: ep } = await supabase
      .from("protocol_epochs")
      .select("funded, active")
      .eq("epoch_number", eid)
      .single();

    if (!ep || ep.active || !ep.funded) continue;

    const { data: lots } = await supabase
      .from("smelt_lots")
      .select("id")
      .eq("miner", miner)
      .eq("epoch_id", eid)
      .in("status", ["ready", "claimed"]);

    if (lots && lots.length > 0) claimable.push(eid);
  }

  if (!claimable.length) {
    res.status(400).json({
      error: "No claimable epochs found. Epochs must be ended, funded, and have your credits.",
    });
    return;
  }

  // Encode claim(epochIds[]) calldata
  const iface = new ethers.Interface([
    "function claim(uint256[] calldata epochIds)",
  ]);
  const calldata = iface.encodeFunctionData("claim", [claimable]);

  res.json({
    claimableEpochs: claimable,
    transaction: {
      to:      SETTLEMENT,
      chainId: CHAIN_ID,
      value:   "0",
      data:    calldata,
    },
  });
});

export default router;
