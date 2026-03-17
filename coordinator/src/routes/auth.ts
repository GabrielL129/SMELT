import { Router } from "express";
import { ethers } from "ethers";
import { v4 as uuid } from "uuid";
import { supabase } from "../supabase";

const router = Router();
const AUTH_TOKEN_TTL = Number(process.env.AUTH_TOKEN_TTL || 3600);

// POST /v1/auth/nonce
router.post("/nonce", async (req, res) => {
  const { miner } = req.body;

  if (!miner || !ethers.isAddress(miner)) {
    res.status(400).json({ error: "Invalid miner address" });
    return;
  }

  const nonce = uuid();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 min
  const message = `SMELT Protocol Authentication\nMiner: ${miner}\nNonce: ${nonce}\nTimestamp: ${Date.now()}`;

  await supabase.from("auth_nonces").insert({
    miner:      miner.toLowerCase(),
    nonce,
    message,
    expires_at: expiresAt,
    used:       false,
  });

  res.json({ nonce, message });
});

// POST /v1/auth/verify
router.post("/verify", async (req, res) => {
  const { miner, message, signature } = req.body;

  if (!miner || !message || !signature) {
    res.status(400).json({ error: "Missing miner, message, or signature" });
    return;
  }

  // Find the nonce
  const { data: nonceRecord } = await supabase
    .from("auth_nonces")
    .select("*")
    .eq("miner", miner.toLowerCase())
    .eq("message", message)
    .eq("used", false)
    .gte("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!nonceRecord) {
    res.status(401).json({ error: "Invalid or expired nonce" });
    return;
  }

  // Verify signature
  try {
    const recovered = ethers.verifyMessage(message, signature);
    if (recovered.toLowerCase() !== miner.toLowerCase()) {
      res.status(401).json({ error: "Signature mismatch" });
      return;
    }
  } catch {
    res.status(401).json({ error: "Invalid signature" });
    return;
  }

  // Mark nonce as used
  await supabase.from("auth_nonces").update({ used: true }).eq("id", nonceRecord.id);

  // Issue auth token
  const token = uuid() + uuid(); // 72-char token
  await supabase.from("auth_tokens").insert({
    miner:      miner.toLowerCase(),
    token,
    expires_at: new Date(Date.now() + AUTH_TOKEN_TTL * 1000).toISOString(),
  });

  // Upsert miner profile
  await supabase.from("miner_profiles").upsert({
    wallet_address: miner.toLowerCase(),
    last_seen_at: new Date().toISOString(),
  }, { onConflict: "wallet_address" });

  res.json({ token, expiresIn: AUTH_TOKEN_TTL });
});

export default router;
