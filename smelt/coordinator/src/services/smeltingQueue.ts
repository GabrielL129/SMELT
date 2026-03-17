import cron from "node-cron";
import { supabase } from "../supabase";
import { signReceipt, encodeReceiptCalldata } from "./signer";

const CHAIN_ID = Number(process.env.CHAIN_ID || 8453);

// Smelting delays by zone depth (seconds)
export const SMELT_DELAYS: Record<string, number> = {
  shallow: 60 * 60,       // 1 hour
  medium:  60 * 60 * 2,   // 2 hours
  deep:    60 * 60 * 4,   // 4 hours
};

async function processSmeltingQueue() {
  // Find lots that are done smelting
  const { data: lots, error } = await supabase
    .from("smelt_lots")
    .select("*")
    .eq("status", "smelting")
    .lte("available_at", new Date().toISOString());

  if (error || !lots?.length) return;

  console.log(`[SMELTING] Processing ${lots.length} ready lots`);

  for (const lot of lots) {
    try {
      // Sign the EIP-712 receipt
      const receipt = {
        miner:       lot.miner,
        epochId:     lot.epoch_id,
        siteId:      lot.site_id,
        challengeId: lot.challenge_id,
        credits:     lot.credits,
        solveIndex:  lot.solve_index,
        nonce:       lot.nonce,
      };

      const signature = await signReceipt(receipt, CHAIN_ID);
      const calldata  = encodeReceiptCalldata(receipt, signature);

      // Mark as ready with signed receipt
      await supabase
        .from("smelt_lots")
        .update({
          status:    "ready",
          signature,
          calldata,
          ready_at:  new Date().toISOString(),
        })
        .eq("id", lot.id);

      console.log(`[SMELTING] Lot ${lot.id} ready — miner ${lot.miner}`);
    } catch (err) {
      console.error(`[SMELTING] Failed to process lot ${lot.id}:`, err);
    }
  }
}

// Run every minute
export const smeltingCron = cron.schedule("* * * * *", processSmeltingQueue, { scheduled: false });
