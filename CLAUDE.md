# BountyHive — CLAUDE.md

This file is the source of truth for Claude Code when working in this repository.
Read it before making any changes.

---

## What This Project Is

BountyHive is a Telegram Mini App for creating and participating in on-chain bounties on the TON blockchain.
Creators fund bounties in TON, participants submit proof, and winners get paid automatically via smart contracts.
The frontend is a Next.js 14 App Router application styled with Tailwind CSS, designed to render inside a
Telegram WebView at 390x844px (iPhone 14 viewport).

---

## Tech Stack

| Layer          | Technology                                      |
| -------------- | ----------------------------------------------- |
| Frontend       | Next.js 14 (App Router), TypeScript, Tailwind   |
| Backend        | Node.js + Express (TypeScript) — not yet in repo |
| Database       | Supabase (PostgreSQL + Realtime) — not yet wired |
| Smart Contracts | Tact (compiled to FunC for TON VM) — not yet in repo |
| Token Swapping | Omniston → StonFi aggregator                   |
| Wallet         | TonConnect v2 (UI React SDK)                    |
| Hosting        | Vercel (frontend) + Render (backend)            |

---

## Project Structure

```
src/
  app/
    globals.css          Base styles, scrollbar-hide, press-scale utility
    layout.tsx           Root layout — Geist font, metadata
    page.tsx             Entry point — renders PhoneFrame + DiscoverScreen
  components/
    icons/
      index.tsx          All SVG icons: TonDiamond, ClockIcon, PeopleIcon,
                         bounty set (rocket/x/chart/code/star/trophy),
                         nav icons, HexLogo, badge icons
    layout/
      PhoneFrame.tsx     390x844 phone shell wrapper with drop shadow
      BottomNav.tsx      4-tab bottom navigation with active state
    discover/
      BountyCard.tsx     Individual bounty card — live countdown timer,
                         hot glow animation, draw/manual winner badge
      CategoryFilter.tsx Horizontal pill tabs for category filtering
      DiscoverScreen.tsx Full Discover screen — composes all sub-components
      SearchBar.tsx      Search input with live filter + clear button
  lib/
    data.ts              Seeded mock bounty data (6 bounties, all categories)
    types.ts             TypeScript types: Bounty, Category, WinnerSelection
    utils.ts             cn(), formatCountdown(), formatTON()
```

---

## Color Palette (never deviate without discussion)

| Token         | Hex       | Usage                                  |
| ------------- | --------- | -------------------------------------- |
| `#B5F23A`     | Lime      | Primary accent — CTAs, active states, TON amounts, glow |
| `#0D0E10`     | Dark BG   | App background, phone frame fill       |
| `#111317`     | Card      | Bounty card background                 |
| `#141619`     | Elevated  | Search bar, secondary surfaces         |
| `#1E2127`     | Border    | Default card and input borders         |
| `#1A1D22`     | Surface   | Buttons, icon backgrounds              |
| `#EAEAEA`     | Primary text | Headlines and card titles           |
| `#C8CDD8`     | Secondary text | Values, countdown, participants    |
| `#9CA3AF`     | Muted text | Labels, icon strokes                  |
| `#5A6070`     | Faint text | Column headers (Pool, Time Left, etc.) |
| `#F87171`     | Urgent    | Countdown color when under 1 hour      |

All colours are defined in `tailwind.config.ts` under `theme.extend.colors`.
Use Tailwind utilities where possible (`text-[#B5F23A]`, `bg-dark-card`, etc.).
For dynamic styles that Tailwind cannot express (box-shadow glow, gradients), use inline `style` props.

---

## Design Rules

**Phone viewport:** The entire UI renders inside a `390x844` `PhoneFrame` component.
All screens must respect `paddingBottom: 90` in their scroll container to clear the bottom nav.
Never add padding or margin to the body or html element — the outer background is `#070809`.

**Bottom nav:** Always fixed at the bottom of `PhoneFrame`, not the browser viewport.
Use `absolute bottom-0` inside the frame, not `fixed`.

**Scrollable areas:** Every screen has a `flex-1 overflow-y-auto scrollbar-hide` scroll container.
Do not nest scrollable containers.

**Interactive elements:** Every tappable element must have the `press-scale` CSS utility class.
This gives the 0.96 scale-on-press feedback expected in mobile UIs.

**Icons:** All icons live in `src/components/icons/index.tsx`. Do not install icon libraries.
Bounty icons are large (36px SVG in a 64px container). Nav icons are 22px. Meta icons are 14–18px.

**No hardcoded router addresses for swaps:** When STON.fi integration is added, always use
`simulateSwap()` to get the router address dynamically. Never hardcode it.

---

## Naming Conventions

- Components: PascalCase — `BountyCard`, `DiscoverScreen`
- Files: PascalCase for components, camelCase for lib files
- CSS classes: Tailwind utilities only; avoid custom class names except `scrollbar-hide` and `press-scale`
- Types: exported from `src/lib/types.ts` — import from there, never redefine locally
- Data: mock data lives in `src/lib/data.ts` — replace with API calls when backend is wired

---

## Common Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build — must pass with zero errors before any commit
npm run lint     # ESLint check
npm run start    # Start production server after build
```

The build must always pass cleanly. Never commit code that fails `npm run build`.

---

## Adding a New Screen

1. Create `src/components/{screen-name}/{ScreenName}Screen.tsx` with a `"use client"` directive.
2. Create a route at `src/app/{screen-name}/page.tsx` that wraps it in `<PhoneFrame>`.
3. Wire the relevant bottom nav tab to navigate to the new route.
4. Add any new types to `src/lib/types.ts` and any new mock data to `src/lib/data.ts`.
5. Run `npm run build` and confirm zero errors before considering the screen done.

---

## Adding a New Bounty Card Data Field

1. Add the field to the `Bounty` interface in `src/lib/types.ts`.
2. Update all entries in `src/lib/data.ts` with the new field.
3. Update `BountyCard.tsx` to render it.
4. Check that `npm run build` still passes.

---

## What Is Not Yet Built

These are planned but not present in the repo yet. Do not stub or mock them
unless explicitly asked — wait until the real implementation is ready.

- TonConnect wallet integration
- Supabase database connection (Prisma schema)
- Express backend and REST API
- Tact smart contracts (BountyFactory, EscrowContract)
- Omniston / StonFi swap integration
- Bounty detail page and proof submission flow
- Create Bounty form
- My Bounties dashboard
- Notifications screen
- Profile screen
- Telegram Mini App SDK integration (initData, theme, viewport)

---

## TON-Specific Rules (for when contracts are added)

- Contracts handle fund custody and release only — no business logic on-chain.
- Every contract must have explicit bounce handlers. A missing bounce handler means lost funds.
- Over-provision gas by 1.5x on all critical paths with explicit refund of unused gas at the end.
- Never store growing arrays or maps in contract storage.
- Validate all recipient wallet addresses before any TON transfer.
- Check that a recipient's Jetton wallet is initialized before sending Jettons (include 0.05 TON for init if not).
- All custodial signing keys must be managed via HashiCorp Vault or AWS KMS in production.
  They must never appear in `.env` files or be committed to the repository.
