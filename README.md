# BountyHive

**Create bounties. Submit proof. Earn TON.**

BountyHive is a full-stack web application for creating and completing on-chain bounties on the TON blockchain. Creators fund a prize pool in TON, participants submit proof of work, and the creator selects winners — prizes are distributed automatically via TonConnect multi-message transactions.

---

## Features

### Discover & Explore
- Browse all active bounties with live countdown timers
- Filter by category (Creative, Social, Analytics, Dev)
- Search by title in real time
- Hot bounties surface with a lime glow card and featured placement
- Responsive grid layout: single column on mobile, 2–3 columns on desktop

### Create a Bounty
- 3-step wizard: describe the task → set the prize pool → review and launch
- Choose winner selection: Draw (random) or Manual
- Set duration (1h to 30 days) and number of winners
- Optional entry fee to gate participation
- Pool amount and per-winner split calculated automatically

### Participate
- Connect wallet via TonConnect v2
- Pay optional entry fee directly in TON or swap any token via Omniston/StonFi
- Submit proof as text, a link, or an image
- Creators cannot participate in their own bounties
- Duplicate submission prevention per wallet

### Creator Review & Prize Distribution
- Full submissions review page for every bounty you created
- Approve or reject each submission individually
- Progress bar showing X of N winner slots filled
- When all slots are filled, a prominent "Distribute" CTA appears automatically
- Multi-message TonConnect transaction sends prizes to all winners in one wallet confirmation
- Partial finalization supported (close before all slots are filled)
- Early close: creator can end the bounty before deadline from the detail page
- Winner notifications sent the moment a submission is approved

### Refund Claim
- If a bounty closes with zero submissions (no participation), the creator sees a "Claim Refund" card
- Single-tap refund request marks the bounty as closed and notifies the creator
- Blocked if any submissions have been approved (winners already selected)

### Notifications
- Real-time notification feed per wallet address
- Two-stage winner alerts: "You're a winner!" on approval, "Prize sent!" on distribution
- Refund initiated notification for creators
- Today / Earlier grouping with per-type icons
- Mark all read in one tap

### My Bounties Dashboard
- Three tabs: Participating, Created, Closed
- Live countdown on active bounties
- Status badges: Active, Won, Ended, Closed
- Direct link to Review Submissions from every created bounty card
- Closed tab count badge updates when bounties finalize

### Profile
- TonConnect wallet connect and disconnect
- Stats: TON earned, bounties joined, bounties won
- Settings panel

---

## Tech Stack

| Layer           | Technology                                               |
| --------------- | -------------------------------------------------------- |
| Frontend        | Next.js 14 (App Router), TypeScript, Tailwind CSS        |
| Backend API     | Next.js Route Handlers (11 endpoints, no separate server) |
| Database        | Supabase (PostgreSQL, service role key)                  |
| Smart Contracts | Tact / FunC for TON VM — planned, not yet deployed       |
| Token Swapping  | Omniston SDK v0.8.3 → StonFi aggregator                  |
| Wallet          | TonConnect v2 (`@tonconnect/ui-react`)                   |
| Hosting         | Vercel                                                   |

---

## Getting Started

**Prerequisites:** Node.js 18+, npm 9+, a Supabase project, a TonConnect manifest URL.

```bash
# 1. Clone and install
git clone https://github.com/your-org/bountyhive.git
cd bountyhive
npm install

# 2. Add environment variables
cp .env.example .env.local
# Fill in the values (see Environment Variables section below)

# 3. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app works as a full desktop web app and a mobile web app.

---

## Scripts

```bash
npm run dev      # Start dev server with hot reload at http://localhost:3000
npm run build    # Production build — must pass with zero errors before any PR
npm run start    # Serve the production build locally
npm run lint     # Run ESLint
```

The build must pass cleanly before any pull request is merged.

---

## Environment Variables

Create `.env.local` at the project root. Never commit this file.

```bash
# Supabase — use the service role key (bypasses RLS, server-side only)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# TonConnect — must be publicly accessible
NEXT_PUBLIC_TON_CONNECT_MANIFEST_URL=https://yourdomain.com/tonconnect-manifest.json

# Optional: escrow address for entry fee collection
NEXT_PUBLIC_ESCROW_ADDRESS=EQYourEscrowAddressHere
```

The `SUPABASE_SERVICE_ROLE_KEY` is used only in server-side API routes and must never be exposed to the browser.

---

## Database Schema (Supabase)

The application uses four tables. The `status` column on `bounties` has a check constraint — only `'active'` and `'closed'` are valid values.

```sql
bounties (
  id uuid primary key,
  title text, description text, type text, category text,
  pool_amount numeric, pool_usd numeric,
  winner_count int, per_winner_amount numeric,
  winner_selection text,   -- 'draw' | 'manual'
  participants int,
  deadline_at timestamptz,
  is_hot boolean,
  icon text,
  creator_name text, creator_address text, creator_avatar text,
  entry_fee numeric,
  status text,             -- 'active' | 'closed'  (check constraint)
  prize_tx_boc text,       -- optional: signed BOC from prize distribution TX
  created_at timestamptz
)

submissions (
  id uuid primary key,
  bounty_id uuid references bounties,
  wallet_address text,
  proof_type text,         -- 'text' | 'link' | 'image'
  content text,
  notes text,
  status text,             -- 'pending' | 'approved' | 'rejected'
  submitted_at timestamptz
)

notifications (
  id uuid primary key,
  wallet_address text,
  type text,               -- 'winner' | 'deadline' | 'submission' | 'funded' | 'refund'
  title text,
  body text,
  read boolean,
  created_at timestamptz
)

-- Optional: increment_participants RPC function
create or replace function increment_participants(bounty_id uuid)
returns void as $$
  update bounties set participants = participants + 1 where id = bounty_id;
$$ language sql;
```

---

## API Routes

| Method | Path                                               | Description                              |
| ------ | -------------------------------------------------- | ---------------------------------------- |
| GET    | `/api/bounties`                                    | List active bounties (filter/search)     |
| POST   | `/api/bounties`                                    | Create a new bounty                      |
| GET    | `/api/bounties/[id]`                               | Get single bounty by ID                  |
| POST   | `/api/bounties/[id]/participate`                   | Submit proof (creator-guard, dup-guard)  |
| POST   | `/api/bounties/[id]/close`                         | Close bounty and fire prize notifications|
| POST   | `/api/bounties/[id]/refund`                        | Refund pool when no participants         |
| GET    | `/api/bounties/[id]/submissions`                   | Get review data for creator              |
| PATCH  | `/api/bounties/[id]/submissions/[submissionId]`    | Approve or reject a submission           |
| GET    | `/api/users/[address]/bounties`                    | Get all bounties for a wallet            |
| GET    | `/api/users/[address]/notifications`               | Get notifications for a wallet           |
| POST   | `/api/users/[address]/notifications/read-all`      | Mark all notifications as read           |

---

## Project Structure

```
src/
  app/
    globals.css               Base styles (scrollbar-hide, press-scale, glass utilities)
    layout.tsx                Root layout with TonConnectUIProvider
    page.tsx                  Home — AppLayout + DiscoverScreen
    api/                      All 11 Next.js Route Handlers
  components/
    icons/index.tsx           All SVG icons (no icon library dependency)
    layout/
      AppLayout.tsx           Root shell (Sidebar + content + BottomNav)
      Sidebar.tsx             Desktop 240px dark nav sidebar
      BottomNav.tsx           Mobile frosted-glass bottom nav
    discover/                 DiscoverScreen, BountyCard, SearchBar, CategoryFilter
    bounty/                   BountyDetailScreen, CreatorReviewScreen, ProofSubmitModal, SwapModal
    bounties/                 MyBountiesScreen
    create/                   CreateBountyScreen (3-step wizard)
    notifications/            NotificationsScreen
    profile/                  ProfileScreen
  hooks/
    useTonWallet.ts           TonConnect wallet state hook
    useOmniston.ts            Swap quote subscription + execution hook
  lib/
    types.ts                  All shared TypeScript types
    utils.ts                  Helpers: cn, formatCountdown, formatTON, toFriendlyAddress, tonToNanoton
    api.ts                    Client-side API fetch wrappers
    db-mappers.ts             DB row → TypeScript interface mappers
    omniston.ts               Omniston SDK wrapper + TonConnect adapter
    tokens.ts                 Supported swap tokens
    supabase.ts               Supabase server client
```

---

## Design System

The UI uses a light editorial theme with lime green as the primary accent and a dark sidebar for desktop navigation.

### Light Surfaces
| Token          | Hex       | Role                     |
| -------------- | --------- | ------------------------ |
| `surface-page` | `#F2F4FA` | Page background          |
| `surface-card` | `#FFFFFF` | Default card             |
| `surface-tint` | `#EDF0FA` | Tinted / secondary card  |

### Accent (unchanged from v1)
| Token         | Hex       | Role                              |
| ------------- | --------- | --------------------------------- |
| `lime`        | `#B5F23A` | CTAs, active states, amounts      |
| `lime-dim`    | `#8BBD1E` | Lime text on light backgrounds    |

### Dark Surfaces
| Token          | Hex       | Role                     |
| -------------- | --------- | ------------------------ |
| `dark-DEFAULT` | `#0D0E12` | Sidebar, dark cards      |
| `dark-card`    | `#13151C` | Hot bounty cards         |

Text on light: `text-slate-900 / 700 / 500 / 400`.
Text on dark: `text-ink-primary / secondary / muted`.

---

## Roadmap

### Done
- [x] Responsive desktop + mobile layout (AppLayout, Sidebar, BottomNav)
- [x] Light editorial design theme
- [x] Discover screen with search, category filter, live countdowns, hot bounties
- [x] TonConnect v2 wallet integration (connect, disconnect, address formats)
- [x] Create Bounty 3-step wizard
- [x] Bounty detail page with full stats
- [x] Proof submission flow (text / link / image)
- [x] Entry fee payment via TonConnect
- [x] Omniston / StonFi token swap integration with real-time quotes
- [x] Creator cannot participate in own bounty
- [x] Creator early-close from detail page
- [x] Creator review page: approve / reject / undo submissions
- [x] Multi-message TonConnect prize distribution to all winners
- [x] Refund claim for bounties with zero participation
- [x] Two-stage winner notifications (selected + prizes sent)
- [x] My Bounties dashboard (Participating / Created / Closed tabs)
- [x] Notifications screen with today/earlier grouping
- [x] Profile screen
- [x] Closed bounty guard on participate button
- [x] 11 REST API endpoints (Next.js Route Handlers)
- [x] Supabase integration with service role key

### Planned
- [ ] Tact smart contracts (BountyFactory, EscrowContract) for on-chain fund custody
- [ ] Telegram Mini App SDK (initData validation, native theme, viewport)
- [ ] TON HTTP API v2 transaction confirmation after prize distribution
- [ ] Draw-based automatic winner selection
- [ ] Image proof upload to Supabase Storage
- [ ] Profile stats wired to real DB aggregates
- [ ] Vault distribution and referral system
- [ ] Smart contract security audit

---

## Contributing

1. Branch from `main` using `feature/your-feature-name`.
2. Run `npm run build` locally — the build must pass before opening a PR.
3. All shared types go in `src/lib/types.ts`. Never redefine them locally.
4. All API fetch helpers go in `src/lib/api.ts`.
5. Screen components must not render `BottomNav` or `Sidebar` — AppLayout owns them.
6. Use `toFriendlyAddress(addr, false)` for wallet addresses in TonConnect messages.
7. Use `tonToNanoton(amount)` instead of `parseFloat(amount) * 1e9`.
8. See `CLAUDE.md` for the full development guide used with Claude Code.

---

## License

MIT
