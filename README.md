# BountyHive

**Hire humans. Earn TON. Powered by Telegram.**

BountyHive is a Telegram Mini App for creating and completing on-chain bounties on the TON blockchain.
Creators fund bounties in TON, participants submit proof, and winners are paid automatically via smart contracts.

---

## Screenshots

> Discover screen — dark theme, live countdown timers, hot bounty glow, category filtering.

The UI renders at 390x844px to match the Telegram Mini App WebView viewport.

---

## Tech Stack

| Layer           | Technology                                        |
| --------------- | ------------------------------------------------- |
| Frontend        | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend         | Node.js + Express (TypeScript)                    |
| Database        | Supabase (PostgreSQL + Realtime)                  |
| Smart Contracts | Tact (compiled to FunC for TON VM)                |
| Token Swapping  | Omniston to StonFi aggregator                     |
| Wallet          | TonConnect v2 (UI React SDK)                      |
| Hosting         | Vercel (frontend) + Render (backend)              |

---

## Getting Started

Prerequisites: Node.js 18 or later, npm 9 or later.

```bash
# 1. Clone the repo
git clone https://github.com/your-org/bountyhive.git
cd bountyhive

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
The app renders inside a phone frame so you see exactly what Telegram users will see.

---

## Scripts

```bash
npm run dev      # Start dev server with hot reload at http://localhost:3000
npm run build    # Production build — must pass with zero errors
npm run start    # Serve the production build locally
npm run lint     # Run ESLint
```

The build must pass cleanly before any pull request is merged.

---

## Project Structure

```
src/
  app/
    globals.css          Base styles, custom utilities (scrollbar-hide, press-scale)
    layout.tsx           Root layout — Geist font, page metadata
    page.tsx             Entry — renders PhoneFrame + DiscoverScreen
  components/
    icons/
      index.tsx          All SVG icon components (no external icon library)
    layout/
      BottomNav.tsx      4-tab bottom navigation bar
      PhoneFrame.tsx     390x844 phone shell wrapper
    discover/
      BountyCard.tsx     Bounty card with live countdown timer and winner badge
      CategoryFilter.tsx Horizontal pill tab filter (All / Creative / Social / Analytics / Dev)
      DiscoverScreen.tsx Assembled Discover screen
      SearchBar.tsx      Search input with real-time filtering
  lib/
    data.ts              Mock bounty data (replace with API calls when backend is ready)
    types.ts             Shared TypeScript types
    utils.ts             cn(), formatCountdown(), formatTON()
```

---

## Design System

The UI uses a single dark theme with lime green as the primary accent.

| Token     | Hex       | Role                                      |
| --------- | --------- | ----------------------------------------- |
| Lime      | #B5F23A   | CTAs, active states, TON amounts, glows   |
| Dark BG   | #0D0E10   | App and phone frame background            |
| Card      | #111317   | Bounty card surfaces                      |
| Border    | #1E2127   | Default borders                           |
| Primary   | #EAEAEA   | Headlines and card titles                 |
| Secondary | #C8CDD8   | Values, countdowns                        |
| Muted     | #9CA3AF   | Icon strokes and labels                   |
| Faint     | #5A6070   | Column headers (Pool, Time Left, etc.)    |
| Urgent    | #F87171   | Countdown color when under 1 hour         |

All colours are defined in `tailwind.config.ts`. Use Tailwind utilities where possible
and inline `style` props only for dynamic values like glow shadows and gradients.

---

## Roadmap

### Phase 1 — Foundation (current)
- [x] Next.js project scaffolded with Tailwind CSS
- [x] Design system and color palette defined
- [x] PhoneFrame and BottomNav layout
- [x] Discover screen with search and category filtering
- [x] BountyCard with live countdown timer
- [x] Mock data layer

### Phase 2 — Wallet and Auth
- [ ] TonConnect v2 integration
- [ ] Telegram Mini App SDK (initData validation, theme, viewport)
- [ ] Supabase auth and user profiles

### Phase 3 — Core Flows
- [ ] Bounty detail page and proof submission
- [ ] Create Bounty form with TonConnect payment
- [ ] My Bounties dashboard
- [ ] Notifications screen

### Phase 4 — On-Chain
- [ ] Tact smart contracts (BountyFactory, EscrowContract)
- [ ] Express backend and Supabase wired to frontend
- [ ] TON HTTP API v2 indexer for payment confirmation
- [ ] Omniston and StonFi token swap integration

### Phase 5 — Polish and Launch
- [ ] Profile screen
- [ ] Vault distribution and referral system
- [ ] Security audit of smart contracts
- [ ] Vercel and Render deployment

---

## Environment Variables

Create a `.env.local` file at the project root for local development.
Never commit this file.

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# TonConnect
NEXT_PUBLIC_TON_CONNECT_MANIFEST_URL=https://yourdomain.com/tonconnect-manifest.json

# Telegram Bot
TELEGRAM_BOT_TOKEN=

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:4000
```

A `tonconnect-manifest.json` must be publicly accessible at your domain root before
TonConnect wallet connections will work in production.

---

## Contributing

1. Branch from `main` using the pattern `feature/your-feature-name`.
2. Run `npm run build` locally before opening a pull request. The build must pass.
3. Keep components focused: UI logic in components, data fetching in server components or hooks,
   shared types in `src/lib/types.ts`.
4. Follow the design system. Do not introduce new colours or font sizes without discussion.
5. See `CLAUDE.md` for detailed conventions used when working with Claude Code.

---

## License

MIT
