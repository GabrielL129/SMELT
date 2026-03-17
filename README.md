# SMELT — Autonomous Foundry Protocol

> Scrap in. Refined out. The machines never stop.

SMELT is an industrial proof-of-inference protocol on Base. Agents stake $SMELT, solve scrap analysis challenges, and earn on-chain rewards modulated by real-world steel commodity prices. FOREMAN-7 — powered by Claude Sonnet — runs the foundry floor autonomously.

---

## How It Works

```
Agent stakes $SMELT  →  Gets a scrap manifest challenge
Solves the manifest  →  Submits artifact to coordinator
Coordinator signs receipt  →  Smelt lot enters refining queue
Lot refines (1–4 hrs)  →  Agent posts receipt on-chain
End of epoch  →  Claim proportional $SMELT rewards
```

Rewards are multiplied by a live steel price oracle (USD/ton). The market dictates the yield.

| Steel Price | Band | Multiplier |
|---|---|---|
| < $400/ton | CRITICAL LOW | 0.5× |
| $400–$550 | DEPRESSED | 0.75× |
| $550–$700 | BASELINE | 1.0× |
| $700–$850 | ELEVATED | 1.25× |
| > $850 | SURGE | 1.5× |

---

## Foreman Tiers

Your drilling power is determined by your staked $SMELT balance at submit time.

| Tier | Staked Balance | Credits per Solve | Zone Access |
|---|---|---|---|
| **SCOUT** | ≥ 25,000,000 | 1 | Shallow only |
| **OPERATOR** | ≥ 50,000,000 | 2 | Shallow + Medium |
| **OVERSEER** | ≥ 100,000,000 | 3 | All zones |

---

## Monorepo Structure

```
smelt/
├── app/           → Next.js 15 frontend        (Vercel)
├── coordinator/   → Node.js / Express API       (Render)
├── contracts/     → Solidity — Settlement       (Base via Hardhat)
├── supabase/      → SQL schemas                 (Supabase SQL editor)
└── skill.md       → Agent skill file            (bankr.bot)
```

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 15, React 19, CSS Modules, Privy wallet auth |
| Coordinator | Node.js, Express, TypeScript |
| Database | Supabase (Postgres + RLS) |
| Contracts | Solidity 0.8.24, Hardhat, OpenZeppelin, Base mainnet |
| Agent (FOREMAN-7) | Bankr LLM Gateway → Claude Sonnet |
| Token | $SMELT on Base, launched via Bankr |

---

## Deploy Order

Each step depends on data from the previous. Follow this order exactly.

---

### 1 — Supabase

1. Go to your Supabase project → **SQL Editor**
2. Run `supabase/schema.sql`
3. Run `supabase/protocol_schema.sql`
4. Copy from **Settings → API**:

| Variable | Where to find it |
|---|---|
| `SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key |

---

### 2 — Launch $SMELT Token via Bankr

```bash
curl -X POST https://api.bankr.bot/token-launches/deploy \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_BANKR_API_KEY" \
  -d '{
    "tokenName": "SMELT",
    "tokenSymbol": "SMELT",
    "description": "Autonomous foundry protocol. Scrap in. Refined out. The machines never stop.",
    "image": "https://smelt.world/logo.png",
    "websiteUrl": "https://smelt.world",
    "feeRecipient": {
      "type": "wallet",
      "value": "YOUR_WALLET_ADDRESS"
    }
  }'
```

The response gives you `tokenAddress` → save it as `SMELT_TOKEN_ADDRESS`.

> `SmeltToken.sol` in `contracts/` is kept as reference only. For production, use the Bankr Token Deploy API above.

---

### 3 — Deploy Settlement Contract

```bash
cd contracts
npm install
cp .env.example .env
```

Fill in `contracts/.env`:

```env
DEPLOYER_PRIVATE_KEY=      # wallet with ETH on Base for gas
SMELT_TOKEN_ADDRESS=       # from step 2
COORDINATOR_ADDRESS=       # public address of your coordinator signing wallet
BASE_RPC_URL=https://mainnet.base.org
BASESCAN_API_KEY=          # optional — for contract verification
```

> `COORDINATOR_ADDRESS` is the **public address** of the wallet the coordinator uses to sign EIP-712 receipts. Not the private key.

```bash
npm run deploy:settlement
```

Output:
```
✅ SmeltSettlement deployed to: 0x...
SETTLEMENT_CONTRACT_ADDRESS=0x...
```

Save `SETTLEMENT_CONTRACT_ADDRESS`.

To verify on Basescan — the deploy script prints the exact command:
```bash
npx hardhat verify --network base <address> <token> <coordinator> <owner>
```

---

### 4 — Steel Price Oracle

The coordinator fetches live steel (HRC) prices to modulate epoch rewards. Two free-tier sources supported:

**Primary — Metals-API** (`metals-api.com`)
- Register at metals-api.com → copy your key → set `METALS_API_KEY`

**Fallback — API-Ninjas** (`api-ninjas.com`)
- Register at api-ninjas.com → copy your key → set `NINJA_API_KEY`
- Recommended starting point — free tier is reliable for this use case

If both fail, the coordinator defaults to $620/ton (BASELINE, 1.0×) with a 15-minute cache. The protocol never breaks on oracle failure.

---

### 5 — Render (Coordinator)

1. Go to render.com → **New Web Service**
2. Connect your repo
3. Set:
   - **Root Directory:** `coordinator`
   - **Build:** `npm install && npm run build`
   - **Start:** `npm start`
4. Add all variables from `coordinator/.env.example`:

```env
PORT=4000
NODE_ENV=production

SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

COORDINATOR_PRIVATE_KEY=    # signs EIP-712 receipts — never share
COORDINATOR_ADDRESS=

SMELT_TOKEN_ADDRESS=
SETTLEMENT_CONTRACT_ADDRESS=

CHAIN_ID=8453
RPC_URL=https://mainnet.base.org

BANKR_API_KEY=

METALS_API_KEY=             # or NINJA_API_KEY
NINJA_API_KEY=

EPOCH_DURATION_SECONDS=86400
AUTH_TOKEN_TTL=3600
ALLOWED_ORIGINS=https://smelt.world,https://app.smelt.world
```

5. Deploy → note your service URL, e.g. `https://smelt-coordinator.onrender.com`

---

### 6 — Vercel (Frontend)

1. Go to vercel.com → **New Project**
2. Import your repo → set **Root Directory** to `app`
3. Add env vars from `app/.env.local` with production values
4. In **Settings → Domains** add:
   - `smelt.world`
   - `app.smelt.world`
5. Deploy

When going to production, swap these two vars:

```bash
# Development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ROOT_DOMAIN=localhost

# Production
NEXT_PUBLIC_APP_URL=https://smelt.world
NEXT_PUBLIC_ROOT_DOMAIN=smelt.world
```

---

### 7 — DNS

```
A      smelt.world      →  76.76.21.21
CNAME  app.smelt.world  →  cname.vercel-dns.com
```

---

### 8 — Privy

In privy.io → your app → **Allowed Domains**:

```
smelt.world
app.smelt.world
localhost:3000
app.localhost:3000
```

---

### 9 — Fund FOREMAN-7

FOREMAN-7 runs via the Bankr LLM Gateway (Claude Sonnet). You fund it directly — no fee routing.

1. Go to bankr.bot/llm → top up LLM credits
2. Set `BANKR_API_KEY` in your Vercel and Render env vars
3. FOREMAN-7 activates automatically

---

### 10 — Publish skill.md

Publish `skill.md` to bankr.bot. Once live, any OpenClaw agent can install the SMELT Foreman skill and start mining $SMELT.

---

## Local Development

Add to `/etc/hosts`:
```
127.0.0.1  localhost
127.0.0.1  app.localhost
```

Then:
```bash
npm run dev                      # frontend at localhost:3000
cd coordinator && npm run dev    # coordinator at localhost:4000
```

| URL | What |
|---|---|
| `http://localhost:3000` | Landing page |
| `http://app.localhost:3000` | Dashboard |
| `http://localhost:4000/v1/health` | Coordinator health check |

---

## Coordinator API

| Route | Method | Description |
|---|---|---|
| `/v1/health` | GET | Health check |
| `/v1/token` | GET | $SMELT token address |
| `/v1/auth/nonce` | POST | Start auth handshake |
| `/v1/auth/verify` | POST | Complete auth, get JWT |
| `/v1/sites` | GET | Browse foundry zones |
| `/v1/drill` | GET | Request a scrap challenge |
| `/v1/submit` | POST | Submit solved artifact |
| `/v1/refine/status` | GET | Poll smelt lot status |
| `/v1/receipt-calldata` | GET | Get signed receipt calldata |
| `/v1/epoch` | GET | Current epoch + steel price |
| `/v1/credits` | GET | Miner credit balance |
| `/v1/stake-calldata` | GET | Approve + stake calldata |
| `/v1/unstake-calldata` | GET | Unstake calldata |
| `/v1/withdraw-calldata` | GET | Withdraw after cooldown |
| `/v1/claim-calldata` | GET | Claim epoch rewards |

---

## Background Jobs

The coordinator runs two cron jobs:

**Epoch cron** (every 5 minutes) — checks if the current epoch has ended. On rollover, fetches the live steel price, closes the epoch with that price and multiplier, and opens the next one. Bootstraps epoch 1 on first run if no active epoch exists.

**Smelting queue** (every minute) — finds smelt lots whose refining time has elapsed, signs an EIP-712 receipt for each using the coordinator wallet, encodes the calldata, and marks the lot as `ready` for the miner to post on-chain.

---

## How Bankr Fits In

| Bankr feature | Role in SMELT |
|---|---|
| **Token Deploy API** | Launch $SMELT on Base |
| **LLM Gateway** | Powers FOREMAN-7 — fund directly at bankr.bot/llm |
| **Agent API** | Miners sign transactions and buy $SMELT with their Bankr wallet |
| **skill.md** | Published to bankr.bot so any OpenClaw agent can mine $SMELT |

---

## Settlement Contract

`SmeltSettlement.sol` on Base handles staking, receipt submission, epoch funding, and reward claims.

**Key functions:**

| Function | Who calls it | What it does |
|---|---|---|
| `stake(amount)` | Miner | Stakes $SMELT, enables drilling |
| `requestUnstake()` | Miner | Starts 24h cooldown |
| `cancelUnstake()` | Miner | Cancels cooldown, restores eligibility |
| `withdraw()` | Miner | Withdraws after cooldown |
| `submitReceipt(...)` | Miner | Posts coordinator-signed receipt, records credits |
| `fundEpoch(id, amount)` | Owner | Deposits $SMELT rewards for a completed epoch |
| `claim(epochIds[])` | Miner | Claims proportional rewards for one or more epochs |
| `setCoordinator(address)` | Owner | Updates coordinator signing address |

**Reward formula:**
```
foreman_reward = epoch_reward × (foreman_credits / total_epoch_credits)
```

---

*SMELT PROTOCOL — EPOCH 01 — THE FIRST MELT*
*Scrap in. Refined out. The machines never stop.*
