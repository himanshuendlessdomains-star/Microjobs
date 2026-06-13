# BountyHive — CLAUDE.md

This file is the source of truth for Claude Code when working in this repository.
Read it before making any changes.

---

## What This Project Is

BountyHive is a full-stack web app (and future Telegram Mini App) for creating and participating in on-chain bounties on the TON blockchain. Creators fund bounties in TON, participants submit proof, and winners receive prizes automatically via TonConnect multi-message transactions. The UI works as both a responsive desktop web app and a mobile-first experience.

---

## Tech Stack

| Layer           | Technology                                               |
| --------------- | -------------------------------------------------------- |
| Frontend        | Next.js 14 (App Router), TypeScript, Tailwind CSS        |
| Backend API     | Next.js Route Handlers (src/app/api/**)                  |
| Database        | Supabase (PostgreSQL, service role key, RLS bypassed)    |
| Smart Contracts | Tact (compiled to FunC for TON VM) — not yet in repo     |
| Token Swapping  | Omniston SDK v0.8.3 → StonFi aggregator (WebSocket RPC)  |
| Wallet          | TonConnect v2 (`@tonconnect/ui-react` v2.4.4)            |
| Hosting         | Vercel (frontend)                                        |

---

## Project Structure

```
src/
  app/
    globals.css                     Base styles, scrollbar-hide, press-scale, glass utilities
    layout.tsx                      Root layout — Geist font, TonConnectUIProvider wrapper
    page.tsx                        Entry → AppLayout + DiscoverScreen
    ref/[code]/page.tsx             Referral landing — stores refCode in localStorage, redirects to /
    api/
      stats/route.ts                GET — platform escrow stats (force-dynamic, no cache)
      bounties/
        route.ts                    GET (list active, force-dynamic) + POST (create)
        [id]/route.ts               GET single bounty — includes real participant count + winner wallets
        [id]/participate/route.ts   POST — submit proof (creator-guard, duplicate-guard)
        [id]/close/route.ts         POST — close bounty, fire prize notifications
        [id]/refund/route.ts        POST — refund pool (works for both zero-participant AND expired bounties)
        [id]/submissions/
          route.ts                  GET — review data (bounty + submissions + approvedCount)
          [submissionId]/route.ts   PATCH — approve/reject with creatorAddress auth
      users/[address]/
        bounties/route.ts           GET — creator + joined bounties for wallet
        notifications/route.ts      GET — notifications for wallet
        notifications/read-all/     POST — mark all read
        stats/route.ts              GET — user stats (created, won, earned, referrals)
      referrals/
        track/route.ts              POST — record a referral (referrerCode + referredAddress)

  components/
    icons/index.tsx                 All SVG icons (no external icon library)
    layout/
      AppLayout.tsx                 Root shell — NotificationProvider + Sidebar + main + BottomNav
      Sidebar.tsx                   Desktop 240px dark sidebar — shows unread notification badge
      BottomNav.tsx                 Mobile frosted-glass bottom nav — dot driven by NotificationContext
    discover/
      DiscoverScreen.tsx            Hero dark card, platform stats bar, hot scroll, bounty grid, FAB
      BountyCard.tsx                Light card (normal) + dark glow card (hot variant)
      CategoryFilter.tsx            Horizontal pill filter tabs
      SearchBar.tsx                 Search input, dark/light prop
    bounty/
      BountyDetailScreen.tsx        Full bounty detail, creator vs participant CTA (fixed above BottomNav)
      CreatorReviewScreen.tsx       Submissions list, approve/reject, distribute prizes, refund
      ProofSubmitModal.tsx          Text / link / image proof submission
      SwapModal.tsx                 Omniston real-time quote + swap
    bounties/
      MyBountiesScreen.tsx          Participating / Created / Closed tabs + refund for expired bounties
    create/
      CreateBountyScreen.tsx        3-step wizard: details → rewards → review → launch
    notifications/
      NotificationsScreen.tsx       Today/earlier groups, per-type icons, mark-all-read, error+refresh
    profile/
      ProfileScreen.tsx             Wallet connect/disconnect, real DB stats, referral card, settings

  hooks/
    useTonWallet.ts                 friendlyAddress, rawAddress, isConnected, isMainnet
    useOmniston.ts                  Quote subscription, executeSwap, status machine

  lib/
    types.ts                        All shared TypeScript types (see Types section)
    utils.ts                        cn(), formatCountdown(), formatTON(), toFriendlyAddress(), tonToNanoton()
    api.ts                          Client-side fetch wrappers for all API routes
    db-mappers.ts                   DbBounty/DbSubmission/DbNotification → typed interfaces
    NotificationContext.tsx         React context — unread count with 30s polling, refresh() helper
    omniston.ts                     Omniston SDK wrapper, BOC conversion, TonConnect adapter
    tokens.ts                       SWAP_TOKENS array, toNanoUnits, fromNanoUnits
    supabase.ts                     getSupabaseServer() with service role key
```

---

## Layout System

**AppLayout** owns the shell. Every page.tsx wraps its screen in `<AppLayout>`.

```tsx
import { AppLayout } from "@/components/layout/AppLayout";
import { SomeScreen } from "@/components/some/SomeScreen";
export default function SomePage() {
  return <AppLayout><SomeScreen /></AppLayout>;
}
```

- Desktop (md+): 240px dark Sidebar on the left, content fills the rest.
- Mobile: Sidebar hidden, frosted-glass BottomNav (72px) fixed at bottom.
- AppLayout wraps children with `<NotificationProvider>` so all screens share unread count.
- Screen components must NOT import or render BottomNav or Sidebar — AppLayout owns them.
- Screen components must NOT use `fixed` positioning for their own nav — use `sticky top-0`.
- **CTA bars that are `fixed` on mobile must use `bottom-[72px]`** (not `bottom-0`) to appear above the BottomNav. Switching to `md:relative` handles the desktop layout.
- Content scroll containers use `pb-48` (mobile) or `pb-12` (desktop) to clear both the BottomNav and any fixed CTA bar.

---

## Color Palette

### Light theme (page surfaces)
| Token               | Hex       | Usage                              |
| ------------------- | --------- | ---------------------------------- |
| `surface-page`      | `#F2F4FA` | Page background                    |
| `surface-card`      | `#FFFFFF` | Default card background            |
| `surface-tint`      | `#EDF0FA` | Tinted card, input backgrounds     |
| `surface-border`    | `#E0E4F0` | Borders on light backgrounds       |
| `surface-hover`     | `#E8EBF8` | Hover states on light surfaces     |

### Dark theme (sidebar + hot cards)
| Token               | Hex       | Usage                              |
| ------------------- | --------- | ---------------------------------- |
| `dark-DEFAULT`      | `#0D0E12` | Sidebar background, dark card bg   |
| `dark-card`         | `#13151C` | Hot bounty card                    |
| `dark-elevated`     | `#1A1D27` | Elevated surfaces within dark      |
| `dark-border`       | `#252833` | Borders on dark backgrounds        |

### Accent (never change)
| Token               | Hex       | Usage                              |
| ------------------- | --------- | ---------------------------------- |
| `lime-DEFAULT`      | `#B5F23A` | Primary CTA, active state, amounts |
| `lime-dim`          | `#8BBD1E` | Lime text on light backgrounds     |
| `lime-border`       | `#B5F23A40` | Lime-tinted borders              |
| `lime-subtle`       | `#B5F23A15` | Lime-tinted card backgrounds     |

### Text
Use `text-slate-900`, `text-slate-700`, `text-slate-500`, `text-slate-400` on light surfaces.
Use `text-ink-primary` (#EAEAEA), `text-ink-secondary`, `text-ink-muted` on dark surfaces.

---

## Design Rules

- Every tappable element gets the `press-scale` CSS utility class (0.96 scale on press).
- White cards: `bg-white rounded-2xl border border-surface-border shadow-sm`
- Dark cards: `bg-dark-card rounded-2xl border border-dark-border`
- Tint cards: `bg-surface-tint rounded-2xl border border-surface-border`
- All SVG icons live in `src/components/icons/index.tsx`. Never install icon libraries.
- No hardcoded router addresses for swaps — always use `simulateSwap()` dynamically.
- For dynamic glow/shadow styles that Tailwind cannot express, use inline `style` props.

---

## Key Types (src/lib/types.ts)

```typescript
type BountyStatus     = "active" | "ended" | "won" | "closed"
type BountyRole       = "created" | "joined"
type WinnerSelection  = "draw" | "manual"
type NotificationType = "winner" | "deadline" | "submission" | "funded" | "refund"
type SubmissionStatus = "pending" | "approved" | "rejected"
type ProofType        = "text" | "link" | "image"

interface Bounty {
  // ...
  status: "active" | "closed"
  creatorAddress: string
  winners?: string[]       // approved wallet addresses — only present when status === "closed"
}

interface UserBounty    { ..., status: BountyStatus, role: BountyRole }
interface ReviewBounty  { ..., perWinnerAmount: string, status: BountyStatus, creatorAddress: string }
interface Submission    { ..., walletAddress: string, status: SubmissionStatus }
interface AppNotification { type: NotificationType, ... }

interface PlatformStats {
  totalEscrow: number       // TON locked in all active bounties
  totalClaimable: number    // TON in expired active bounties with no approved winners
  totalDistributed: number  // TON in closed bounties (prizes + refunds)
  bountiesClosed: number
  bountiesActive: number
}

interface UserStats {
  created: number
  won: number
  earned: string    // nanoton string — convert via formatTON()
  referrals: number
}
```

`Bounty.status` in BountyDetailScreen is always the DB value: `"active"` or `"closed"`.
`UserBounty.status` in MyBountiesScreen adds `"ended"` and `"won"` as computed UI states.
An active bounty whose deadline has passed maps to `status: "ended"` in `mapUserBounty`.

---

## TON Address + Amount Rules

All TON address conversion and nanoton arithmetic lives in `src/lib/utils.ts`.

```typescript
// Convert raw "0:hexaddr" → user-friendly "UQ..." (wallet) or "EQ..." (contract)
toFriendlyAddress(addr: string, bounceable = true): string

// Convert "2.5" TON → "2500000000" nanotons (integer math, no float errors)
tonToNanoton(ton: string): string
```

**Always** call `toFriendlyAddress(addr, false)` on wallet addresses before passing them
to `tonConnectUI.sendTransaction()`. Raw `0:hex` addresses cause wallet rejections.

**Never** use `parseFloat(amount) * 1e9` for nanoton conversion — use `tonToNanoton()`.

Omniston BOC payloads are hex-encoded strings. Use `bocToBase64()` in `omniston.ts` to
convert to standard base64 before passing to TonConnect.

**Address format in DB**: All wallet addresses are stored and compared in `0:hexaddr` raw format
(`rawAddress` from `useTonAddress(false)`). Never store or compare friendly addresses in the DB.

---

## Escrow

The current MVP escrow is a hot wallet address set via `NEXT_PUBLIC_ESCROW_ADDRESS`.
All bounty pool funds flow directly into this wallet on bounty creation.

```
Current escrow: EQAZcvomHFthXG_J8Zagq-K754zUikPj5VCYtLGtUEXOJ2k6
Explorer:       https://tonviewer.com/EQAZcvomHFthXG_J8Zagq-K754zUikPj5VCYtLGtUEXOJ2k6
```

This is a testnet hot-wallet used as an MVP escrow. The on-chain escrow address is displayed
transparently on the homepage stats bar with a link to the TON explorer. Replace
`NEXT_PUBLIC_ESCROW_ADDRESS` in `.env.local` after deploying the BountyEscrow smart contract.

---

## Bounty Lifecycle

```
active  ──► closed   (creator distributes prizes via multi-message TonConnect TX)
active  ──► closed   (creator closes early via BountyDetailScreen, then reviews)
active  ──► closed   (creator claims refund when no approved winners — /api/bounties/[id]/refund)
active  → [UI shows "ended"]   (deadline_at has passed, status still "active" in DB)
```

The DB `bounties_status_check` constraint must allow both `'active'` and `'closed'`.
If it only allows `'active'`, closing/refunding returns 422 with `needsMigration: true` and
displays the SQL to fix it. Run this once in your Supabase SQL Editor:

```sql
ALTER TABLE bounties DROP CONSTRAINT bounties_status_check;
ALTER TABLE bounties ADD CONSTRAINT bounties_status_check
  CHECK (status IN ('active', 'closed'));
```

**Refund vs Prize-Distribution distinction** is UI-only:
- `CreatorReviewScreen` tracks `refundDone` in local state.
- There is no `"refunded"` DB status — the API writes `"closed"` in both cases.
- The refund API blocks only if `approvedCount > 0`. Pending or rejected submissions do not block refund.

**"Ended" status** is purely a UI mapping in `mapUserBounty` (db-mappers.ts):
- An active bounty with `timeLeftSeconds === 0` maps to `status: "ended"` in MyBountiesScreen.
- The DB status remains `"active"` until the creator explicitly closes or refunds it.
- In BountyDetailScreen, the `seconds === 0` countdown check shows "Bounty Ended" in the CTA area.

---

## Notification System

Notifications are inserted server-side (never from the frontend):

| Event                        | API Route                        | Recipient          |
| ---------------------------- | -------------------------------- | ------------------ |
| Submission marked approved   | PATCH .../submissions/[id]       | Winner wallet      |
| Bounty closed (prizes sent)  | POST .../close                   | All approved subs  |
| Refund initiated             | POST .../refund                  | Creator wallet     |

Use `void supabase.from("notifications").insert(...)` — fire-and-forget, never block the
response on notification insertion.

**NotificationContext** (`src/lib/NotificationContext.tsx`) polls `GET /api/users/[addr]/notifications`
every 30 seconds and exposes `{ unreadCount, refresh }`. Call `refresh()` after `markAllRead()`
to clear the badge immediately. Both Sidebar (desktop) and BottomNav (mobile) consume this context.

---

## Referral System

- Referral code = the creator's raw TON wallet address (`rawAddress`).
- Referral link = `/ref/[encodedAddress]` — landing page stores the code in `localStorage` and redirects to `/`.
- On wallet connect in ProfileScreen, the stored `refCode` is sent to `POST /api/referrals/track`.
- The track endpoint inserts into the `referrals` table (unique on `referred_address`).
- `GET /api/users/[address]/stats` returns `referrals` count.

Required Supabase table (create once):
```sql
CREATE TABLE referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_address TEXT NOT NULL,
  referred_address TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referred_address)
);
```

---

## Platform Stats API

`GET /api/stats` — always force-dynamic, never cached. Returns:

```typescript
{
  totalEscrow: number      // sum of pool_amount for active bounties
  totalClaimable: number   // sum of pool_amount for expired active bounties with 0 approved winners
  totalDistributed: number // sum of pool_amount for closed bounties
  bountiesClosed: number
  bountiesActive: number
}
```

All API routes that must not be prerendered must include `export const dynamic = "force-dynamic"`.
Routes with dynamic URL params (`[id]`, `[address]`) are already treated as dynamic by Next.js.
Routes with NO dynamic params (`/api/stats`, `/api/bounties`) must opt out explicitly.

---

## API Route Conventions

- All routes use the Supabase service role key (bypasses RLS).
- Always return `NextResponse.json({ error: "..." }, { status: N })` on failure.
- Never expose raw `String(err)` — use generic messages like "Service unavailable".
- Validate required fields at the top of each handler before any DB call.
- Creator-only actions (close, refund, review) verify `creator_address === body.creatorAddress`.
- The participate route returns 403 if `creator_address === body.walletAddress`.
- Notification inserts are fire-and-forget: `void supabase.from("notifications").insert(...)`.
- JSON parse failures get `status: 400`; DB/service failures get `status: 500` or `503`.

**Input validation constants** (copy to new routes):
```typescript
const TON_ADDRESS_RE = /^[A-Za-z0-9_-]{48}$|^-?\d+:[0-9a-fA-F]{64}$/;
const VALID_CATEGORIES = ["Creative", "Social", "Analytics", "Dev"] as const;
const VALID_PROOF_TYPES = ["text", "link", "image"] as const;
```

---

## Adding a New Screen

1. Create `src/components/{name}/{Name}Screen.tsx` with `"use client"` at the top.
2. Create `src/app/{name}/page.tsx` wrapping the screen in `<AppLayout>`.
3. Wire the nav tab in `Sidebar.tsx` and `BottomNav.tsx`.
4. Add new types to `src/lib/types.ts`, new API helpers to `src/lib/api.ts`.
5. If the screen has a fixed CTA bar on mobile, use `bottom-[72px]` not `bottom-0`.
6. Run `npm run build` — zero errors required before committing.

---

## Adding a New API Route

1. Create `src/app/api/{path}/route.ts`.
2. Import `getSupabaseServer` from `@/lib/supabase`.
3. If the route has no dynamic URL segments, add `export const dynamic = "force-dynamic"`.
4. Return typed responses via `NextResponse.json`.
5. Add a fetch wrapper in `src/lib/api.ts`.
6. Confirm `npm run build` passes.

---

## Common Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build — must pass with zero errors before any commit
npm run lint     # ESLint check
npm run start    # Start production server after build
```

---

## What Is NOT Yet Built

Do not stub or mock these — wait until the real implementation is ready:

- Tact smart contracts (BountyFactory, EscrowContract) — on-chain fund custody
- Telegram Mini App SDK integration (initData validation, theme params, viewport API)
- TON HTTP API v2 transaction confirmation (verify prizes landed on-chain)
- Draw-based winner selection (currently only manual selection is implemented)
- Image proof upload (type exists, upload to storage not yet wired)
- Referral reward/incentive system (tracking exists, no on-chain reward distribution yet)

---

## What WAS Recently Built (no longer stubs)

- **Security hardening**: All API routes validate input types, lengths, and formats. Submission PATCH requires `creatorAddress` auth. No raw errors exposed.
- **NotificationContext**: 30s polling for unread count, shared across Sidebar and BottomNav badges.
- **Real DB stats**: `GET /api/users/[addr]/stats` aggregates created, won, earned, referrals from DB.
- **Referral system**: `/ref/[code]` landing page + `POST /api/referrals/track` endpoint.
- **Platform transparency stats**: `GET /api/stats` shows live escrow, claimable, distributed, closed counts. Displayed on homepage with the escrow wallet address linked to the TON explorer.
- **Real participant count**: Single bounty GET overrides the denormalized counter with the actual submission count.
- **Winner wallet display**: Closed bounties show winner wallet addresses in BountyDetailScreen.
- **Expired bounty refund**: `mapUserBounty` maps expired active bounties as "ended". MyBountiesScreen shows "Claim Refund" for these.
- **ProfileScreen**: Uses real `getUserStats`, shows referral link, functional settings buttons.

---

## TON-Specific Rules

- Contracts handle fund custody and release only — no business logic on-chain.
- Every contract must have explicit bounce handlers. A missing bounce handler means lost funds.
- Over-provision gas by 1.5x on all critical paths with explicit refund of unused gas at the end.
- Never store growing arrays or maps in contract storage.
- Validate all recipient wallet addresses before any TON transfer.
- Check that a recipient's Jetton wallet is initialized before sending Jettons (include 0.05 TON for init if not).
- All custodial signing keys must be managed via HashiCorp Vault or AWS KMS in production.
  They must never appear in `.env` files or be committed to the repository.
