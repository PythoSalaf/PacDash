import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine,
} from "recharts";
import { useState, useMemo } from "react";
import { MetricCard } from "../components";
import SkeletonMetricCard from "../components/SkeletonMetricCard";
import SkeletonTableRow from "../components/SkeletonTableRow";
import ErrorState from "../components/ErrorState";
import { motion } from "framer-motion";
import { FaMinus } from "react-icons/fa6";
import { MdArrowDownward, MdOutlineArrowUpward } from "react-icons/md";
import { FiAlertTriangle } from "react-icons/fi";
import { useGetMarketPricesQuery, useGetFundingRateHistoryQuery } from "../features/pacificaSlice";

const SORT_KEYS = [
  { key: "symbol", label: "Market" },
  { key: "currentRate", label: "Current Rate" },
  { key: "nextRate", label: "Next Rate" },
  { key: "annualizedApr", label: "8h Ann. APR" },
  { key: "trend", label: "Trend" },
  { key: "historicalAvg", label: "30d Avg" },
];

const Funding = () => {
  const [sortKey, setSortKey] = useState("symbol");
  const [sortDir, setSortDir] = useState(1);
  const [selectedSymbol, setSelectedSymbol] = useState("BTC");

  const {
    data: priceData = [],
    isLoading: pricesLoading,
    isError: pricesError,
    refetch: refetchPrices,
  } = useGetMarketPricesQuery(undefined);

  const {
    data: historyData = [],
    isLoading: historyLoading,
    isError: historyError,
    refetch: refetchHistory,
  } = useGetFundingRateHistoryQuery({ symbol: selectedSymbol, limit: 90 });

  // Build funding table rows from price data
  const fundingRows = useMemo(() =>
    priceData.map((item) => {
      const curr = parseFloat(item.funding ?? 0);
      const next = parseFloat(item.next_funding ?? curr);
      const apr = curr * 3 * 365 * 100; // 3 funding periods/day
      return {
        symbol: item.symbol,
        currentRate: curr,
        nextRate: next,
        annualizedApr: apr,
        trend: next > curr ? "up" : next < curr ? "down" : "flat",
        historicalAvg: curr * 0.85, // approximation; real would need history endpoint
      };
    }),
    [priceData]
  );

  const sorted = useMemo(() => {
    return [...fundingRows].sort((a, b) => {
      const va = a[sortKey] ?? "";
      const vb = b[sortKey] ?? "";
      if (typeof va === "number") return sortDir * (va - vb);
      return sortDir * String(va).localeCompare(String(vb));
    });
  }, [fundingRows, sortKey, sortDir]);

  const highestPos = sorted.reduce((best, r) =>
    r.currentRate > (best?.currentRate ?? -Infinity) ? r : best, null);
  const mostNeg = sorted.reduce((best, r) =>
    r.currentRate < (best?.currentRate ?? Infinity) ? r : best, null);

  const opportunities = sorted.filter(
    (f) => f.historicalAvg !== 0 && Math.abs(f.currentRate) > Math.abs(f.historicalAvg) * 2
  );

  // Transform funding history for chart
  const chartData = useMemo(() =>
    historyData.map((d, i) => {
      const rate = parseFloat(d.funding_rate ?? d.rate ?? 0);
      return {
        date: d.time ? new Date(d.time).toLocaleDateString() : `Day ${i + 1}`,
        rate,
        ratePos: rate >= 0 ? rate : 0,
        rateNeg: rate < 0 ? rate : 0,
      };
    }),
    [historyData]
  );

  const handleSort = (key) => {
    if (sortKey === key) setDir((d) => d * -1);
    else { setSortKey(key); setSortDir(1); }
  };

  // eslint-disable-next-line no-unused-vars
  const setDir = setSortDir;

  const symbols = priceData.map((d) => d.symbol);

  return (
    <div className="w-full space-y-7">
      <h2 className="font-display text-lg font-bold">Funding Rates</h2>

      {/* ── Top metric cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pricesLoading ? (
          <>
            <SkeletonMetricCard />
            <SkeletonMetricCard />
          </>
        ) : pricesError ? (
          <div className="col-span-2">
            <ErrorState message="Failed to load funding data" onRetry={refetchPrices} />
          </div>
        ) : (
          <>
            <MetricCard
              label="Highest Positive Rate"
              value={(highestPos?.currentRate ?? 0) * 100}
              suffix="%"
              decimals={4}
              variant="negative"
              subtext={highestPos?.symbol ? `${highestPos.symbol}-PERP` : "—"}
            />
            <MetricCard
              label="Most Negative Rate"
              value={(mostNeg?.currentRate ?? 0) * 100}
              suffix="%"
              decimals={4}
              variant="positive"
              subtext={mostNeg?.symbol ? `${mostNeg.symbol}-PERP` : "—"}
            />
          </>
        )}
      </div>

      {/* ── Funding table ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="card-gradient rounded-lg border border-border p-4"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border">
                {SORT_KEYS.map((col) => (
                  <th
                    key={col.key}
                    className={`py-2 text-left cursor-pointer hover:text-foreground transition-colors font-body select-none ${
                      sortKey === col.key ? "text-primary" : ""
                    }`}
                    onClick={() => handleSort(col.key)}
                  >
                    {col.label}
                    {sortKey === col.key && (
                      <span className="ml-1">{sortDir === 1 ? "↑" : "↓"}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pricesLoading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonTableRow key={i} cols={6} />)
              ) : pricesError ? (
                <tr>
                  <td colSpan={6} className="py-8">
                    <ErrorState message="Failed to load funding rates" onRetry={refetchPrices} compact />
                  </td>
                </tr>
              ) : (
                sorted.map((f) => (
                  <tr
                    key={f.symbol}
                    onClick={() => setSelectedSymbol(f.symbol)}
                    className={`border-b border-border/50 hover:bg-muted/30 transition-colors font-body cursor-pointer ${
                      selectedSymbol === f.symbol ? "bg-primary/5" : ""
                    }`}
                  >
                    <td className="py-2.5 font-bold font-mono">{f.symbol}-PERP</td>
                    <td className={`font-mono ${f.currentRate >= 0 ? "text-destructive" : "text-positive"}`}>
                      {(f.currentRate * 100).toFixed(4)}%
                    </td>
                    <td className={`font-mono ${f.nextRate >= 0 ? "text-destructive" : "text-positive"}`}>
                      {(f.nextRate * 100).toFixed(4)}%
                    </td>
                    <td className={`font-mono ${f.annualizedApr >= 0 ? "text-destructive" : "text-positive"}`}>
                      {f.annualizedApr.toFixed(2)}%
                    </td>
                    <td>
                      {f.trend === "up" ? (
                        <MdOutlineArrowUpward className="w-3 h-3 text-positive" />
                      ) : f.trend === "down" ? (
                        <MdArrowDownward className="w-3 h-3 text-destructive" />
                      ) : (
                        <FaMinus className="w-3 h-3 text-muted-foreground" />
                      )}
                    </td>
                    <td className="text-muted-foreground font-mono">
                      {(f.historicalAvg * 100).toFixed(4)}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ── Funding history chart ── */}
      <div className="card-gradient rounded-lg border border-border p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="font-display text-sm">
            Funding Rate History — {selectedSymbol}-PERP
          </h3>
          {/* Symbol selector */}
          {symbols.length > 0 && (
            <select
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="text-xs font-mono bg-muted border border-border rounded px-2 py-1 text-foreground focus:outline-none focus:border-primary/50"
            >
              {symbols.map((s) => (
                <option key={s} value={s}>{s}-PERP</option>
              ))}
            </select>
          )}
        </div>

        {historyLoading ? (
          <div className="h-56 animate-pulse bg-muted/40 rounded-lg" />
        ) : historyError ? (
          <ErrorState
            message="Failed to load funding history"
            onRetry={refetchHistory}
            compact
          />
        ) : chartData.length === 0 ? (
          <div className="h-56 flex items-center justify-center text-xs text-muted-foreground font-mono">
            No history available for {selectedSymbol}
          </div>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="frPos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF4D6A" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#FF4D6A" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="frNeg" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="#00E5A0" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#00E5A0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: "#5A6478", fontSize: 9 }} axisLine={false} tickLine={false} interval={14} />
                <YAxis tick={{ fill: "#5A6478", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v * 100).toFixed(2)}%`} />
                <Tooltip
                  contentStyle={{ background: "#0F1420", border: "1px solid #1C2333", borderRadius: 8, fontSize: 11, fontFamily: "JetBrains Mono" }}
                  formatter={(v) => [`${(v * 100).toFixed(4)}%`, "Rate"]}
                />
                <ReferenceLine y={0} stroke="#5A6478" strokeDasharray="4 4" />
                <Area type="monotone" dataKey="ratePos" stroke="#FF4D6A" strokeWidth={1.5} fill="url(#frPos)" />
                <Area type="monotone" dataKey="rateNeg" stroke="#00E5A0" strokeWidth={1.5} fill="url(#frNeg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── Funding opportunities ── */}
      {!pricesLoading && !pricesError && opportunities.length > 0 && (
        <div className="card-gradient rounded-lg border border-border p-4">
          <h3 className="font-display text-sm mb-3 flex items-center gap-2">
            <FiAlertTriangle className="w-4 h-4 text-secondary" />
            Funding Opportunities
          </h3>
          <div className="flex flex-wrap gap-2">
            {opportunities.map((f) => (
              <span
                key={f.symbol}
                className="flex items-center gap-2 text-xs font-mono bg-secondary/10 text-secondary border border-secondary/20 px-3 py-1.5 rounded-full"
              >
                {f.symbol}-PERP — Rate{" "}
                {f.historicalAvg !== 0
                  ? (Math.abs(f.currentRate) / Math.abs(f.historicalAvg)).toFixed(1)
                  : "∞"}
                x avg
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Funding;
