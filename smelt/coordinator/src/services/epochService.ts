import cron from "node-cron";
import { supabase } from "../supabase";
import { getSteelPrice } from "./oracle";

const EPOCH_DURATION_SECONDS = Number(process.env.EPOCH_DURATION_SECONDS || 86400);

export async function getCurrentEpoch() {
  const { data, error } = await supabase
    .from("protocol_epochs")
    .select("*")
    .eq("active", true)
    .single();

  if (error || !data) return null;
  return data;
}

export async function getEpochById(epochId: number) {
  const { data } = await supabase
    .from("protocol_epochs")
    .select("*")
    .eq("epoch_number", epochId)
    .single();
  return data;
}

async function rolloverEpoch() {
  console.log("[EPOCH] Checking epoch rollover...");

  const current = await getCurrentEpoch();
  if (!current) {
    // Bootstrap first epoch
    await supabase.from("protocol_epochs").insert({
      epoch_number: 1,
      started_at: new Date().toISOString(),
      ends_at: new Date(Date.now() + EPOCH_DURATION_SECONDS * 1000).toISOString(),
      active: true,
      funded: false,
      total_credits: 0,
      reward_amount: 0,
      steel_price_usd: 620,
      steel_multiplier: 1.0,
      steel_band: "BASELINE",
    });
    console.log("[EPOCH] Bootstrapped epoch 1");
    return;
  }

  const endsAt = new Date(current.ends_at).getTime();
  if (Date.now() < endsAt) return; // Not time yet

  // Get steel price for the ending epoch
  const steel = await getSteelPrice();

  // Close current epoch
  await supabase
    .from("protocol_epochs")
    .update({
      active: false,
      steel_price_usd: steel.priceUsdPerTon,
      steel_multiplier: steel.multiplier,
      steel_band: steel.band,
    })
    .eq("id", current.id);

  // Open next epoch
  const nextNum = current.epoch_number + 1;
  await supabase.from("protocol_epochs").insert({
    epoch_number: nextNum,
    started_at: new Date().toISOString(),
    ends_at: new Date(Date.now() + EPOCH_DURATION_SECONDS * 1000).toISOString(),
    active: true,
    funded: false,
    total_credits: 0,
    reward_amount: 0,
    steel_price_usd: steel.priceUsdPerTon,
    steel_multiplier: steel.multiplier,
    steel_band: steel.band,
  });

  console.log(`[EPOCH] Rolled over to epoch ${nextNum}. Steel: $${steel.priceUsdPerTon}/ton (${steel.band} ${steel.multiplier}x)`);
}

// Run every 5 minutes to check rollover
export const epochCron = cron.schedule("*/5 * * * *", rolloverEpoch, { scheduled: false });

// Call once on startup
rolloverEpoch().catch(console.error);
