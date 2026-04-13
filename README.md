# PacDash

> A unified market intelligence dashboard for [Pacifica](https://pacifica.fi) — a Solana-based perpetuals DEX. Built for the Pacifica Hackathon (Analytics & Data track).


---

## Overview

PacDash combines five analytics modules into a single dark-themed dashboard, giving Pacifica traders a complete view of market data, their portfolio performance, risk exposure, social sentiment, and funding rates — all in one place.

```
┌─────────────────────────────────────────────────────────┐
│  PacDash  Powered by Pacifica          ↻  Connect Wallet │
├──────────┬──────────────────────────────────────────────┤
│          │                                              │
│ Markets  │           Market Overview                   │
│ PnL      │   Live data from Pacifica API               │
│ Risk     │   + Elfa AI social intelligence             │
│ Whale    │                                              │
│ Funding  │                                              │
│          │                                              │
└──────────┴──────────────────────────────────────────────┘
```

---

## Features

### 🌐 Markets — Market Overview
Real-time heatmap of all Pacifica perpetual markets. Pulls live data from `/info/prices` polling every manual refresh.

- Mark price, 24h change %, open interest bar, funding rate per market
- Search markets by symbol
- Filter tabs: All / Gainers / Losers / High Funding / High OI
- Mini sparkline chart on each card built from price movement
- `🔥 HOT` badge powered by Elfa AI trending tokens data
- **Social Intelligence panel** (Elfa AI) — trending token grid with mention counts and % change, plus live token news feed

### 📈 PnL — Profit & Loss Dashboard
Personal trading performance analytics. Requires a connected Solana wallet.

- Total realized PnL, unrealized PnL, win rate, best/worst trade
- Equity over time chart (derived from cumulative trade PnL)
- Time range selector: 7D / 30D / 90D / All
- Trade history table with pagination (10 rows/page)
- Filter by side (LONG/SHORT) and symbol
- Performance panel: avg win/loss, profit factor, total fees, best/worst market
- Win/Loss donut chart

### 🛡️ Risk — Risk Monitor
Live risk dashboard for open positions. Requires a connected Solana wallet.

- Circular margin health gauge (0–100%) color-coded green → yellow → red
- Real stats: balance, margin used, available margin, Cross MMR
- Per-position cards showing entry, mark price, liquidation price
- Liquidation distance progress bar — color shifts as position approaches liquidation
- Mark prices sourced from `/info/prices` since `/positions` doesn't return them
- Active Alerts panel — add/remove margin threshold alerts per symbol

### 🐋 Whale Feed — Order Flow Tracker
Live feed of large trades across Pacifica markets.

- Polls 6 symbols (BTC, ETH, SOL, DOGE, WIF, ARB) every 5 seconds
- Symbol filter pills + min-size slider (adjustable threshold, default $5k)
- Liquidation rows highlighted red with pulsing badge
- Buy/Sell pressure bar — computed from filtered trade volume
- Rolling Open Interest chart — accumulates 30 snapshots over time
- Top 5 active markets ranked by 24h volume
- `🔥 HOT` badges from Elfa AI alongside trade rows

### 💸 Funding — Funding Rate Intelligence
Historical and live funding rate data across all markets.

- Sortable table: current rate, next rate, 8h annualized APR, trend, 30d avg
- Click any row to switch the history chart to that market
- Symbol dropdown for the history chart
- Dual-color area chart: red above zero (longs pay), green below zero (shorts pay)
- Funding Opportunity Detector — highlights extreme rate anomalies

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + Vite 8 |
| State management | Redux Toolkit (RTK Query for API caching) |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Animations | Framer Motion |
| Wallet auth | Privy v3 (`@privy-io/react-auth`) |
| Solana SDK | `@solana/kit` |
| Routing | React Router v7 |
| Icons | React Icons v5 |

---

## Data Sources

### Pacifica REST API
Base URL: `https://test-api.pacifica.fi/api/v1` (testnet) / `https://api.pacifica.fi/api/v1` (mainnet)

| Endpoint | Used by |
|---|---|
| `GET /info` | Market specs |
| `GET /info/prices` | Markets, Whale Feed, Risk |
| `GET /trades?symbol=X` | Whale Feed (per-symbol polling) |
| `GET /funding_rate/history?symbol=X` | Funding chart |
| `GET /account?account=ADDRESS` | Risk, PnL |
| `GET /positions?account=ADDRESS` | Risk |
| `GET /trades/history?account=ADDRESS` | PnL |

### Elfa AI API (Social Intelligence)
Proxied via Vite dev server to avoid CORS. Base path: `/elfa-api/*` → `https://api.elfa.ai/v2/*`

| Endpoint | Used by |
|---|---|
| `GET /aggregations/trending-tokens` | HOT badges, ElfaPanel tokens tab |
| `GET /data/token-news?token=X` | ElfaPanel news tab |
| `GET /data/top-mentions?ticker=X` | SocialBuzzPanel |
| `GET /data/event-summary?keywords=X` | SocialBuzzPanel AI summary |
| `GET /aggregations/trending-cas/twitter` | Available (unused in UI) |

> All Elfa endpoints used are **free tier** (1,000 credits/month). Trending Narratives is excluded as it requires the Grow tier ($290/month).

---

## Project Structure

```
src/
├── App.jsx                        # Router config
├── main.jsx                       # Privy + Redux providers
├── index.css                      # Theme variables, custom utilities
│
├── pages/
│   ├── Home.jsx                   # Markets tab
│   ├── PnL.jsx                    # PnL tab (wallet-gated)
│   ├── Risk.jsx                   # Risk tab (wallet-gated)
│   ├── WhaleFeed.jsx              # Whale Feed tab
│   ├── Funding.jsx                # Funding tab
│   ├── Layout.jsx                 # Sidebar + Navbar shell
│   └── ErrorPage.jsx              # 404 fallback
│
├── features/
│   ├── pacificaSlice.js           # RTK Query — all Pacifica endpoints
│   ├── elfaSlice.js               # RTK Query — all Elfa AI endpoints
│   ├── walletSlice.js             # Redux — wallet address + connection state
│   └── refreshSlice.js            # Redux — global manual refresh trigger
│
├── components/
│   ├── Navbar.jsx                 # Header with refresh button + wallet badge
│   ├── Sidebar.jsx                # Navigation links
│   ├── ConnectWalletGate.jsx      # Auth gate for wallet-required pages
│   ├── ElfaPanel.jsx              # Social Intelligence panel + TrendingBadge
│   ├── MetricCard.jsx             # Animated stat tile
│   ├── CountUp.jsx                # Number count-up animation
│   ├── SkeletonCard.jsx           # Shimmer loading for market cards
│   ├── SkeletonMetricCard.jsx     # Shimmer loading for stat tiles
│   ├── SkeletonTableRow.jsx       # Shimmer loading for table rows
│   └── ErrorState.jsx             # Error display (full-page + compact)
│
└── Store/
    └── store.js                   # Redux store config
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Phantom wallet (browser extension) for testing wallet-gated features
- A Pacifica testnet account — register at [test-app.pacifica.fi](https://test-app.pacifica.fi) using invite code `Pacifica`

### Installation

```bash
# 1. Clone the repository
https://github.com/PythoSalaf/PacDash.git
cd pacdash

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
```

### Environment Variables

Edit `.env` with your keys:

```env
# Privy — wallet auth
# Get your App ID at https://dashboard.privy.io
VITE_PRIVY_APP_ID=your_privy_app_id

# Elfa AI — social intelligence (optional but recommended)
# Get a free key at https://www.elfa.ai/api (1,000 free credits/month)
VITE_ELFA_API_KEY=your_elfa_api_key
```

> The Elfa API key is injected server-side by the Vite proxy — it never appears in browser network requests.

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Build for Production

```bash
npm run build
npm run preview
```

---

## Privy Dashboard Configuration

Before Phantom wallet connection works, configure your Privy app at [dashboard.privy.io](https://dashboard.privy.io):

**Settings → Allowed Origins**
```
http://localhost:5173
https://your-production-domain.com
```

**Login Methods**
- ✅ Wallet (with Solana wallets enabled)
- ✅ Email
- ✅ Google

**Wallets**
- ✅ Solana embedded wallets (auto-create on login)
- External wallets: Phantom, Solflare enabled

---

## Testing the Wallet-Gated Pages

The **PnL** and **Risk** pages require a Pacifica account with activity. To test:

1. Go to [test-app.pacifica.fi](https://test-app.pacifica.fi), enter invite code `Pacifica`
2. Connect your Phantom wallet (make sure it's on **Solana**, not Ethereum)
3. Deposit testnet USDC
4. Open at least one trade
5. Come back to PacDash and connect the same Phantom wallet

> **Important:** Pacifica uses Solana addresses (base58, e.g. `6ETnuf...`). If you connect an Ethereum wallet (`0x...`), the app will detect it and show a warning.

---

## Sponsor Integrations

This project uses all three hackathon sponsor tools:

| Sponsor | Role |
|---|---|
| **Pacifica API** | Core data source — market prices, positions, trades, funding rates |
| **Elfa AI** | Social intelligence — trending tokens, token news, top mentions, event summaries |
| **Privy** | Wallet authentication — Phantom/Solflare + email/Google embedded Solana wallets |

---

## Architecture

```
Browser
  │
  ├─ Privy SDK ──────────────────── Wallet auth (Phantom / email)
  │
  ├─ Redux Store
  │   ├─ walletSlice     ──────────── Address + connection state
  │   ├─ refreshSlice    ──────────── Manual refresh trigger
  │   ├─ pacificaApi     ──────────── RTK Query cache for Pacifica
  │   └─ elfaApi         ──────────── RTK Query cache for Elfa AI
  │
  ├─ React Pages
  │   ├─ Home       ──── GET /info/prices (public)
  │   ├─ WhaleFeed  ──── GET /trades?symbol=X × 6 (public, polled 5s)
  │   ├─ Funding    ──── GET /funding_rate/history (public)
  │   ├─ Risk       ──── GET /account + /positions (wallet address required)
  │   └─ PnL        ──── GET /trades/history (wallet address required)
  │
  └─ Vite Dev Proxy
      └─ /elfa-api/* ──── Rewrites to https://api.elfa.ai/v2/*
                          Injects x-elfa-api-key server-side
```

---

## Hackathon Track

**Track:** Analytics & Data — Market intelligence, PnL tracking, risk dashboards

**Judging criteria addressed:**
- **Innovation** — Elfa AI social sentiment overlaid on market data; liquidation distance visualization; funding rate opportunity detector
- **Technical execution** — RTK Query caching, Redux state management, real API integration across all 5 tabs
- **User experience** — Skeleton loading states, error boundaries, empty wallet states, smooth Framer Motion transitions
- **Potential impact** — Covers the full trader workflow: market scan → position monitoring → risk management → exit timing
- **Presentation** — Unified dark terminal aesthetic; consistent color language (cyan = data, green = positive, red = negative, purple = social)

---

## Known Limitations

- `/account/equity_history` endpoint does not exist on Pacifica's API — equity chart is derived from cumulative trade PnL instead
- Elfa Trending Narratives requires the Grow tier ($290/month) — replaced with Token News (free tier)
- Whale Feed uses REST polling (5s) rather than WebSocket — Pacifica WebSocket auth would require signing
- Mark prices on the Risk page are sourced from `/info/prices` separately since `/positions` does not return live mark prices

---

## License

MIT — see [LICENSE](LICENSE)

---

## Built with ♥ for the Pacifica Hackathon

[pacifica.fi](https://pacifica.fi) · [elfa.ai](https://elfa.ai) · [privy.io](https://privy.io)
