import "dotenv/config";
import express from "express";
import cors from "cors";
import { epochCron } from "./services/epochService";
import { smeltingCron } from "./services/smeltingQueue";

// Routes
import authRouter from "./routes/auth";
import tokenRouter from "./routes/token";
import sitesRouter from "./routes/sites";
import drillRouter from "./routes/drill";
import submitRouter from "./routes/submit";
import refineRouter from "./routes/refine";
import receiptRouter from "./routes/receipt";
import epochRouter from "./routes/epoch";
import creditsRouter from "./routes/credits";
import stakeRouter from "./routes/stake";
import claimRouter from "./routes/claim";
import healthRouter from "./routes/health";

const app = express();
const PORT = process.env.PORT || 4000;

// ─── Middleware ───────────────────────────────────────────
app.use(cors({
  origin: (process.env.ALLOWED_ORIGINS || "").split(","),
  credentials: true,
}));
app.use(express.json());

// Request logger
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ─── Routes ──────────────────────────────────────────────
app.use("/v1/health",          healthRouter);
app.use("/v1/token",           tokenRouter);
app.use("/v1/auth",            authRouter);
app.use("/v1/sites",           sitesRouter);
app.use("/v1/drill",           drillRouter);
app.use("/v1/submit",          submitRouter);
app.use("/v1/refine",          refineRouter);
app.use("/v1/receipt-calldata",receiptRouter);
app.use("/v1/epoch",           epochRouter);
app.use("/v1/credits",         creditsRouter);
app.use("/v1/claim-calldata",  claimRouter);
app.use("/v1",                 stakeRouter);  // stake/unstake/withdraw

// ─── Background jobs ─────────────────────────────────────
epochCron.start();
smeltingCron.start();
console.log("[SMELT] Background crons started");

// ─── Start ────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[SMELT] Coordinator running on port ${PORT}`);
  console.log(`[SMELT] Chain ID: ${process.env.CHAIN_ID}`);
  console.log(`[SMELT] Settlement: ${process.env.SETTLEMENT_CONTRACT_ADDRESS}`);
});

export default app;
