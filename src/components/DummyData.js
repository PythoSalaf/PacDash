// ── Markets ──
const spark = (base, vol) =>
  Array.from({ length: 24 }, () => base + (Math.random() - 0.5) * vol);

export const markets = [
  {
    symbol: "BTC",
    name: "Bitcoin",
    markPrice: 67432.5,
    change24h: 2.34,
    openInterest: 342_000_000,
    fundingRate: 0.0082,
    volume24h: 1_240_000_000,
    sparkline: spark(67000, 2000),
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    markPrice: 3521.8,
    change24h: -1.12,
    openInterest: 198_000_000,
    fundingRate: -0.0034,
    volume24h: 680_000_000,
    sparkline: spark(3500, 200),
  },
  {
    symbol: "SOL",
    name: "Solana",
    markPrice: 178.42,
    change24h: 5.67,
    openInterest: 89_000_000,
    fundingRate: 0.0156,
    volume24h: 520_000_000,
    sparkline: spark(170, 20),
  },
  {
    symbol: "DOGE",
    name: "Dogecoin",
    markPrice: 0.1834,
    change24h: -3.21,
    openInterest: 34_000_000,
    fundingRate: 0.0045,
    volume24h: 180_000_000,
    sparkline: spark(0.18, 0.02),
  },
  {
    symbol: "ARB",
    name: "Arbitrum",
    markPrice: 1.24,
    change24h: 1.89,
    openInterest: 22_000_000,
    fundingRate: -0.0012,
    volume24h: 95_000_000,
    sparkline: spark(1.2, 0.1),
  },
  {
    symbol: "AVAX",
    name: "Avalanche",
    markPrice: 38.92,
    change24h: -0.45,
    openInterest: 41_000_000,
    fundingRate: 0.0023,
    volume24h: 140_000_000,
    sparkline: spark(39, 3),
  },
  {
    symbol: "LINK",
    name: "Chainlink",
    markPrice: 14.87,
    change24h: 3.12,
    openInterest: 28_000_000,
    fundingRate: -0.0056,
    volume24h: 110_000_000,
    sparkline: spark(15, 1.5),
  },
  {
    symbol: "WIF",
    name: "dogwifhat",
    markPrice: 2.91,
    change24h: 12.4,
    openInterest: 18_000_000,
    fundingRate: 0.032,
    volume24h: 250_000_000,
    sparkline: spark(2.8, 0.5),
  },
];

// ── PnL ──
export const trades = [
  {
    id: "1",
    time: "2024-03-15 14:32",
    symbol: "BTC",
    side: "LONG",
    size: 0.5,
    entry: 65200,
    exit: 67400,
    pnl: 1100,
  },
  {
    id: "2",
    time: "2024-03-14 09:15",
    symbol: "ETH",
    side: "SHORT",
    size: 10,
    entry: 3600,
    exit: 3480,
    pnl: 1200,
  },
  {
    id: "3",
    time: "2024-03-13 22:45",
    symbol: "SOL",
    side: "LONG",
    size: 100,
    entry: 165,
    exit: 178,
    pnl: 1300,
  },
  {
    id: "4",
    time: "2024-03-12 11:20",
    symbol: "BTC",
    side: "SHORT",
    size: 0.3,
    entry: 68000,
    exit: 69200,
    pnl: -360,
  },
  {
    id: "5",
    time: "2024-03-11 16:50",
    symbol: "DOGE",
    side: "LONG",
    size: 50000,
    entry: 0.17,
    exit: 0.165,
    pnl: -250,
  },
  {
    id: "6",
    time: "2024-03-10 08:30",
    symbol: "SOL",
    side: "LONG",
    size: 50,
    entry: 155,
    exit: 172,
    pnl: 850,
  },
  {
    id: "7",
    time: "2024-03-09 19:10",
    symbol: "ETH",
    side: "LONG",
    size: 5,
    entry: 3400,
    exit: 3550,
    pnl: 750,
  },
  {
    id: "8",
    time: "2024-03-08 13:25",
    symbol: "ARB",
    side: "SHORT",
    size: 5000,
    entry: 1.35,
    exit: 1.28,
    pnl: 350,
  },
  {
    id: "9",
    time: "2024-03-07 07:00",
    symbol: "BTC",
    side: "LONG",
    size: 0.2,
    entry: 63500,
    exit: 64800,
    pnl: 260,
  },
  {
    id: "10",
    time: "2024-03-06 21:40",
    symbol: "AVAX",
    side: "SHORT",
    size: 200,
    entry: 42,
    exit: 44.5,
    pnl: -500,
  },
];

export const equityData = Array.from({ length: 30 }, (_, i) => ({
  date: `Mar ${i + 1}`,
  equity: 10000 + Math.sin(i * 0.3) * 2000 + i * 150 + Math.random() * 500,
}));

// ── Risk ──
export const positions = [
  {
    symbol: "BTC",
    side: "LONG",
    entryPrice: 65200,
    markPrice: 67432.5,
    liquidationPrice: 58400,
    unrealizedPnl: 2232.5,
    leverage: 10,
    marginType: "CROSS",
    size: 1,
  },
  {
    symbol: "ETH",
    side: "SHORT",
    entryPrice: 3600,
    markPrice: 3521.8,
    liquidationPrice: 4100,
    unrealizedPnl: 782,
    leverage: 20,
    marginType: "ISOLATED",
    size: 10,
  },
  {
    symbol: "SOL",
    side: "LONG",
    entryPrice: 168,
    markPrice: 178.42,
    liquidationPrice: 142,
    unrealizedPnl: 521,
    leverage: 5,
    marginType: "CROSS",
    size: 50,
  },
];

// ── Whale Feed ──
export const whaleTrades = Array.from({ length: 30 }, (_, i) => ({
  id: `w${i}`,
  timestamp: Date.now() - i * 12000 - Math.random() * 5000,
  symbol: ["BTC", "ETH", "SOL", "DOGE", "WIF"][Math.floor(Math.random() * 5)],
  side: Math.random() > 0.45 ? "BUY" : "SELL",
  sizeUsd: Math.floor(Math.random() * 500000) + 10000,
  cause:
    Math.random() > 0.85
      ? "LIQUIDATION"
      : Math.random() > 0.95
        ? "ADL"
        : "TRADE",
}));

export const oiHistory = Array.from({ length: 48 }, (_, i) => ({
  time: `${Math.floor(i / 2)}:${i % 2 === 0 ? "00" : "30"}`,
  oi: 340_000_000 + Math.sin(i * 0.2) * 20_000_000 + Math.random() * 5_000_000,
}));

// ── Funding ──
export const fundingRates = [
  {
    market: "BTC-PERP",
    currentRate: 0.0082,
    nextRate: 0.0075,
    annualizedApr: 8.97,
    trend: "down",
    historicalAvg: 0.006,
  },
  {
    market: "ETH-PERP",
    currentRate: -0.0034,
    nextRate: -0.0028,
    annualizedApr: -3.72,
    trend: "up",
    historicalAvg: 0.004,
  },
  {
    market: "SOL-PERP",
    currentRate: 0.0156,
    nextRate: 0.018,
    annualizedApr: 17.08,
    trend: "up",
    historicalAvg: 0.007,
  },
  {
    market: "DOGE-PERP",
    currentRate: 0.0045,
    nextRate: 0.005,
    annualizedApr: 4.93,
    trend: "up",
    historicalAvg: 0.003,
  },
  {
    market: "ARB-PERP",
    currentRate: -0.0012,
    nextRate: -0.001,
    annualizedApr: -1.31,
    trend: "up",
    historicalAvg: 0.002,
  },
  {
    market: "WIF-PERP",
    currentRate: 0.032,
    nextRate: 0.028,
    annualizedApr: 35.04,
    trend: "down",
    historicalAvg: 0.012,
  },
  {
    market: "AVAX-PERP",
    currentRate: 0.0023,
    nextRate: 0.002,
    annualizedApr: 2.52,
    trend: "down",
    historicalAvg: 0.003,
  },
  {
    market: "LINK-PERP",
    currentRate: -0.0056,
    nextRate: -0.004,
    annualizedApr: -6.13,
    trend: "up",
    historicalAvg: 0.004,
  },
];

export const fundingHistory = Array.from({ length: 90 }, (_, i) => ({
  date: `Day ${i + 1}`,
  rate: Math.sin(i * 0.15) * 0.015 + (Math.random() - 0.5) * 0.005,
}));
