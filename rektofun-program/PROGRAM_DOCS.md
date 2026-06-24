# RektoFun Solana Program — Complete Documentation

> **Program ID:** `4t5KYdKFmPw49yo6Bm1TV2ZDEi6k3Ns4eJLeNhgbVSzJ`  
> **Framework:** Anchor v1  
> **Token:** USDC (SPL Token, 6 decimals)  
> **Cluster:** Solana Devnet (USDC mint: `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [On-Chain Accounts (State)](#3-on-chain-accounts-state)
4. [Constants](#4-constants)
5. [Challenge Types](#5-challenge-types)
6. [Instructions](#6-instructions)
   - [create_challenge](#61-create_challenge)
   - [accept_challenge](#62-accept_challenge)
   - [settle_challenge](#63-settle_challenge)
   - [cancel_challenge](#64-cancel_challenge)
   - [claim_winnings](#65-claim_winnings)
7. [PDA Derivation Reference](#7-pda-derivation-reference)
8. [Status & Lifecycle](#8-status--lifecycle)
9. [Fee Model](#9-fee-model)
10. [Error Reference](#10-error-reference)
11. [Security Notes](#11-security-notes)
12. [End-to-End Flows](#12-end-to-end-flows)

---

## 1. Overview

RektoFun is a decentralised prediction-market / challenge platform on Solana. Users bet USDC on whether a crypto asset's price will be **above** or **below** a target price at a future timestamp.

There are two challenge modes:

| Mode | Description |
|------|-------------|
| **PVP** | 1-vs-1. Creator vs. exactly one opponent. |
| **TEAM** | Many-vs-many. Any number of users join either the creator's side or the opponent's side. |

All funds are held in a **USDC vault** (a token account owned by the challenge PDA) until the challenge is settled. The platform takes a **2% fee** on the total pot at settlement.

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        rektofun_program                         │
│                                                                 │
│  Instructions                                                   │
│  ├── create_challenge    → creates ChallengeAccount + vault     │
│  ├── accept_challenge    → PVP: single join / TEAM: multi-join  │
│  ├── settle_challenge    → admin/oracle resolves outcome        │
│  ├── cancel_challenge    → creator reclaims bet (Open only)     │
│  └── claim_winnings      → TEAM winners pull their share        │
│                                                                 │
│  On-chain Accounts                                              │
│  ├── CreatorCounter      → per-creator challenge ID counter     │
│  ├── ChallengeAccount    → main challenge state                 │
│  ├── Vault (TokenAccount)→ USDC escrow owned by challenge PDA   │
│  └── ClaimRecord         → TEAM: double-claim guard per winner  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. On-Chain Accounts (State)

### 3.1 `CreatorCounter`

Tracks how many challenges a creator has made. Used to derive unique challenge PDAs.

| Field | Type | Description |
|-------|------|-------------|
| `creator` | `Pubkey` | Owner wallet |
| `count` | `u64` | Number of challenges created (also the next challenge ID) |
| `bump` | `u8` | PDA bump |

**Seeds:** `["creator_counter", creator.key()]`

---

### 3.2 `ChallengeAccount`

The main account for a single challenge. Holds all state.

| Field | Type | Description |
|-------|------|-------------|
| `creator` | `Pubkey` | Wallet that created the challenge |
| `challenger` | `Pubkey` | **PVP only** — the single opponent (zero if not yet accepted) |
| `creator_team` | `Vec<Pubkey>` (max 50) | **TEAM only** — extra members on creator's side (creator is implicit) |
| `opponent_team` | `Vec<Pubkey>` (max 50) | **TEAM only** — members on the opponent's side |
| `max_team_size` | `u8` | **TEAM only** — max participants per side (0 = no limit, hard cap 50) |
| `winning_side` | `WinningSide` | Set after settlement (`None` / `CreatorTeam` / `OpponentTeam`) |
| `challenge_type` | `ChallengeType` | `Pvp` or `Team` |
| `challenge_id` | `u64` | Unique ID per creator (from `CreatorCounter`) |
| `asset` | `String` (max 10) | Asset symbol, e.g. `"BTC"`, `"SOL"` |
| `bet_amount` | `u64` | USDC micro-units per participant |
| `target_price_usd_cents` | `u64` | Target price in USD cents (e.g. $95,000 → `9_500_000`) |
| `direction` | `PredictionDirection` | `Above` or `Below` — creator's prediction |
| `expires_at` | `i64` | Unix timestamp: deadline for joining |
| `resolves_at` | `i64` | Unix timestamp: when the price is evaluated |
| `status` | `ChallengeStatus` | `Open` / `Active` / `Settled` / `Cancelled` |
| `vault_bump` | `u8` | Vault PDA bump |
| `bump` | `u8` | Challenge PDA bump |

**Seeds:** `["challenge", creator.key(), challenge_id.to_le_bytes()]`

---

### 3.3 Vault (SPL `TokenAccount`)

A USDC token account owned by the `ChallengeAccount` PDA. Holds all bets until settlement or cancellation.

**Seeds:** `["vault", challenge.key()]`

---

### 3.4 `ClaimRecord`

Created when a TEAM winner calls `claim_winnings`. Its existence on-chain is the double-claim guard — a second call will fail because `init` requires the account to not exist.

| Field | Type | Description |
|-------|------|-------------|
| `challenge` | `Pubkey` | The challenge this claim belongs to |
| `participant` | `Pubkey` | The winner who claimed |
| `amount_claimed` | `u64` | USDC micro-units paid out |
| `bump` | `u8` | PDA bump |

**Seeds:** `["claim", challenge.key(), participant.key()]`

---

## 4. Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `PLATFORM_FEE_BPS` | `200` | 2% platform fee (basis points) |
| `MIN_BET_AMOUNT` | `5_000_000` | Minimum bet: 5 USDC |
| `MIN_DURATION_SECS` | `300` | Minimum challenge duration: 5 minutes |
| `MAX_DURATION_SECS` | `604_800` | Maximum challenge duration: 7 days |
| `MAX_TEAM_SIZE` | `50` | Hard cap on participants per side (TEAM) |
| `CHALLENGE_SEED` | `b"challenge"` | PDA seed |
| `VAULT_SEED` | `b"vault"` | PDA seed |
| `COUNTER_SEED` | `b"creator_counter"` | PDA seed |
| `CLAIM_SEED` | `b"claim"` | PDA seed |

---

## 5. Challenge Types

### PVP (`ChallengeType::Pvp`)

```
Creator ──bet──► Vault
                  ▲
Challenger ──bet──┘

After settlement:
  Winner ◄── (2 × bet) − 2% fee ── Vault
  Treasury ◄── 2% fee ── Vault
```

- Only **one** opponent can join.
- The challenge flips to `Active` the moment the opponent accepts.
- Settlement pays the winner directly in the same transaction.

### TEAM (`ChallengeType::Team`)

```
Creator ──────────────────────────────► Vault
Team member A (creator side) ──bet──►  Vault
Team member B (creator side) ──bet──►  Vault
Opponent 1 ──bet──────────────────────► Vault
Opponent 2 ──bet──────────────────────► Vault
...

After settlement:
  Treasury ◄── 2% of total pot ── Vault  (paid immediately)
  Each winner calls claim_winnings:
    Winner ◄── net_pot / winning_team_size ── Vault
```

- **Any number** of users can join either side while the challenge is `Open`.
- The creator is always implicitly on the creator's side (counted in payout math).
- `creator_team` holds **extra** members who joined the creator's side.
- `opponent_team` holds all members on the opposing side.
- Status stays `Open` until settlement (or the creator locks it via a future instruction).
- Settlement records the winning side; each winner claims individually.

---

## 6. Instructions

### 6.1 `create_challenge`

**Who calls it:** The challenge creator.

**What it does:**
1. Initialises (or increments) the creator's `CreatorCounter`.
2. Creates the `ChallengeAccount` PDA.
3. Creates the USDC vault `TokenAccount` PDA.
4. Transfers `bet_amount` USDC from the creator's token account to the vault.

**Parameters (`CreateChallengeParams`):**

| Param | Type | Description |
|-------|------|-------------|
| `asset` | `String` | Asset symbol (max 10 chars) |
| `bet_amount` | `u64` | USDC micro-units per participant (min 5 USDC) |
| `target_price_usd_cents` | `u64` | Target price in USD cents |
| `direction_above` | `bool` | `true` = creator predicts ABOVE; `false` = BELOW |
| `expires_at` | `i64` | Unix timestamp: join deadline (5 min – 7 days from now) |
| `resolves_at` | `i64` | Unix timestamp: price evaluation time (≥ `expires_at`) |
| `challenge_type` | `ChallengeType` | `Pvp` or `Team` |
| `max_team_size` | `u8` | TEAM only: max per side (0 = 50, ignored for PVP) |

**Required accounts:**

| Account | Writable | Signer | Description |
|---------|----------|--------|-------------|
| `creator` | ✅ | ✅ | Challenge creator |
| `creator_counter` | ✅ | ❌ | PDA: `["creator_counter", creator]` |
| `challenge` | ✅ | ❌ | PDA: `["challenge", creator, id]` |
| `vault` | ✅ | ❌ | PDA: `["vault", challenge]` |
| `creator_usdc_account` | ✅ | ❌ | Creator's USDC token account |
| `usdc_mint` | ❌ | ❌ | USDC mint |
| `token_program` | ❌ | ❌ | SPL Token program |
| `system_program` | ❌ | ❌ | System program |

**Validations:**
- Asset length ≤ 10 characters
- `bet_amount` ≥ 5 USDC
- `expires_at` is 5 minutes to 7 days in the future
- `resolves_at` ≥ `expires_at`

---

### 6.2 `accept_challenge`

**Who calls it:** Any user who wants to join the challenge (not the creator).

**What it does (PVP):**
1. Verifies the challenge is `Open` and not expired.
2. Verifies no one has joined yet (`challenger == Pubkey::default()`).
3. Transfers `bet_amount` USDC from the challenger to the vault.
4. Sets `challenge.challenger` and flips status to `Active`.

**What it does (TEAM):**
1. Verifies the challenge is `Open` and not expired.
2. Checks the caller is not already in either team.
3. Checks the target team is not full.
4. Pushes the caller's pubkey into `creator_team` or `opponent_team`.
5. Transfers `bet_amount` USDC from the caller to the vault.
6. Status remains `Open` (more participants can still join).

**Parameters (`AcceptChallengeParams`):**

| Param | Type | Description |
|-------|------|-------------|
| `join_creator_side` | `bool` | TEAM only: `true` = join creator's side, `false` = join opponent's side. Ignored for PVP. |

**Required accounts:**

| Account | Writable | Signer | Description |
|---------|----------|--------|-------------|
| `challenger` | ✅ | ✅ | The joining participant |
| `creator` | ❌ | ❌ | Challenge creator (for PDA derivation) |
| `challenge` | ✅ | ❌ | The challenge PDA |
| `vault` | ✅ | ❌ | USDC vault |
| `challenger_usdc_account` | ✅ | ❌ | Challenger's USDC token account |
| `usdc_mint` | ❌ | ❌ | USDC mint |
| `token_program` | ❌ | ❌ | SPL Token program |
| `system_program` | ❌ | ❌ | System program |

**Validations:**
- Challenge status must be `Open`
- Caller must not be the creator
- Challenge must not have expired (`now < expires_at`)
- **PVP:** `challenger` field must be `Pubkey::default()` (no one joined yet)
- **TEAM:** Caller not already in either team; target team not full

---

### 6.3 `settle_challenge`

**Who calls it:** The admin/oracle wallet (trusted off-chain service that reads price feeds).

**What it does (PVP):**
1. Verifies `now >= resolves_at`.
2. Verifies challenge is `Active`.
3. Verifies the `challenger` account matches `challenge.challenger`.
4. Calculates: `total_pot = bet_amount × 2`, `fee = total_pot × 2%`, `winner_payout = total_pot − fee`.
5. Transfers `winner_payout` to `winner_usdc_account`.
6. Transfers `fee` to `treasury_usdc_account`.
7. Sets `status = Settled` and `winning_side`.

**What it does (TEAM):**
1. Verifies `now >= resolves_at`.
2. Verifies challenge is `Open` or `Active` (TEAM can be settled from Open).
3. Verifies `opponent_team` is non-empty (both sides must have participants).
4. Calculates: `total_participants = 1 + creator_team.len() + opponent_team.len()`, `total_pot = bet_amount × total_participants`, `fee = total_pot × 2%`.
5. Transfers `fee` to `treasury_usdc_account` immediately.
6. Sets `status = Settled` and `winning_side` (individual winners claim separately).

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `creator_wins` | `bool` | `true` = creator's side wins; `false` = opponent's side wins |

**Required accounts:**

| Account | Writable | Signer | Description |
|---------|----------|--------|-------------|
| `admin` | ✅ | ✅ | Authorised admin/oracle wallet |
| `creator` | ❌ | ❌ | Challenge creator (constraint check) |
| `challenger` | ❌ | ❌ | PVP: the challenger; TEAM: pass creator again |
| `challenge` | ✅ | ❌ | The challenge PDA |
| `vault` | ✅ | ❌ | USDC vault |
| `winner_usdc_account` | ✅ | ❌ | PVP: winner's USDC account; TEAM: pass any valid account |
| `treasury_usdc_account` | ✅ | ❌ | Platform treasury USDC account |
| `usdc_mint` | ❌ | ❌ | USDC mint |
| `token_program` | ❌ | ❌ | SPL Token program |
| `system_program` | ❌ | ❌ | System program |

---

### 6.4 `cancel_challenge`

**Who calls it:** The challenge creator.

**What it does:**
1. Verifies the caller is the creator.
2. Verifies the challenge is `Open` (cannot cancel an Active/Settled challenge).
3. Transfers `bet_amount` USDC back to the creator's token account.
4. Closes the vault token account (reclaims rent to creator).
5. Sets `status = Cancelled`.

> **Note:** For TEAM challenges, if participants have already joined and deposited, their funds are also in the vault. The current implementation only refunds the creator's initial bet. A future `cancel_team_challenge` instruction should handle refunding all participants.

**Required accounts:**

| Account | Writable | Signer | Description |
|---------|----------|--------|-------------|
| `creator` | ✅ | ✅ | Challenge creator |
| `challenge` | ✅ | ❌ | The challenge PDA |
| `vault` | ✅ | ❌ | USDC vault |
| `creator_usdc_account` | ✅ | ❌ | Creator's USDC token account (refund destination) |
| `usdc_mint` | ❌ | ❌ | USDC mint |
| `token_program` | ❌ | ❌ | SPL Token program |
| `system_program` | ❌ | ❌ | System program |

---

### 6.5 `claim_winnings`

**Who calls it:** Any participant on the winning side of a **TEAM** challenge.

**What it does:**
1. Verifies the challenge is `Settled` and is a `Team` challenge.
2. Verifies the caller is on the winning side (creator, `creator_team` member, or `opponent_team` member depending on `winning_side`).
3. Calculates payout:
   - `total_participants = 1 + creator_team.len() + opponent_team.len()`
   - `total_pot = bet_amount × total_participants`
   - `net_pot = total_pot × (10000 − 200) / 10000` (fee already deducted at settlement)
   - `winning_team_size` = size of the winning side
   - `payout = net_pot / winning_team_size`
4. Transfers `payout` USDC from vault to the participant's token account.
5. Creates a `ClaimRecord` PDA — this is the double-claim guard (a second call fails because `init` requires the account to not exist).

**Required accounts:**

| Account | Writable | Signer | Description |
|---------|----------|--------|-------------|
| `participant` | ✅ | ✅ | The winner claiming their share |
| `creator` | ❌ | ❌ | Challenge creator (for PDA derivation) |
| `challenge` | ✅ | ❌ | The challenge PDA |
| `vault` | ✅ | ❌ | USDC vault |
| `participant_usdc_account` | ✅ | ❌ | Participant's USDC token account |
| `claim_record` | ✅ | ❌ | PDA: `["claim", challenge, participant]` — created here |
| `usdc_mint` | ❌ | ❌ | USDC mint |
| `token_program` | ❌ | ❌ | SPL Token program |
| `system_program` | ❌ | ❌ | System program |

---

## 7. PDA Derivation Reference

```
CreatorCounter:
  seeds = ["creator_counter", creator_pubkey]
  program = rektofun_program::ID

ChallengeAccount:
  seeds = ["challenge", creator_pubkey, challenge_id_as_u64_le_bytes]
  program = rektofun_program::ID

Vault (TokenAccount):
  seeds = ["vault", challenge_pda_pubkey]
  program = rektofun_program::ID

ClaimRecord:
  seeds = ["claim", challenge_pda_pubkey, participant_pubkey]
  program = rektofun_program::ID
```

**TypeScript example:**
```typescript
import { PublicKey } from "@solana/web3.js";
const PROGRAM_ID = new PublicKey("4t5KYdKFmPw49yo6Bm1TV2ZDEi6k3Ns4eJLeNhgbVSzJ");

// Creator counter
const [counterPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("creator_counter"), creatorPubkey.toBuffer()],
  PROGRAM_ID
);

// Challenge (challenge_id is a u64 stored as 8-byte little-endian)
const idBuf = Buffer.alloc(8);
idBuf.writeBigUInt64LE(BigInt(challengeId));
const [challengePda] = PublicKey.findProgramAddressSync(
  [Buffer.from("challenge"), creatorPubkey.toBuffer(), idBuf],
  PROGRAM_ID
);

// Vault
const [vaultPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("vault"), challengePda.toBuffer()],
  PROGRAM_ID
);

// Claim record
const [claimPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("claim"), challengePda.toBuffer(), participantPubkey.toBuffer()],
  PROGRAM_ID
);
```

---

## 8. Status & Lifecycle

### PVP Lifecycle

```
create_challenge
      │
      ▼
   [Open] ──── cancel_challenge ──► [Cancelled]
      │
      │ accept_challenge (single opponent)
      ▼
  [Active]
      │
      │ settle_challenge (after resolves_at)
      ▼
  [Settled]
```

### TEAM Lifecycle

```
create_challenge
      │
      ▼
   [Open] ──── cancel_challenge ──► [Cancelled]
      │
      │ accept_challenge (any number of users, any side)
      │ (status stays Open)
      │
      │ settle_challenge (after resolves_at)
      ▼
  [Settled]
      │
      │ claim_winnings (each winner, individually)
      ▼
  (vault drained)
```

---

## 9. Fee Model

| Scenario | Calculation |
|----------|-------------|
| PVP | `total_pot = bet_amount × 2` |
| TEAM | `total_pot = bet_amount × (1 + creator_team.len() + opponent_team.len())` |
| Fee | `fee = total_pot × 200 / 10_000` (2%) |
| PVP winner payout | `total_pot − fee` (single payment) |
| TEAM winner payout per person | `(total_pot − fee) / winning_team_size` |

**Example — TEAM with 3 vs 2:**
- `bet_amount = 10 USDC`
- Creator's side: creator + 2 extra = 3 people
- Opponent's side: 2 people
- `total_pot = 10 × 5 = 50 USDC`
- `fee = 50 × 2% = 1 USDC` → treasury
- `net_pot = 49 USDC`
- If creator's side wins: `49 / 3 ≈ 16.33 USDC` per winner
- If opponent's side wins: `49 / 2 = 24.5 USDC` per winner

> **Note:** Integer division is used on-chain. Any dust (remainder) stays in the vault. A future `close_vault` instruction can sweep dust to the treasury.

---

## 10. Error Reference

| Error | Code | Description |
|-------|------|-------------|
| `BetTooSmall` | 6000 | Bet amount below 5 USDC minimum |
| `DurationTooShort` | 6001 | Challenge duration < 5 minutes |
| `DurationTooLong` | 6002 | Challenge duration > 7 days |
| `AlreadyAccepted` | 6003 | PVP: someone already accepted |
| `NotOpen` | 6004 | Challenge is not in Open status |
| `NotActive` | 6005 | Challenge is not in Active status |
| `NotExpired` | 6006 | `resolves_at` has not passed yet |
| `ChallengeExpired` | 6007 | `expires_at` has passed; cannot join |
| `CannotAcceptOwnChallenge` | 6008 | Creator cannot join their own challenge |
| `UnauthorizedCancel` | 6009 | Only the creator can cancel |
| `UnauthorizedSettle` | 6010 | Only the admin/oracle can settle |
| `Overflow` | 6011 | Arithmetic overflow |
| `AssetTooLong` | 6012 | Asset symbol > 10 characters |
| `InvalidResolvesAt` | 6013 | `resolves_at` < `expires_at` |
| `TeamFull` | 6014 | TEAM: `max_team_size` reached for that side |
| `AlreadyJoined` | 6015 | TEAM: caller already in a team |
| `WrongChallengeType` | 6016 | Operation not valid for this challenge type |
| `AlreadyClaimed` | 6017 | TEAM: winnings already claimed (ClaimRecord exists) |
| `NotAWinner` | 6018 | TEAM: caller is not on the winning side |
| `NotSettled` | 6019 | Challenge has not been settled yet |
| `NoWinningSide` | 6020 | TEAM: opponent_team is empty; cannot settle |

---

## 11. Security Notes

### Trust Model
- The **admin/oracle** wallet is fully trusted to call `settle_challenge` with the correct `creator_wins` value. In production, this should be replaced with a **Pyth Network** or **Switchboard** oracle CPI, or a multisig.
- The admin is also trusted to pass the correct `winner_usdc_account` for PVP settlements.

### PDA Ownership
- The vault is a token account whose **authority is the challenge PDA**. Only the program (via PDA signer seeds) can move funds out of the vault.
- No external wallet can drain the vault directly.

### Double-Claim Prevention (TEAM)
- `ClaimRecord` is created with `init` (not `init_if_needed`). If a winner calls `claim_winnings` twice, the second call fails at the account constraint level because the PDA already exists.

### Reentrancy
- Anchor's account model prevents reentrancy by design — accounts are loaded before instruction execution and written back after.

### Integer Overflow
- All arithmetic uses `checked_*` methods with explicit `RektoError::Overflow` returns.

### Dust
- Integer division in TEAM payouts may leave a small remainder in the vault. This is not a security issue but should be swept by a future admin instruction.

---

## 12. End-to-End Flows

### Flow A: PVP Challenge — Creator Wins

```
1. Creator calls create_challenge(type=Pvp, bet=10 USDC, asset="BTC", direction=Above, ...)
   → ChallengeAccount created, 10 USDC locked in vault

2. Challenger calls accept_challenge(join_creator_side=false [ignored])
   → 10 USDC added to vault (total: 20 USDC)
   → status = Active

3. [Time passes, resolves_at reached]
   BTC price is ABOVE target → creator wins

4. Admin calls settle_challenge(creator_wins=true)
   → fee = 20 × 2% = 0.4 USDC → treasury
   → winner_payout = 19.6 USDC → creator's USDC account
   → status = Settled
```

### Flow B: TEAM Challenge — Opponent Side Wins

```
1. Creator calls create_challenge(type=Team, bet=10 USDC, max_team_size=5, ...)
   → 10 USDC locked in vault

2. Alice calls accept_challenge(join_creator_side=true)
   → 10 USDC added to vault (total: 20 USDC)
   → creator_team = [Alice]

3. Bob calls accept_challenge(join_creator_side=false)
   → 10 USDC added to vault (total: 30 USDC)
   → opponent_team = [Bob]

4. Carol calls accept_challenge(join_creator_side=false)
   → 10 USDC added to vault (total: 40 USDC)
   → opponent_team = [Bob, Carol]

5. [resolves_at reached, price is BELOW target → opponent side wins]

6. Admin calls settle_challenge(creator_wins=false)
   → total_pot = 40 USDC
   → fee = 40 × 2% = 0.8 USDC → treasury (paid now)
   → net_pot = 39.2 USDC
   → winning_side = OpponentTeam
   → status = Settled

7. Bob calls claim_winnings
   → payout = 39.2 / 2 = 19.6 USDC → Bob's account
   → ClaimRecord PDA created for Bob

8. Carol calls claim_winnings
   → payout = 39.2 / 2 = 19.6 USDC → Carol's account
   → ClaimRecord PDA created for Carol

   (Creator and Alice get nothing — they were on the losing side)
```

### Flow C: Creator Cancels Before Anyone Joins

```
1. Creator calls create_challenge(...)
   → 10 USDC locked in vault, status = Open

2. Creator calls cancel_challenge
   → 10 USDC refunded to creator
   → vault token account closed (rent reclaimed)
   → status = Cancelled
```

---

*Last updated: June 2026*
