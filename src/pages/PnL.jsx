import { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { MetricCard } from "../components";
import SkeletonMetricCard from "../components/SkeletonMetricCard";
import SkeletonTableRow from "../components/SkeletonTableRow";
import ErrorState from "../components/ErrorState";
import ConnectWalletGate from "../components/ConnectWalletGate";
import { selectWallet } from "../features/walletSlice";
import {
  useGetTradeHistoryQuery,
  useGetAccountInfoQuery,
} from "../features/pacificaSlice";
import { motion } from "framer-motion";
import {
  Area, AreaChart, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { FaArrowTrendUp } from "react-icons/fa6";
import { FiFilter } from "react-icons/fi";

const PIE_COLORS = ["#00E5A0", "#FF4D6A"];
const TIME_RANGES = ["7D", "30D", "90D", "All"];

// ── helpers ────────────────────────────────────────────────────────────────
const fmtDate = (ts) => {
  if (!ts) return "—";
  const d = new Date(Number(ts));
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const fmtTime = (ts) => {
  if (!ts) return "—";
  const d = new Date(Number(ts));
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
};

const toSide = (side) => {
  if (!side) return "LONG";
  const s = side.toLowerCase();
  return s.includes("long") || s.includes("bid") ? "LONG" : "SHORT";
};

const PAGE_SIZE = 10;

// ── PnL content (wallet connected) ────────────────────────────────────────
const isSolanaAddr = (a) => a && !a.startsWith("0x") && a.length >= 32 && a.length <= 44;

const PnLContent = ({ address }) => {
  const [selectedRange, setSelectedRange] = useState("30D");
  if (!isSolanaAddr(address)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-4 gap-3">
        <div className="w-12 h-12 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
          <span className="text-yellow-400 text-xl">⚠</span>
        </div>
        <p className="text-sm font-mono font-bold">Wrong wallet type</p>
        <p className="text-xs text-muted-foreground font-body max-w-xs">
          Pacifica requires a Solana wallet. The connected address appears to be Ethereum (<code className="bg-muted px-1 rounded">{address?.slice(0,8)}…</code>). Please reconnect with Phantom or Solflare.
        </p>
      </div>
    );
  }
  const [sideFilter, setSideFilter] = useState("ALL");
  const [symbolFilter, setSymbolFilter] = useState("ALL");
  const [page, setPage] = useState(0);

  // ── Data fetching ──
  const {
    data: account,
    isLoading: accLoading,
  } = useGetAccountInfoQuery(address, undefined);

  const {
    data: rawTrades = [],
    isLoading: tradesLoading,
    isError: tradesError,
    refetch: refetchTrades,
  } = useGetTradeHistoryQuery({ address, limit: 200 });



  // ── Transform trades ──
  const trades = useMemo(() =>
    rawTrades.map((t, idx) => ({
      id: t.id ?? idx,
      symbol: t.symbol ?? "—",
      side: toSide(t.side),
      size: parseFloat(t.amount ?? t.size ?? 0),
      entry: parseFloat(t.entry_price ?? t.price ?? 0),
      exit: parseFloat(t.exit_price ?? t.fill_price ?? 0),
      pnl: parseFloat(t.realized_pnl ?? t.pnl ?? t.closed_pnl ?? 0),
      fee: parseFloat(t.fee ?? 0),
      timestamp: t.created_at ?? t.timestamp,
    })),
    [rawTrades]
  );

  // ── Derive equity curve from cumulative trade PnL ──
  // Sort trades oldest-first, accumulate pnl, use account balance as baseline
  const accountBalance = parseFloat(account?.balance ?? 0);
  const equityData = useMemo(() => {
    if (!trades.length) return [];
    const sorted = [...trades].sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
    let cumPnl = 0;
    return sorted.map((t) => {
      cumPnl += t.pnl;
      return {
        date: fmtDate(t.timestamp),
        equity: Math.max(0, accountBalance + cumPnl),
      };
    });
  }, [trades, accountBalance]);
  const equityLoading = tradesLoading;
  const equityError = tradesError;
  const refetchEquity = refetchTrades;

  // ── Equity chart with time range filter ──
  const filteredEquity = useMemo(() => {
    if (selectedRange === "7D") return equityData.slice(-7);
    if (selectedRange === "30D") return equityData.slice(-30);
    if (selectedRange === "90D") return equityData.slice(-90);
    return equityData;
  }, [equityData, selectedRange]);

  // ── Summary stats ──
  const wins = trades.filter((t) => t.pnl > 0);
  const losses = trades.filter((t) => t.pnl < 0);
  const totalRealizedPnl = trades.reduce((a, t) => a + t.pnl, 0);
  const unrealizedPnl = parseFloat(account?.unrealized_pnl ?? 0);
  const winRate = trades.length > 0 ? (wins.length / trades.length) * 100 : 0;
  const bestTrade = [...trades].sort((a, b) => b.pnl - a.pnl)[0];
  const worstTrade = [...trades].sort((a, b) => a.pnl - b.pnl)[0];
  const avgWin = wins.length ? wins.reduce((a, t) => a + t.pnl, 0) / wins.length : 0;
  const avgLoss = losses.length ? losses.reduce((a, t) => a + t.pnl, 0) / losses.length : 0;
  const grossProfit = wins.reduce((a, t) => a + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((a, t) => a + t.pnl, 0));
  const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : "∞";
  const totalFees = trades.reduce((a, t) => a + t.fee, 0);

  // Market PnL breakdown
  const marketPnl = trades.reduce((acc, t) => {
    acc[t.symbol] = (acc[t.symbol] ?? 0) + t.pnl;
    return acc;
  }, {});
  const bestMarket = Object.entries(marketPnl).sort((a, b) => b[1] - a[1])[0];
  const worstMarket = Object.entries(marketPnl).sort((a, b) => a[1] - b[1])[0];

  // ── Filtered + paginated trade table ──
  const symbols = [...new Set(trades.map((t) => t.symbol))];
  const displayTrades = useMemo(() => {
    let list = trades;
    if (sideFilter !== "ALL") list = list.filter((t) => t.side === sideFilter);
    if (symbolFilter !== "ALL") list = list.filter((t) => t.symbol === symbolFilter);
    return list;
  }, [trades, sideFilter, symbolFilter]);

  const totalPages = Math.ceil(displayTrades.length / PAGE_SIZE);
  const pageTrades = displayTrades.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const pieData = [
    { name: "Win", value: wins.length },
    { name: "Loss", value: losses.length },
  ];

  return (
    <div className="w-full space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">PnL Dashboard</h2>
        <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
          {address.slice(0, 6)}…{address.slice(-4)}
        </span>
      </div>

      {/* ── Summary metric cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {accLoading || tradesLoading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonMetricCard key={i} />)
        ) : tradesError ? (
          <div className="col-span-5">
            <ErrorState message="Failed to load trade data" onRetry={refetchTrades} />
          </div>
        ) : trades.length === 0 && !tradesLoading ? (
          <div className="col-span-5 p-6 card-gradient rounded-lg border border-border text-center">
            <p className="text-sm font-mono text-muted-foreground mb-1">No trade history found</p>
            <p className="text-xs text-muted-foreground font-body">
              This wallet has no closed trades on Pacifica yet.
            </p>
          </div>
        ) : (
          <>
            <MetricCard
              label="Total Realized PnL"
              value={totalRealizedPnl}
              prefix="$"
              variant={totalRealizedPnl >= 0 ? "positive" : "negative"}
            />
            <MetricCard
              label="Unrealized PnL"
              value={unrealizedPnl}
              prefix="$"
              variant={unrealizedPnl >= 0 ? "positive" : "negative"}
            />
            <MetricCard
              label="Win Rate"
              value={winRate}
              suffix="%"
              decimals={1}
            />
            <MetricCard
              label="Best Trade"
              value={bestTrade?.pnl ?? 0}
              prefix="+$"
              variant="positive"
              subtext={bestTrade?.symbol}
            />
            <MetricCard
              label="Worst Trade"
              value={Math.abs(worstTrade?.pnl ?? 0)}
              prefix="-$"
              variant="negative"
              subtext={worstTrade?.symbol}
            />
          </>
        )}
      </div>

      {/* ── Equity chart ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="card-gradient rounded-lg border border-border p-5"
      >
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="font-display text-sm">Equity Over Time</h3>
          <div className="flex gap-1.5">
            {TIME_RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRange(r)}
                className={`px-3 py-1 rounded-full text-xs font-body border transition-all ${
                  selectedRange === r
                    ? "border-primary text-primary bg-primary/10"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {equityLoading ? (
          <div className="h-64 animate-pulse bg-muted/40 rounded-lg" />
        ) : equityError ? (
          <ErrorState message="Failed to load equity history" onRetry={refetchEquity} compact />
        ) : filteredEquity.length < 2 ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2 text-center">
            <p className="text-xs text-muted-foreground font-mono">No equity history yet</p>
            <p className="text-[10px] text-muted-foreground font-body">Make your first trade to start tracking equity</p>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredEquity}>
                <defs>
                  <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00D4FF" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#00D4FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: "#5A6478", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#5A6478", fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: "#0F1420", border: "1px solid #1C2333", borderRadius: 8, fontSize: 12, fontFamily: "JetBrains Mono" }}
                  formatter={(v) => [`$${v.toLocaleString()}`, "Equity"]}
                />
                <Area type="monotone" dataKey="equity" stroke="#00D4FF" strokeWidth={2} fill="url(#eqGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </motion.div>

      {/* ── Trade table + performance panel ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Trade history — 2 cols */}
        <div className="col-span-2 card-gradient rounded-lg border border-border p-4">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h3 className="font-display text-sm">Trade History</h3>
            <div className="flex items-center gap-2">
              <FiFilter className="w-3 h-3 text-muted-foreground" />
              {/* Side filter */}
              <select
                value={sideFilter}
                onChange={(e) => { setSideFilter(e.target.value); setPage(0); }}
                className="text-[10px] font-mono bg-muted border border-border rounded px-2 py-1 text-foreground focus:outline-none focus:border-primary/50"
              >
                <option value="ALL">All sides</option>
                <option value="LONG">LONG</option>
                <option value="SHORT">SHORT</option>
              </select>
              {/* Symbol filter */}
              <select
                value={symbolFilter}
                onChange={(e) => { setSymbolFilter(e.target.value); setPage(0); }}
                className="text-[10px] font-mono bg-muted border border-border rounded px-2 py-1 text-foreground focus:outline-none focus:border-primary/50"
              >
                <option value="ALL">All symbols</option>
                {symbols.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[540px] text-xs">
              <thead>
                <tr className="text-muted-foreground border-b border-border font-body">
                  <th className="py-2 text-left">Time</th>
                  <th className="text-left">Symbol</th>
                  <th className="text-left">Side</th>
                  <th className="text-right">Size</th>
                  <th className="text-right">Entry</th>
                  <th className="text-right">Exit</th>
                  <th className="text-right">PnL</th>
                </tr>
              </thead>
              <tbody>
                {tradesLoading ? (
                  Array.from({ length: PAGE_SIZE }).map((_, i) => (
                    <SkeletonTableRow key={i} cols={7} />
                  ))
                ) : tradesError ? (
                  <tr>
                    <td colSpan={7} className="py-8">
                      <ErrorState message="Failed to load trades" onRetry={refetchTrades} compact />
                    </td>
                  </tr>
                ) : pageTrades.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center">
                      <p className="text-xs text-muted-foreground font-mono mb-1">No trades found</p>
                      <p className="text-[10px] text-muted-foreground font-body">
                        {sideFilter !== "ALL" || symbolFilter !== "ALL"
                          ? "Try clearing the filters above"
                          : "This wallet has no trade history on Pacifica yet"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  pageTrades.map((t) => (
                    <tr key={t.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors font-body">
                      <td className="py-2 text-muted-foreground font-mono text-[10px] whitespace-nowrap">
                        {fmtTime(t.timestamp)}
                      </td>
                      <td className="font-mono whitespace-nowrap">{t.symbol}</td>
                      <td className="whitespace-nowrap">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          t.side === "LONG"
                            ? "bg-positive/15 text-positive"
                            : "bg-destructive/15 text-destructive"
                        }`}>
                          {t.side}
                        </span>
                      </td>
                      <td className="text-right font-mono whitespace-nowrap">
                        {t.size.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                      </td>
                      <td className="text-right font-mono whitespace-nowrap">
                        {t.entry > 0 ? `$${t.entry.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "—"}
                      </td>
                      <td className="text-right font-mono whitespace-nowrap">
                        {t.exit > 0 ? `$${t.exit.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "—"}
                      </td>
                      <td className={`text-right font-bold font-mono whitespace-nowrap ${
                        t.pnl >= 0 ? "text-positive" : "text-destructive"
                      }`}>
                        {t.pnl >= 0 ? "+" : ""}${t.pnl.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-3 text-xs font-mono text-muted-foreground">
              <span>{displayTrades.length} total trades</span>
              <div className="flex gap-2">
                <button
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-2 py-1 rounded border border-border hover:border-primary/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ← Prev
                </button>
                <span className="px-2 py-1">
                  {page + 1} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-2 py-1 rounded border border-border hover:border-primary/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Performance panel — 1 col */}
        <div className="card-gradient rounded-lg border border-border p-4 space-y-4">
          <h3 className="font-display text-sm">Performance</h3>

          {tradesLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex justify-between animate-pulse">
                  <div className="w-20 h-2.5 rounded bg-muted" />
                  <div className="w-16 h-2.5 rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3 text-xs font-body">
              {[
                { label: "Avg Win", value: `$${avgWin.toFixed(2)}`, color: "text-positive" },
                { label: "Avg Loss", value: `$${avgLoss.toFixed(2)}`, color: "text-destructive" },
                { label: "Profit Factor", value: profitFactor, color: "" },
                { label: "Total Fees", value: `$${totalFees.toFixed(2)}`, color: "" },
                { label: "Best Market", value: bestMarket?.[0] ?? "—", color: "text-positive" },
                { label: "Worst Market", value: worstMarket?.[0] ?? "—", color: "text-destructive" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-muted-foreground">{label}</span>
                  <span className={`font-mono ${color}`}>{value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Win/Loss donut */}
          {!tradesLoading && trades.length > 0 && (
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value" stroke="none">
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#0F1420", border: "1px solid #1C2333", borderRadius: 8, fontSize: 11 }}
                    formatter={(v, name) => [v, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 text-[10px] font-body">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-positive" />
                  Wins ({wins.length})
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-destructive" />
                  Losses ({losses.length})
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── exported page ──────────────────────────────────────────────────────────
const PnL = () => {
  const { address, connected } = useSelector(selectWallet);

  return (
    <ConnectWalletGate icon={FaArrowTrendUp} title="trade history and PnL">
      {connected && <PnLContent address={address} />}
    </ConnectWalletGate>
  );
};

export default PnL;
