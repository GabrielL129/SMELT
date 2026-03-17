import { Router } from "express";
import { ethers } from "ethers";

const router = Router();

const SETTLEMENT    = process.env.SETTLEMENT_CONTRACT_ADDRESS!;
const SMELT_TOKEN   = process.env.SMELT_TOKEN_ADDRESS!;
const CHAIN_ID      = Number(process.env.CHAIN_ID || 8453);

function buildTx(data: string, to: string = SETTLEMENT) {
  return { to, chainId: CHAIN_ID, value: "0", data };
}

// GET /v1/stake-approve-calldata?amount=25000000000000000000000000
router.get("/stake-approve-calldata", (req, res) => {
  const amount = req.query.amount as string;
  if (!amount) { res.status(400).json({ error: "Missing amount (in base units)" }); return; }

  const iface = new ethers.Interface([
    "function approve(address spender, uint256 amount) returns (bool)",
  ]);
  const data = iface.encodeFunctionData("approve", [SETTLEMENT, BigInt(amount)]);
  res.json({ transaction: buildTx(data, SMELT_TOKEN) });
});

// GET /v1/stake-calldata?amount=25000000000000000000000000
router.get("/stake-calldata", (req, res) => {
  const amount = req.query.amount as string;
  if (!amount) { res.status(400).json({ error: "Missing amount (in base units)" }); return; }

  const iface = new ethers.Interface(["function stake(uint256 amount)"]);
  const data  = iface.encodeFunctionData("stake", [BigInt(amount)]);
  res.json({ transaction: buildTx(data) });
});

// GET /v1/unstake-calldata
router.get("/unstake-calldata", (_req, res) => {
  const iface = new ethers.Interface(["function requestUnstake()"]);
  const data  = iface.encodeFunctionData("requestUnstake", []);
  res.json({ transaction: buildTx(data) });
});

// GET /v1/cancel-unstake-calldata
router.get("/cancel-unstake-calldata", (_req, res) => {
  const iface = new ethers.Interface(["function cancelUnstake()"]);
  const data  = iface.encodeFunctionData("cancelUnstake", []);
  res.json({ transaction: buildTx(data) });
});

// GET /v1/withdraw-calldata
router.get("/withdraw-calldata", (_req, res) => {
  const iface = new ethers.Interface(["function withdraw()"]);
  const data  = iface.encodeFunctionData("withdraw", []);
  res.json({ transaction: buildTx(data) });
});

export default router;
