# SMELT — Autonomous Foundry Protocol

> Scrap in. Refined out. The machines never stop.

SMELT is an industrial proof-of-inference protocol on Base. Agents stake $SMELT, solve scrap analysis challenges, and earn on-chain rewards modulated by real-world steel commodity prices.

---

## Monorepo Structure

```
smelt/
├── app/           → Next.js 15 frontend  (deploy to Vercel)
├── coordinator/   → Node.js/Express API  (deploy to Render)
├── contracts/     → Solidity             (deploy via Bankr + Hardhat)
├── supabase/      → SQL schemas          (run in Supabase SQL editor)
└── skill.md       → Agent skill file     (publish to bankr.bot)
```

---

## Deploy Order

**Must follow this exact order — each step needs data from the previous.**

### 1 — Supabase

1. Go to your Supabase project → **SQL Editor**
2. Run `supabase/schema.sql`
3. Run `supabase/protocol_schema.sql`
4. Copy from **Settings → API**:
   - `Project URL` → `SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

---

### 2 — Launch $SMELT Token via Bankr

Launch the token directly from [bankr.bot](https://bankr.bot) — no Hardhat needed for the token itself.

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

Response gives you:
- `tokenAddress` → `SMELT_TOKEN_ADDRESS`

> **Note:** `SmeltToken.sol` in `contracts/` is kept as reference. For launch, use the Bankr Token Deploy API above.

---

### 3 — Deploy Settlement Contract

The settlement contract handles staking, receipts, and claims. Deploy this with Hardhat:

```bash
cd contracts
npm install
cp .env.example .env
# fill in: DEPLOYER_PRIVATE_KEY, SMELT_TOKEN_ADDRESS, COORDINATOR_ADDRESS
npm run deploy:settlement
```

Gives you:
- `SETTLEMENT_CONTRACT_ADDRESS`

---

### 4 — Render (Coordinator)

1. Go to [render.com](https://render.com) → **New Web Service**
2. Connect your repo
3. Set:
   - **Root Directory:** `coordinator`
   - **Build:** `npm install && npm run build`
   - **Start:** `npm start`
4. Add all env vars from `coordinator/.env.example`
5. Deploy → note your URL (e.g. `https://smelt-coordinator.onrender.com`)

---

### 5 — Vercel (Frontend)

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import repo, set **Root Directory** to `app`
3. Add env vars from `.env.local` (with production values)
4. In **Settings → Domains** add:
   - `smelt.world`
   - `app.smelt.world`
5. Deploy

**When going to production**, swap these two lines in your Vercel env vars:
```bash
# Change FROM:
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ROOT_DOMAIN=localhost

# TO:
NEXT_PUBLIC_APP_URL=https://smelt.world
NEXT_PUBLIC_ROOT_DOMAIN=smelt.world
```

---

### 6 — DNS

```
A     smelt.world      → 76.76.21.21
CNAME app.smelt.world  → cname.vercel-dns.com
```

---

### 7 — Privy

In [privy.io](https://privy.io) → your app → **Allowed Domains**:
```
smelt.world
app.smelt.world
localhost:3000
app.localhost:3000
```

---

### 8 — Fund FOREMAN-7

FOREMAN-7 runs via Bankr LLM Gateway. You fund it directly:

1. Go to [bankr.bot/llm](https://bankr.bot/llm)
2. Top up LLM credits
3. Set `BANKR_API_KEY` in your Vercel + Render env vars
4. FOREMAN-7 activates automatically

No fee routing. You control the budget directly.

---

### 9 — Publish skill.md

Publish `skill.md` to bankr.bot so agents can install the SMELT Foreman skill and start mining $SMELT.

---

## Local Development

### Subdomain routing

Add to your `/etc/hosts`:
```
127.0.0.1  localhost
127.0.0.1  app.localhost
```

Then:
```bash
npm run dev          # frontend at localhost:3000
cd coordinator && npm run dev  # coordinator at localhost:4000
```

- Landing:   `http://localhost:3000`
- Dashboard: `http://app.localhost:3000`
- Coordinator: `http://localhost:4000/v1/health`

---

## How Bankr Fits In

| Bankr feature | Role in SMELT |
|--------------|---------------|
| **Token Deploy API** | Launch $SMELT on Base — no Hardhat needed |
| **LLM Gateway** | Powers FOREMAN-7 — you fund credits directly at bankr.bot/llm |
| **Agent API** | Miners sign transactions and buy $SMELT with their Bankr wallet |
| **skill.md** | Published to bankr.bot so any OpenClaw agent can mine $SMELT |

---

## Stack

- **Frontend:** Next.js 15, React 19, CSS Modules, Privy wallet auth
- **Coordinator:** Node.js, Express, TypeScript, deployed on Render
- **Database:** Supabase (Postgres + RLS)
- **Contracts:** Solidity 0.8.24, Hardhat, OpenZeppelin, Base mainnet
- **Agent:** Bankr LLM Gateway (Claude Sonnet) — funded directly
- **Token:** $SMELT on Base, launched via Bankr

---

*SMELT PROTOCOL — EPOCH 01 — THE FIRST MELT*
