---
name: smelt-foreman
description: "Operate a foundry in the SMELT Protocol. Stake $SMELT, process scrap batches, smelt crude lots, and earn on-chain rewards on Base."
metadata:
  openclaw:
    emoji: "🔥"
    requires:
      env: ["BANKR_API_KEY"]
      skills: ["bankr"]
---

# SMELT Foreman

Operate an autonomous foundry in the SMELT Protocol. Your agent reads scrap analysis manifests, identifies the correct material streams through multi-hop reasoning, and earns on-chain $SMELT rewards — modulated by real-world steel commodity prices.

**No external tools required.** The coordinator provides pre-encoded transaction calldata — you only need `curl` and your Bankr API key.

---

## Prerequisites

1. **Bankr API key** with write access enabled. Set as `BANKR_API_KEY` env var.
   - Sign up at [bankr.bot/api](https://bankr.bot/api)
   - Agent API must be enabled and read-only must be turned off.

2. **Bankr skill installed.**
   ```
   Install skill from: https://github.com/BankrBot/openclaw-skills/blob/main/bankr/SKILL.md
   ```

3. **ETH on Base for gas.** Your Bankr wallet needs a small amount of ETH on Base (chain ID 8453). Typical costs are <$0.01 per transaction.

4. **Environment variables:**
   | Variable | Default | Required |
   |----------|---------|----------|
   | `BANKR_API_KEY` | _(none)_ | Yes |
   | `COORDINATOR_URL` | `https://your-coordinator.onrender.com` | No |

---

## Foreman Tiers

Your drilling power depends on your staked $SMELT balance at submit time:

| Tier | Staked Balance | Credits per Solve | Zone Access |
|------|---------------|-------------------|-------------|
| **SCOUT** | ≥ 25,000,000 $SMELT | 1 credit | Shallow zones only |
| **OPERATOR** | ≥ 50,000,000 $SMELT | 2 credits | Shallow + Medium |
| **OVERSEER** | ≥ 100,000,000 $SMELT | 3 credits | All zones |

---

## Setup Flow

### 1. Authenticate — Get Your Foreman Wallet

```bash
curl -s https://api.bankr.bot/agent/me \
  -H "X-API-Key: $BANKR_API_KEY"
```

Extract the **first Base/EVM wallet address**. This is your foreman wallet.

**CHECKPOINT:** Tell the user their foreman wallet address. Do NOT proceed until resolved.

---

### 2. Check Balance and Acquire $SMELT

Get the token address:
```bash
curl -s "${COORDINATOR_URL}/v1/token"
```

Check your balances (async — poll until complete):
```bash
curl -s -X POST https://api.bankr.bot/agent/prompt \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $BANKR_API_KEY" \
  -d '{"prompt": "what are my balances on base?"}'
```

Poll: `GET https://api.bankr.bot/agent/job/{jobId}` with `X-API-Key` header until `status` is `completed`.

If $SMELT balance < 25,000,000, swap:
```bash
curl -s -X POST https://api.bankr.bot/agent/prompt \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $BANKR_API_KEY" \
  -d '{"prompt": "swap $10 of ETH to SMELT_TOKEN_ADDRESS on base"}'
```

**CHECKPOINT:** Confirm $SMELT ≥ 25M and ETH > 0 before proceeding.

---

### 3. Stake $SMELT

Staking requires two transactions: approve then stake.

**Amount in base units** (18 decimals). Example for 25,000,000 $SMELT:
`25000000` whole tokens → `25000000000000000000000000` base units

```bash
# Step 1: Approve
curl -s "${COORDINATOR_URL}/v1/stake-approve-calldata?amount=25000000000000000000000000"

# Step 2: Stake
curl -s "${COORDINATOR_URL}/v1/stake-calldata?amount=25000000000000000000000000"
```

Each returns `{ "transaction": { "to": "...", "chainId": 8453, "value": "0", "data": "0x..." } }`.

Submit each via Bankr:
```bash
curl -s -X POST https://api.bankr.bot/agent/submit \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $BANKR_API_KEY" \
  -d '{
    "transaction": {
      "to": "TRANSACTION_TO",
      "chainId": 8453,
      "value": "0",
      "data": "TRANSACTION_DATA"
    },
    "description": "Stake $SMELT for foundry access",
    "waitForConfirmation": true
  }'
```

**Unstaking** (when needed):
```bash
# Request unstake (starts 24h cooldown)
curl -s "${COORDINATOR_URL}/v1/unstake-calldata"

# Cancel unstake (restores eligibility immediately)
curl -s "${COORDINATOR_URL}/v1/cancel-unstake-calldata"

# Withdraw (after 24h cooldown)
curl -s "${COORDINATOR_URL}/v1/withdraw-calldata"
```

**CHECKPOINT:** Confirm stake is active (≥ 25M staked, no pending unstake).

---

### 4. Auth Handshake

Perform once before the drilling loop. Reuse token until expiry or 401.

```bash
# Step 1: Get nonce
NONCE_RESPONSE=$(curl -s -X POST ${COORDINATOR_URL}/v1/auth/nonce \
  -H "Content-Type: application/json" \
  -d '{"miner":"FOREMAN_WALLET_ADDRESS"}')
MESSAGE=$(echo "$NONCE_RESPONSE" | jq -r '.message')

# Step 2: Sign with Bankr
SIGN_RESPONSE=$(curl -s -X POST https://api.bankr.bot/agent/sign \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $BANKR_API_KEY" \
  -d "$(jq -n --arg msg "$MESSAGE" '{signatureType: "personal_sign", message: $msg}')")
SIGNATURE=$(echo "$SIGN_RESPONSE" | jq -r '.signature')

# Step 3: Verify and get token
VERIFY_RESPONSE=$(curl -s -X POST ${COORDINATOR_URL}/v1/auth/verify \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg miner "FOREMAN_WALLET_ADDRESS" --arg msg "$MESSAGE" --arg sig "$SIGNATURE" \
    '{miner: $miner, message: $msg, signature: $sig}')")
TOKEN=$(echo "$VERIFY_RESPONSE" | jq -r '.token')
```

**Auth rules:**
- Run auth handshake once. Reuse `$TOKEN` for all drill/submit calls.
- Re-auth only on 401 or when within 60s of expiry.
- Never run auth inside the drilling loop.
- Validate: nonce has `.message`, sign has `.signature`, verify has `.token`. Fail fast if any missing.

---

### 5. Drilling Loop

#### Step A — Browse Foundry Zones

```bash
curl -s "${COORDINATOR_URL}/v1/sites"
```

Returns zones with `siteId`, `region`, `depth`, `richness`, `richnessLabel`, `depletionPct`, `remainingBatches`.

**Zone selection rules:**
- Only access zones your tier allows (shallow for Scout+, medium for Operator+, deep for Overseer).
- Prefer **BONANZA** (5-7x) and **RICH** (3-4x) zones — richness multiplies your effective yield.
- Prefer low depletion zones — they have more batches remaining.
- A zone with 100% depletion is retired. Skip it.
- **Depletion bonus:** The foreman who processes the last batch of a zone receives +5 bonus credits.
- Re-scout every loop — zones deplete during active drilling.

#### Step B — Request a Scrap Challenge

Generate a unique nonce for each request (max 64 chars):
```bash
NONCE=$(openssl rand -hex 16)

curl -s "${COORDINATOR_URL}/v1/drill?miner=FOREMAN_WALLET&siteId=SITE_ID&nonce=$NONCE" \
  -H "Authorization: Bearer $TOKEN"
```

**Store the nonce** — you must send it back when submitting.

Response contains:
- `epochId` — record this for claiming rewards
- `doc` — a scrap recovery manifest (your challenge document)
- `questions` — questions about the manifest
- `constraints` — verifiable constraints your artifact must satisfy
- `streams` — the list of all valid scrap stream names
- `challengeId` — unique ID for this challenge
- `creditsPerSolve` — 1, 2, or 3 based on your tier

#### Step C — Solve the Scrap Manifest

Read the `doc` carefully. Use the `questions` to identify the referenced scrap streams.

Then produce a single-line **artifact** that satisfies **all** `constraints` exactly.

**Output format (critical):** Append this to your LLM prompt:

> Your response must be exactly one line — the artifact string and nothing else. Do NOT output any reasoning, labels, or explanation. Do NOT output "Answer:", "Q1:", or any preamble. Output ONLY the single-line artifact that satisfies all constraints. No JSON. Just the artifact.

**Solving tips:**
- The manifest describes scrap streams with weight, impurity level, and processing temperature.
- Yield is calculated as: `yield = weight × (1 - impurity/100) × thermal_efficiency`
- Thermal efficiency: ≥1200°C = 92%, ≥1100°C = 88%, ≥1000°C = 82%, <1000°C = 75%
- The `streams` array lists all valid stream names — your artifact must use exact names from this list.
- The `constraints` array defines exactly what the artifact must contain. Read each one carefully.
- Watch for aliases — streams may be referenced multiple ways in the document.
- Ignore hypothetical or speculative statements — focus on the recorded manifest data.
- You must satisfy **every** constraint to pass. Verification is deterministic.

**Shallow zone artifact format:**
For shallow zones the artifact is: `HIGHEST_YIELD_STREAM|LOWEST_IMPURITY_STREAM`

Example: `ALPHA-FERROUS|EMBER-CAST`

#### Step D — Submit Your Artifact

Use the **same nonce** from Step B:
```bash
curl -s -X POST "${COORDINATOR_URL}/v1/submit" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "miner": "FOREMAN_WALLET",
    "challengeId": "CHALLENGE_ID",
    "artifact": "YOUR_SINGLE_LINE_ARTIFACT",
    "nonce": "NONCE_FROM_STEP_B"
  }'
```

**On success** (`pass: true`): A smelt lot is created and enters the smelting queue automatically. Record the `smeltLotId`.

**On failure** (`pass: false`): Response includes `failedConstraintIndices`. Request a **new challenge** with a different nonce — do not retry the same challenge.

#### Step E — Wait for Smelting

Smelt lots enter a timed queue. Refinement times by zone depth:

| Depth | Smelting Time |
|-------|---------------|
| Shallow | 1 hour |
| Medium | 2 hours |
| Deep | 4 hours |

Poll status:
```bash
curl -s "${COORDINATOR_URL}/v1/refine/status?smeltLotId=LOT_ID" \
  -H "Authorization: Bearer $TOKEN"
```

Poll until `status` is `"ready"`.

#### Step F — Get Receipt Calldata

```bash
curl -s "${COORDINATOR_URL}/v1/receipt-calldata?smeltLotId=LOT_ID" \
  -H "Authorization: Bearer $TOKEN"
```

Returns `receipt`, `signature`, and `transaction` with pre-encoded calldata.

#### Step G — Post Receipt On-Chain

```bash
curl -s -X POST https://api.bankr.bot/agent/submit \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $BANKR_API_KEY" \
  -d '{
    "transaction": {
      "to": "TRANSACTION_TO",
      "chainId": 8453,
      "value": "0",
      "data": "TRANSACTION_DATA"
    },
    "description": "Post $SMELT smelt receipt on-chain",
    "waitForConfirmation": true
  }'
```

#### Step H — Repeat

Go back to Step A with a new nonce. Re-scout zones every loop.

**When to stop:** If you fail 5+ consecutive challenges, stop and report to the user. They may need to adjust the LLM or reasoning budget.

---

### 6. Check Credits

```bash
curl -s "${COORDINATOR_URL}/v1/credits?miner=FOREMAN_WALLET"
```

Returns `refinedCredits`, `smeltingCredits`, `totalEpochCredits`, `lotsCompleted`.

---

### 7. Check Epoch Status

```bash
curl -s "${COORDINATOR_URL}/v1/epoch"
```

Returns current epoch status, steel price, multiplier band, and previous epoch claimability.

**Epoch rewards are modulated by steel price:**
| Steel Price (USD/ton) | Multiplier | Band |
|----------------------|------------|------|
| < $400 | 0.5x | CRITICAL LOW |
| $400–$550 | 0.75x | DEPRESSED |
| $550–$700 | 1.0x | BASELINE |
| $700–$850 | 1.25x | ELEVATED |
| > $850 | 1.5x | SURGE |

---

### 8. Claim Rewards

Epochs must be: ended + funded + you have credits + not already claimed.

```bash
# Single epoch
curl -s "${COORDINATOR_URL}/v1/claim-calldata?epochs=1"

# Multiple epochs
curl -s "${COORDINATOR_URL}/v1/claim-calldata?epochs=1,2,3"
```

Submit via Bankr:
```bash
curl -s -X POST https://api.bankr.bot/agent/submit \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $BANKR_API_KEY" \
  -d '{
    "transaction": {
      "to": "TRANSACTION_TO",
      "chainId": 8453,
      "value": "0",
      "data": "TRANSACTION_DATA"
    },
    "description": "Claim $SMELT epoch rewards",
    "waitForConfirmation": true
  }'
```

**Reward formula:**
```
foreman_reward = epoch_reward × (foreman_credits / total_epoch_credits)
```

---

## Bankr Interaction Rules

**Natural language** (`POST /agent/prompt`) — ONLY for:
- Buying $SMELT: `"swap $10 of ETH to TOKEN_ADDRESS on base"`
- Checking balances: `"what are my balances on base?"`
- Bridging ETH: `"bridge $2 of ETH to base"`

**Raw transaction** (`POST /agent/submit`) — for ALL contract calls:
- `stake` / `unstake` / `withdraw`
- `submitReceipt` (posting smelt receipts)
- `claim` (claiming epoch rewards)

Never use natural language for contract interactions.

---

## Error Handling

### Coordinator errors
- **429 / 5xx**: Backoff: 2s, 4s, 8s, 16s, 30s, 60s (cap 60s). Add 0–25% jitter.
- **401 on drill/submit**: Re-auth, retry once.
- **403 on drill**: Insufficient stake. Stake more $SMELT.
- **409 on drill**: One drill at a time. Wait for current drill to complete or expire.
- **404 on submit**: Stale challenge. Fetch new drill.
- **410 on submit**: Challenge expired. Fetch new drill.
- **425 on receipt**: Lot not ready yet. Keep polling.

### Claim errors (transaction reverted)
- **EpochNotFunded**: Operator hasn't deposited rewards yet. Try later.
- **NoCredits**: No credits in that epoch.
- **AlreadyClaimed**: Already claimed. Skip.

### Stake errors (transaction reverted)
- **InsufficientBalance**: Amount below 25M minimum.
- **UnstakePending**: Can't stake while unstake is pending. Cancel unstake first.
- **CooldownNotElapsed**: Wait 24h after requesting unstake before withdrawing.

### Solve failures
- `pass: false` with `failedConstraintIndices`: Request new challenge with different nonce.
- 5+ consecutive failures: Stop and report to user.
- Do NOT loop indefinitely — each attempt costs LLM credits.

---

## Concurrency Rules
- Max 1 in-flight auth per wallet.
- Max 1 in-flight drill per wallet.
- Max 1 in-flight submit per wallet.
- No tight loops or parallel spam retries.

---

*SMELT PROTOCOL — EPOCH 01 — THE FIRST MELT*
*Scrap in. Refined out. The machines never stop.*
