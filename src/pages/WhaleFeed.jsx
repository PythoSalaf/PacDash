import { useMemo, useRef, useState, useEffect } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MdArrowDownward, MdOutlineArrowUpward } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";
import { FiSliders } from "react-icons/fi";
import {
  useGetRecentTradesQuery,
  useGetMarketPricesQuery,
} from "../features/pacificaSlice";
import { TrendingBadge } from "../components/ElfaPanel";

const MIN_SIZE_DEFAULT = 5000; // $5k default — testnet trades are smaller

const fmt = (n) => {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
};

const timeAgo = (ts) => {
  const s = Math.floor((Date.now() - Number(ts)) / 1000);
  if (s < 60) return `${s}s ago`;
  return `${Math.floor(s / 60)}m ago`;
};

// Pacifica side: "open_long" | "open_short" | "close_long" | "close_short"
const toDisplay = (side) => {
  if (!side) return { dir: "BUY", label: "BUY" };
  const s = side.toLowerCase();
  if (s.includes("long")) return { dir: "BUY", label: "LONG" };
  return { dir: "SELL", label: "SHORT" };
};

const toCause = (cause) => {
  if (!cause || cause === "normal") return null;
  if (cause.includes("liquidation")) return "LIQUIDATION";
  if (cause === "settlement") return "ADL";
  return cause.toUpperCase();
};

const SYMBOLS = ["BTC", "ETH", "SOL", "DOGE", "WIF", "ARB", "AVAX", "LINK"];

// Per-symbol feed — polls every 3 minutes
const useSymbolFeed = (symbol) => {
  const { data = [], isError } = useGetRecentTradesQuery(
    { symbol },
    { pollingInterval: 180000 },
  );
  return { trades: data.map((t) => ({ ...t, _sym: symbol })), isError };
};

const WhaleFeed = () => {
  const [minSize, setMinSize] = useState(MIN_SIZE_DEFAULT);
  const [symbolFilter, setSymbolFilter] = useState("ALL");

  const btc = useSymbolFeed("BTC");
  const eth = useSymbolFeed("ETH");
  const sol = useSymbolFeed("SOL");
  const doge = useSymbolFeed("DOGE");
  const wif = useSymbolFeed("WIF");
  const arb = useSymbolFeed("ARB");

  const allRaw = useMemo(
    () => [
      ...btc.trades,
      ...eth.trades,
      ...sol.trades,
      ...doge.trades,
      ...wif.trades,
      ...arb.trades,
    ],
    [btc.trades, eth.trades, sol.trades, doge.trades, wif.trades, arb.trades],
  );

  const processed = useMemo(
    () =>
      allRaw.map((t) => {
        const price = parseFloat(t.price ?? 0);
        const amount = parseFloat(t.amount ?? 0);
        const sizeUsd = price * amount;
        const { dir, label } = toDisplay(t.side);
        return {
          id: `${t._sym}-${t.created_at}-${Math.random().toString(36).slice(2)}`,
          symbol: t._sym,
          side: dir,
          sideLabel: label,
          sizeUsd,
          cause: toCause(t.cause),
          timestamp: t.created_at,
        };
      }),
    [allRaw],
  );

  const filtered = useMemo(() => {
    let list = processed.filter((t) => t.sizeUsd >= minSize);
    if (symbolFilter !== "ALL")
      list = list.filter((t) => t.symbol === symbolFilter);
    return list
      .sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
      .slice(0, 80);
  }, [processed, minSize, symbolFilter]);

  const { buyPct, sellPct } = useMemo(() => {
    const buyV = filtered
      .filter((t) => t.side === "BUY")
      .reduce((a, t) => a + t.sizeUsd, 0);
    const sellV = filtered
      .filter((t) => t.side === "SELL")
      .reduce((a, t) => a + t.sizeUsd, 0);
    const tot = buyV + sellV || 1;
    return {
      buyPct: ((buyV / tot) * 100).toFixed(1),
      sellPct: ((sellV / tot) * 100).toFixed(1),
    };
  }, [filtered]);

  const { data: priceData = [] } = useGetMarketPricesQuery();

  // Rolling OI buffer
  const [oiBuffer, setOiBuffer] = useState([]);
  useEffect(() => {
    if (!priceData.length) return;
    const totalOI = priceData.reduce(
      (a, d) => a + parseFloat(d.open_interest ?? 0),
      0,
    );
    const now = new Date();
    const label = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;
    setOiBuffer((prev) => [...prev, { time: label, oi: totalOI }].slice(-30));
  }, [priceData]);

  const topMarkets = useMemo(
    () =>
      [...priceData]
        .sort(
          (a, b) =>
            parseFloat(b.volume_24h ?? 0) - parseFloat(a.volume_24h ?? 0),
        )
        .slice(0, 5),
    [priceData],
  );
  const maxVol = topMarkets[0] ? parseFloat(topMarkets[0].volume_24h ?? 1) : 1;

  const totalTradesLoaded = allRaw.length;
  const anyFailed = btc.isError && eth.isError && sol.isError;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-lg font-bold">Whale Feed</h2>
        <div className="flex items-center gap-3">
          {totalTradesLoaded > 0 && (
            <span className="text-[10px] font-mono text-muted-foreground">
              {totalTradesLoaded} raw trades loaded
            </span>
          )}
          <span className="flex items-center gap-2 text-xs font-body text-positive">
            <span className="w-2 h-2 rounded-full bg-positive animate-pulse" />{" "}
            Live
          </span>
        </div>
      </div>

      {anyFailed && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs font-mono text-destructive">
          Trade feeds unavailable — check network connection
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5 items-center">
        <FiSliders className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <div className="flex gap-1.5 flex-wrap">
          {["ALL", ...SYMBOLS.slice(0, 6)].map((s) => (
            <button
              key={s}
              onClick={() => setSymbolFilter(s)}
              className={`px-2.5 py-1 text-[10px] font-mono rounded border transition-colors ${
                symbolFilter === s
                  ? "border-primary text-primary bg-primary/10"
                  : "border-border text-muted-foreground hover:border-primary/40"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-[10px] text-muted-foreground font-mono shrink-0">
            Min size:
          </span>
          <input
            type="range"
            min={500}
            max={200000}
            step={500}
            value={minSize}
            onChange={(e) => setMinSize(Number(e.target.value))}
            className="w-24 accent-primary"
          />
          <span className="text-[10px] font-mono text-primary w-16 shrink-0">
            {fmt(minSize)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Trade stream */}
        <div className="col-span-3 card-gradient rounded-lg border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-xs text-muted-foreground uppercase tracking-wider">
              Recent Large Trades
            </h3>
            <span className="text-[10px] font-mono text-muted-foreground">
              {filtered.length} trades
            </span>
          </div>

          <div className="space-y-0.5 max-h-[500px] overflow-y-auto pr-1">
            {totalTradesLoaded === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <span className="text-xs font-mono text-muted-foreground">
                  Loading trade feed…
                </span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 gap-2">
                <span className="text-xs font-mono text-muted-foreground">
                  No trades ≥ {fmt(minSize)} yet
                </span>
                <button
                  onClick={() => setMinSize(500)}
                  className="text-[10px] text-primary hover:underline font-mono"
                >
                  Lower threshold to $500
                </button>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {filtered.map((t) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className={`flex items-center gap-3 px-3 py-2 rounded text-xs font-mono
                      ${
                        t.cause === "LIQUIDATION"
                          ? "bg-destructive/8 border-l-2 border-destructive"
                          : "hover:bg-muted/30 border-l-2 border-transparent"
                      } transition-colors`}
                  >
                    <span className="text-muted-foreground w-14 shrink-0">
                      {timeAgo(t.timestamp)}
                    </span>
                    <span className="flex items-center gap-1 shrink-0">
                      <span className="bg-muted px-1.5 py-0.5 rounded text-[10px] w-12 text-center">
                        {t.symbol}
                      </span>
                      <TrendingBadge symbol={t.symbol} />
                    </span>
                    <span
                      className={`flex items-center gap-0.5 w-16 shrink-0 ${
                        t.side === "BUY" ? "text-positive" : "text-destructive"
                      }`}
                    >
                      {t.side === "BUY" ? (
                        <MdOutlineArrowUpward className="w-3 h-3" />
                      ) : (
                        <MdArrowDownward className="w-3 h-3" />
                      )}
                      {t.sideLabel}
                    </span>
                    <span
                      className={`font-bold ${t.sizeUsd >= 100000 ? "text-foreground" : "text-muted-foreground"}`}
                    >
                      {fmt(t.sizeUsd)}
                    </span>
                    {t.cause && (
                      <span
                        className={`ml-auto text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                          t.cause === "LIQUIDATION"
                            ? "bg-destructive/20 text-destructive animate-pulse"
                            : "bg-yellow-500/20 text-yellow-400"
                        }`}
                      >
                        {t.cause}
                      </span>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="col-span-2 space-y-4">
          {/* Buy/Sell pressure */}
          <div className="card-gradient rounded-lg border border-border p-4">
            <h3 className="font-display text-xs mb-3 text-muted-foreground uppercase tracking-wider">
              Buy / Sell Pressure
            </h3>
            <div className="flex h-5 rounded-full overflow-hidden mb-2">
              <div
                className="bg-positive transition-all duration-500"
                style={{ width: `${buyPct}%` }}
              />
              <div
                className="bg-destructive transition-all duration-500"
                style={{ width: `${sellPct}%` }}
              />
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-positive">{buyPct}% Buy</span>
              <span className="text-destructive">{sellPct}% Sell</span>
            </div>
          </div>

          {/* OI chart */}
          <div className="card-gradient rounded-lg border border-border p-4">
            <h3 className="font-display text-xs mb-3 text-muted-foreground uppercase tracking-wider">
              Total Open Interest
            </h3>
            {oiBuffer.length < 2 ? (
              <div className="h-40 animate-pulse bg-muted/40 rounded-lg" />
            ) : (
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={oiBuffer}>
                    <XAxis
                      dataKey="time"
                      tick={{ fill: "#5A6478", fontSize: 9 }}
                      axisLine={false}
                      tickLine={false}
                      interval={Math.floor(oiBuffer.length / 4)}
                    />
                    <YAxis
                      tick={{ fill: "#5A6478", fontSize: 9 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${(v / 1e9).toFixed(1)}B`}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#0F1420",
                        border: "1px solid #1C2333",
                        borderRadius: 8,
                        fontSize: 11,
                        fontFamily: "JetBrains Mono",
                      }}
                      formatter={(v) => [fmt(v), "OI"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="oi"
                      stroke="#00D4FF"
                      strokeWidth={1.5}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Top markets */}
          <div className="card-gradient rounded-lg border border-border p-4">
            <h3 className="font-display text-xs mb-3 text-muted-foreground uppercase tracking-wider">
              Top Active Markets
            </h3>
            {topMarkets.length === 0 ? (
              <div className="space-y-2.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 animate-pulse"
                  >
                    <div className="w-4 h-2 rounded bg-muted" />
                    <div className="w-10 h-2 rounded bg-muted" />
                    <div className="flex-1 h-1.5 rounded bg-muted" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2.5">
                {topMarkets.map((m, i) => (
                  <div
                    key={m.symbol}
                    className="flex items-center gap-2 text-xs"
                  >
                    <span className="font-mono text-muted-foreground w-4">
                      {i + 1}.
                    </span>
                    <span className="font-mono w-12">{m.symbol}</span>
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary/50 rounded-full transition-all duration-700"
                        style={{
                          width: `${(parseFloat(m.volume_24h ?? 0) / maxVol) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="font-mono text-muted-foreground text-[10px] w-16 text-right">
                      {fmt(parseFloat(m.volume_24h ?? 0))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhaleFeed;
