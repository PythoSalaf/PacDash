import { useState, useMemo } from "react";
import { MetricCard } from "../components";
import SkeletonCard from "../components/SkeletonCard";
import SkeletonMetricCard from "../components/SkeletonMetricCard";
import ErrorState from "../components/ErrorState";
import { motion, AnimatePresence } from "framer-motion";
import { MdArrowDownward, MdOutlineArrowUpward } from "react-icons/md";
import { FiSearch } from "react-icons/fi";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { useGetMarketPricesQuery } from "../features/pacificaSlice";
import ElfaPanel, { TrendingBadge } from "../components/ElfaPanel";

// ── helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(2)}`;
};

// Build a fake sparkline from yesterday_price → mark price in 24 steps
const buildSparkline = (from, to) => {
  const steps = 24;
  return Array.from({ length: steps }, (_, i) => {
    const progress = i / (steps - 1);
    const noise = (Math.random() - 0.5) * (Math.abs(to - from) * 0.4);
    return { v: from + (to - from) * progress + noise };
  });
};

// Transform raw Pacifica /info/prices row into a display object
const toMarket = (item) => {
  const mark = parseFloat(item.mark ?? 0);
  const yesterday = parseFloat(item.yesterday_price ?? mark);
  const change24h = yesterday > 0 ? ((mark - yesterday) / yesterday) * 100 : 0;
  return {
    symbol: item.symbol,
    markPrice: mark,
    change24h,
    openInterest: parseFloat(item.open_interest ?? 0),
    fundingRate: parseFloat(item.funding ?? 0),
    volume24h: parseFloat(item.volume_24h ?? 0),
    sparkline: buildSparkline(yesterday, mark),
  };
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "gainers", label: "Gainers" },
  { id: "losers", label: "Losers" },
  { id: "highFunding", label: "High Funding" },
  { id: "highOI", label: "High OI" },
];

// ── component ─────────────────────────────────────────────────────────────────
const Home = () => {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  // ── Pacifica data ──
  const {
    data: priceData = [],
    isLoading: pricesLoading,
    isError: pricesError,
    error: pricesErrorObj,
  } = useGetMarketPricesQuery(undefined);

  // ── Transform + filter ──
  const markets = useMemo(() => priceData.map(toMarket), [priceData]);

  const filtered = useMemo(() => {
    let list = markets;

    // Search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((m) => m.symbol.toLowerCase().includes(q));
    }

    // Filter tabs
    switch (activeFilter) {
      case "gainers":
        list = list
          .filter((m) => m.change24h > 0)
          .sort((a, b) => b.change24h - a.change24h);
        break;
      case "losers":
        list = list
          .filter((m) => m.change24h < 0)
          .sort((a, b) => a.change24h - b.change24h);
        break;
      case "highFunding":
        list = [...list].sort(
          (a, b) => Math.abs(b.fundingRate) - Math.abs(a.fundingRate),
        );
        break;
      case "highOI":
        list = [...list].sort((a, b) => b.openInterest - a.openInterest);
        break;
      default:
        break;
    }
    return list;
  }, [markets, search, activeFilter]);

  // ── Derived top stats ──
  const maxOI = Math.max(...markets.map((m) => m.openInterest), 1);
  const totalOI = markets.reduce((a, m) => a + m.openInterest, 0);
  const totalVol = markets.reduce((a, m) => a + m.volume24h, 0);
  const mostActive = [...markets].sort((a, b) => b.volume24h - a.volume24h)[0];
  const highestFunding = [...markets].sort(
    (a, b) => Math.abs(b.fundingRate) - Math.abs(a.fundingRate),
  )[0];

  // ── Render ──
  return (
    <div className="w-full space-y-6">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold font-display">Market Overview</h2>
        <span className="hidden font-mono text-xs md:block text-muted-foreground">
          Use ↻ in the header to refresh
        </span>
      </div>

      {/* ── Top metric cards ── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {pricesLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <SkeletonMetricCard key={i} />
          ))
        ) : pricesError ? (
          <div className="col-span-4">
            <ErrorState
              message={pricesErrorObj?.message ?? "Failed to fetch market data"}
              onRetry={refetchPrices}
            />
          </div>
        ) : (
          <>
            <MetricCard
              label="Total Open Interest"
              value={totalOI}
              prefix="$"
              decimals={0}
            />
            <MetricCard
              label="24h Volume"
              value={totalVol}
              prefix="$"
              decimals={0}
            />
            <MetricCard
              label="Most Active"
              value={mostActive?.volume24h ?? 0}
              prefix="$"
              decimals={0}
              subtext={mostActive?.symbol}
            />
            <MetricCard
              label="Highest Funding"
              value={(highestFunding?.fundingRate ?? 0) * 100}
              suffix="%"
              decimals={4}
              subtext={highestFunding?.symbol}
            />
          </>
        )}
      </div>

      {/* ── Elfa Social Intelligence Panel ── */}
      <ElfaPanel />

      {/* ── Search + filter bar ── */}
      <div className="flex flex-col gap-3 sm:flex-row">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search markets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full py-2 pr-3 font-mono text-xs transition-colors border rounded-lg pl-9 bg-muted border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
          />
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-3 py-1.5 text-xs font-body rounded-lg border transition-colors ${
                activeFilter === f.id
                  ? "border-primary text-primary bg-primary/10"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Results count ── */}
      {!pricesLoading && !pricesError && (
        <p className="-mt-2 font-mono text-xs text-muted-foreground">
          Showing {filtered.length} of {markets.length} markets
        </p>
      )}

      {/* ── Market cards grid ── */}
      {pricesLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : pricesError ? null : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FiSearch className="w-8 h-8 mb-3 text-muted-foreground" />
          <p className="font-mono text-sm text-muted-foreground">
            No markets match &quot;{search}&quot;
          </p>
          <button
            onClick={() => {
              setSearch("");
              setActiveFilter("all");
            }}
            className="mt-3 text-xs text-primary hover:underline font-body"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {filtered.map((m, i) => {
              return (
                <motion.div
                  key={m.symbol}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.03, duration: 0.2 }}
                  whileHover={{ scale: 1.02 }}
                  className="card-gradient rounded-lg border border-border p-4 cursor-pointer transition-shadow hover:shadow-[0_0_20px_hsl(190_100%_50%/0.08)] relative overflow-hidden"
                >
                  {/* Elfa trending badge */}
                  <div className="absolute top-2 right-2">
                    <TrendingBadge symbol={m.symbol} />
                  </div>

                  {/* Symbol + change % */}
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-sm font-bold font-display">
                        {m.symbol}
                      </span>
                    </div>
                    <span
                      className={`flex items-center gap-0.5 text-xs font-mono ${
                        m.change24h >= 0 ? "text-positive" : "text-destructive"
                      }`}
                    >
                      {m.change24h >= 0 ? (
                        <MdOutlineArrowUpward className="w-3 h-3" />
                      ) : (
                        <MdArrowDownward className="w-3 h-3" />
                      )}
                      {Math.abs(m.change24h).toFixed(2)}%
                    </span>
                  </div>

                  {/* Mark price */}
                  <p className="mb-3 font-mono text-lg font-bold text-primary glow-cyan-sm">
                    {m.markPrice >= 1
                      ? `$${m.markPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                      : `$${m.markPrice.toFixed(6)}`}
                  </p>

                  {/* Open Interest bar */}
                  <div className="mb-2">
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                      <span>Open Interest</span>
                      <span>{fmt(m.openInterest)}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-700 rounded-full bg-primary/60"
                        style={{
                          width: `${Math.min((m.openInterest / maxOI) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Funding + volume */}
                  <div className="flex items-center justify-between text-[10px] mb-2">
                    <span
                      className={`font-mono ${m.fundingRate >= 0 ? "text-destructive" : "text-positive"}`}
                    >
                      FR: {(m.fundingRate * 100).toFixed(4)}%
                    </span>
                    <span className="text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">
                      {fmt(m.volume24h)}
                    </span>
                  </div>

                  {/* Sparkline */}
                  <div className="h-8">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={m.sparkline}>
                        <Line
                          type="monotone"
                          dataKey="v"
                          stroke={m.change24h >= 0 ? "#00E5A0" : "#FF4D6A"}
                          strokeWidth={1.5}
                          dot={false}
                          isAnimationActive={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default Home;
