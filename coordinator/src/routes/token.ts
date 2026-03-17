// token.ts — GET /v1/token
import { Router } from "express";
const router = Router();

router.get("/", (_req, res) => {
  res.json({
    name: "SMELT",
    symbol: "SMELT",
    address: process.env.SMELT_TOKEN_ADDRESS || "0x0000000000000000000000000000000000000000",
    decimals: 18,
    totalSupply: "100000000000000000000000000000", // 100B with 18 decimals
    chain: "Base",
    chainId: Number(process.env.CHAIN_ID || 8453),
  });
});

export default router;
