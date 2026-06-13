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
    api/
      bounties/
        route.ts                    GET (list active) + POST (create)
        [id]/route.ts               GET single bounty
        [id]/participate/route.ts   POST — submit proof (creator-guard, duplicate-guard)
        [id]/close/route.ts         POST — close bounty, fire prize notifications
        [id]/refund/route.ts        POST — refund pool when no participants
        [id]/submissions/
          route.ts                  GET — review data (bounty + submissions + approvedCount)
          [submissionId]/route.ts   PATCH — approve/reject, fires winner-selected notification
      users/[address]/
        bounties/route.ts           GET — creator + joined bounties for wallet
        notifications/route.ts      GET — notifications for wallet
        notifications/read-all/     POST — mark all read

  components/
    icons/index.tsx                 All SVG icons (no external icon library)
    layout/
      AppLayout.tsx                 Root shell — Sidebar + main + BottomNav
      Sidebar.tsx                   Desktop 240px dark sidebar with nav + Create FAB
      BottomNav.tsx                 Mobile frosted-glass bottom nav (md:hidden)
    discover/
      DiscoverScreen.tsx            Hero dark card, hot scroll, responsive bounty grid, FAB
      BountyCard.tsx                Light card (normal) + dark glow card (hot variant)
      CategoryFilter.tsx            Horizontal pill filter tabs
      SearchBar.tsx                 Search input, dark/light prop
    bounty/
      BountyDetailScreen.tsx        Full bounty detail, creator vs participant CTA, closed guard
      CreatorReviewScreen.tsx       Submissions list, approve/reject, distribute prizes, refund
      ProofSubmitModal.tsx          Text / link / image proof submission
      SwapModal.tsx                 Omniston real-time quote + swap
    bounties/
      MyBountiesScreen.tsx          Participating / Created / Closed tabs
    create/
      CreateBountyScreen.tsx        3-step wizard: details → rewards → review → launch
    notifications/
      NotificationsScreen.tsx       Today/earlier groups, per-type icons, mark-all-read
    profile/
      ProfileScreen.tsx             Wallet connect/disconnect, stats grid, settings

  hooks/
    useTonWallet.ts                 friendlyAddress, rawAddress, isConnected, isMainnet
    useOmniston.ts                  Quote subscription, executeSwap, status machine

  lib/
    types.ts                        All shared TypeScript types (see Types section)
    utils.ts                        cn(), formatCountdown(), formatTON(), toFriendlyAddress(), tonToNanoton()
    api.ts                          Client-side fetch wrappers for all API routes
    db-mappers.ts                   DbBounty/DbSubmission/DbNotification → typed interfaces
    omniston.ts                     Omniston SDK wrapper, BOC conversion, TonConnect adapter
    tokens.ts                       SWAP_TOKENS array, toNanoUnits, fromNanoUnits
    supabase.ts                     getSupabaseServer() with service role key
```

---

## Layout System

**AppLayout** replaces the old PhoneFrame. Every page.tsx wraps its screen in `<AppLayout>`.

```tsx
// All page routes follow this pattern:
import { AppLayout } from "@/components/layout/AppLayout";
import { SomeScreen } from "@/components/some/SomeScreen";
export default function SomePage() {
  return <AppLayout><SomeScreen /></AppLayout>;
}
```

- Desktop (md+): 240px dark Sidebar on the left, content fills the rest.
- Mobile: Sidebar hidden, frosted-glass BottomNav (72px) fixed at bottom.
- Screen components must NOT import or render BottomNav or Sidebar — AppLayout owns them.
- Screen components must NOT use `fixed` positioning for their own nav — use `sticky top-0` for sticky headers.
- Content scroll containers use `pb-20` (mobile) or `pb-8` (desktop) to clear the nav.

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
type BountyStatus    = "active" | "ended" | "won" | "closed"
type BountyRole      = "created" | "joined"
type WinnerSelection = "draw" | "manual"
type NotificationType = "winner" | "deadline" | "submission" | "funded" | "refund"
type SubmissionStatus = "pending" | "approved" | "rejected"
type ProofType        = "text" | "link" | "image"

interface Bounty        { ..., status: "active" | "closed", creatorAddress: string }
interface UserBounty    { ..., status: BountyStatus, role: BountyRole }
interface ReviewBounty  { ..., perWinnerAmount: string, status: BountyStatus, creatorAddress: string }
interface Submission    { ..., walletAddress: string, status: SubmissionStatus }
interface AppNotification { type: NotificationType, ... }
```

`Bounty.status` must always be mapped from the DB. BountyDetailScreen uses it to guard
the participate button — never show "Participate" when `bounty.status !== "active"`.

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

---

## Bounty Lifecycle

```
active  ──► closed   (creator distributes prizes via multi-message TonConnect TX)
active  ──► closed   (creator closes early via BountyDetailScreen, then reviews)
active  ──► closed   (creator claims refund when no participants — /api/bounties/[id]/refund)
```

The DB `bounties_status_check` constraint only allows `'active'` and `'closed'`.
Do not attempt to write any other status value to the DB.

**Refund vs Prize-Distribution distinction** is UI-only:
- `CreatorReviewScreen` tracks `refundDone` in local state.
- There is no `"refunded"` DB status — the API writes `"closed"` in both cases.

---

## Notification Rules

Notifications are inserted server-side (never from the frontend):

| Event                        | API Route                        | Recipient          |
| ---------------------------- | -------------------------------- | ------------------ |
| Submission marked approved   | PATCH .../submissions/[id]       | Winner wallet      |
| Bounty closed (prizes sent)  | POST .../close                   | All approved subs  |
| Refund initiated             | POST .../refund                  | Creator wallet     |

Use `void supabase.from("notifications").insert(...)` — fire-and-forget, never block the
response on notification insertion.

---

## API Route Conventions

- All routes use the Supabase service role key (bypasses RLS).
- Always return `NextResponse.json({ error: "..." }, { status: N })` on failure.
- Validate required fields at the top of each handler before any DB call.
- Creator-only actions (close, refund, review) verify `creator_address === body.creatorAddress`.
- The participate route returns 403 if `creator_address === body.walletAddress`.
- Notification inserts are fire-and-forget: `void supabase.from("notifications").insert(...)`.

---

## Adding a New Screen

1. Create `src/components/{name}/{Name}Screen.tsx` with `"use client"` at the top.
2. Create `src/app/{name}/page.tsx` wrapping the screen in `<AppLayout>`.
3. Wire the nav tab in `Sidebar.tsx` and `BottomNav.tsx`.
4. Add new types to `src/lib/types.ts`, new API helpers to `src/lib/api.ts`.
5. Run `npm run build` — zero errors required before committing.

---

## Adding a New API Route

1. Create `src/app/api/{path}/route.ts`.
2. Import `getSupabaseServer` from `@/lib/supabase`.
3. Return typed responses via `NextResponse.json`.
4. Add a fetch wrapper in `src/lib/api.ts`.
5. Confirm `npm run build` passes.

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
- Profile stats (TON earned, bounties count) wired to real DB aggregates
- Image proof upload (type exists, upload to storage not yet wired)
- Referral and vault distribution system

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
