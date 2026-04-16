import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { CountUp } from "../components";
import { BsPlus } from "react-icons/bs";
import { FiX, FiBell, FiVolumeX, FiVolume2 } from "react-icons/fi";
import { LuShield } from "react-icons/lu";
import { selectWallet } from "../features/walletSlice";
import {
  useGetAccountInfoQuery,
  useGetPositionsQuery,
  useGetMarketPricesQuery,
} from "../features/pacificaSlice";
import ConnectWalletGate from "../components/ConnectWalletGate";
import SkeletonCard from "../components/SkeletonCard";
import SkeletonMetricCard from "../components/SkeletonMetricCard";
import ErrorState from "../components/ErrorState";

const STORAGE_KEY = "pacdash_alerts_v1";
const isSolanaAddr = (a) => a && !a.startsWith("0x") && a.length >= 32 && a.length <= 44;

// ── Web Audio pop sound ───────────────────────────────────────────────────
const playAlertSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [880, 660].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
      gain.gain.setValueAtTime(0.5, ctx.currentTime + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.2);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.22);
    });
  } catch (_) {}
};

// ── Persistent alert hook — survives page reloads via localStorage ────────
const useAlerts = (marginHealth) => {
  const [alerts, setAlertsRaw] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ symbol: "", threshold: "" });
  const [formErr, setFormErr] = useState("");
  const [muted, setMuted] = useState(false);
  const firedRef = useRef(new Set());

  // Every change persists to localStorage immediately
  const setAlerts = useCallback((updater) => {
    setAlertsRaw((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch (_) {}
      return next;
    });
  }, []);

  // Auto-check thresholds whenever marginHealth changes
  useEffect(() => {
    if (marginHealth === 0) return;
    setAlerts((prev) =>
      prev.map((alert) => {
        const threshold = parseFloat(alert.threshold ?? 0);
        const breached = marginHealth < threshold;
        const alreadyFired = firedRef.current.has(alert.id);

        if (breached && alert.status === "Active") {
          if (!alreadyFired && !muted) {
            playAlertSound();
            firedRef.current.add(alert.id);
          }
          return { ...alert, status: "Triggered" };
        }
        // Auto-reset to Active when margin recovers above threshold
        if (!breached && alert.status === "Triggered") {
          firedRef.current.delete(alert.id);
          return { ...alert, status: "Active" };
        }
        return alert;
      })
    );
  }, [marginHealth, muted, setAlerts]);

  const addAlert = () => {
    if (!form.symbol || !form.threshold) { setFormErr("Both fields required."); return; }
    const threshold = parseFloat(form.threshold);
    if (isNaN(threshold) || threshold <= 0 || threshold > 100) {
      setFormErr("Threshold must be 1–100."); return;
    }
    setAlerts((prev) => [
      ...prev,
      {
        id: Date.now(),
        symbol: form.symbol.toUpperCase(),
        threshold,
        condition: `Margin < ${threshold}%`,
        status: "Active",
      },
    ]);
    setForm({ symbol: "", threshold: "" });
    setFormErr("");
    setShowForm(false);
  };

  const removeAlert = (id) => {
    firedRef.current.delete(id);
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  return { alerts, showForm, setShowForm, form, setForm, formErr, addAlert, removeAlert, muted, setMuted };
};

// ── Position card ─────────────────────────────────────────────────────────
const PositionCard = ({ p, i, priceMap = {} }) => {
  const entryPrice = parseFloat(p.entry_price ?? p.entryPrice ?? 0);
  const priceInfo = priceMap[p.symbol] ?? {};
  const markPrice = parseFloat(priceInfo.mark ?? p.mark_price ?? p.markPrice ?? 0);
  const leverageNum = parseFloat(p.leverage ?? priceInfo.max_leverage ?? 10);
  const leverage = p.leverage ?? p.max_leverage ?? "—";
  const side = ((p.side ?? "").toLowerCase() === "bid" || (p.side ?? "").toLowerCase().includes("long")) ? "LONG" : "SHORT";
  const liqEstimate = side === "LONG"
    ? entryPrice * (1 - 1 / leverageNum * 0.9)
    : entryPrice * (1 + 1 / leverageNum * 0.9);
  const liqPrice = parseFloat(p.liquidation_price ?? p.liquidationPrice ?? liqEstimate);
  const size = parseFloat(p.size ?? p.amount ?? 0);
  const unrealizedPnl = parseFloat(p.unrealized_pnl ?? p.unrealizedPnl ?? 0);
  const marginType = (p.margin_type ?? p.marginType ?? "CROSS").toUpperCase();
  const symbol = p.symbol ?? "—";

  const liqDist =
    markPrice > 0 && liqPrice > 0
      ? Math.abs(((markPrice - liqPrice) / markPrice) * 100)
      : 0;
  const dangerClass = liqDist < 15 ? "bg-destructive" : liqDist < 30 ? "bg-yellow-400" : "bg-positive";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.07 }}
      className="card-gradient rounded-lg border border-border p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-display text-sm font-bold">{symbol}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
            side === "LONG" ? "bg-positive/15 text-positive" : "bg-destructive/15 text-destructive"
          }`}>{side}</span>
        </div>
        <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{leverage}x</span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs font-body">
        <div>
          <span className="text-muted-foreground">Entry</span>
          <p className="font-mono">{entryPrice >= 1 ? `$${entryPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : `$${entryPrice.toFixed(6)}`}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Mark</span>
          <p className="font-mono text-primary">{markPrice >= 1 ? `$${markPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : `$${markPrice.toFixed(6)}`}</p>
        </div>
      </div>

      <div>
        <span className="text-[10px] text-muted-foreground font-body">Liq Price</span>
        <p className="font-mono text-sm font-bold text-destructive">
          {liqPrice >= 1 ? `$${liqPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : `$${liqPrice.toFixed(6)}`}
        </p>
      </div>

      <div>
        <div className="flex justify-between text-[10px] text-muted-foreground mb-1 font-body">
          <span>Distance to Liq</span>
          <span className="font-mono">{liqDist.toFixed(1)}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${dangerClass}`}
            style={{ width: `${Math.min(liqDist, 100)}%` }} />
        </div>
      </div>

      <div className="flex justify-between items-center text-xs font-body">
        <span className={`font-mono font-bold ${unrealizedPnl >= 0 ? "text-positive" : "text-destructive"}`}>
          {unrealizedPnl >= 0 ? "+" : ""}${Math.abs(unrealizedPnl).toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </span>
        <span className="text-muted-foreground bg-muted px-1.5 py-0.5 rounded text-[10px]">{marginType}</span>
      </div>

      {size > 0 && (
        <div className="text-[10px] text-muted-foreground font-mono">
          Size: {size.toLocaleString()} tokens
        </div>
      )}
    </motion.div>
  );
};

// ── RiskContent — all hooks called unconditionally at the top ─────────────
const RiskContent = ({ address }) => {
  // ── ALL HOOKS FIRST — no early returns before hooks (React rules) ─────
  const { data: account, isLoading: accLoading, isError: accError, refetch: refetchAcc } =
    useGetAccountInfoQuery(address, undefined);

  const { data: positions = [], isLoading: posLoading, isError: posError, refetch: refetchPos } =
    useGetPositionsQuery(address, undefined);

  const { data: priceData = [] } = useGetMarketPricesQuery(undefined, undefined);

  const priceMap = useMemo(
    () => Object.fromEntries(priceData.map((d) => [d.symbol, d])),
    [priceData]
  );

  const equity = parseFloat(account?.account_equity ?? 0);
  const marginUsed = parseFloat(account?.total_margin_used ?? 0);
  const available = parseFloat(account?.available_to_spend ?? 0);
  const crossMmr = parseFloat(account?.cross_mmr ?? 0);
  const balance = parseFloat(account?.balance ?? 0);
  const marginHealth = equity > 0 ? Math.min(Math.round(((equity - marginUsed) / equity) * 100), 100) : 0;

  const { alerts, showForm, setShowForm, form, setForm, formErr, addAlert, removeAlert, muted, setMuted } =
    useAlerts(marginHealth);

  const healthColor = marginHealth > 60 ? "text-positive" : marginHealth > 30 ? "text-yellow-400" : "text-destructive";
  const ringColor = marginHealth > 60 ? "#00E5A0" : marginHealth > 30 ? "#FBBF24" : "#FF4D6A";

  // ── Guard AFTER hooks ─────────────────────────────────────────────────
  if (!isSolanaAddr(address)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-4 gap-3">
        <div className="w-12 h-12 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
          <span className="text-yellow-400 text-xl">⚠</span>
        </div>
        <p className="text-sm font-mono font-bold">Wrong wallet type</p>
        <p className="text-xs text-muted-foreground font-body max-w-xs">
          Pacifica requires a Solana address. Disconnect and reconnect with Phantom or Solflare.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">Risk Monitor</h2>
        <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
          {address.slice(0, 6)}…{address.slice(-4)}
        </span>
      </div>

      {/* ── Portfolio health ── */}
      {accLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonMetricCard key={i} />)}
        </div>
      ) : accError ? (
        <div className="card-gradient rounded-lg border border-border p-6 text-center">
          <p className="text-sm font-mono text-muted-foreground mb-1">No account found</p>
          <p className="text-xs text-muted-foreground font-body mb-3">
            This wallet hasn&apos;t deposited to Pacifica yet.
          </p>
          <a href="https://test-app.pacifica.fi" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-body border border-primary text-primary px-4 py-2 rounded-lg hover:bg-primary/10 transition-colors">
            Open Pacifica Testnet ↗
          </a>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className={`card-gradient rounded-lg border p-6 ${
            marginHealth < 30 ? "border-destructive/50 shadow-[0_0_20px_hsl(348_100%_65%/0.12)]" : "border-border"
          }`}>
          <div className="flex items-center flex-col md:flex-row gap-8">
            <div className="relative w-28 h-28 shrink-0">
              <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(220 25% 16%)" strokeWidth="6" />
                <circle cx="50" cy="50" r="42" fill="none" stroke={ringColor} strokeWidth="6"
                  strokeDasharray={`${marginHealth * 2.64} 264`} strokeLinecap="round"
                  className="transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`font-mono text-2xl font-bold ${healthColor}`}>
                  <CountUp end={marginHealth} decimals={0} suffix="%" />
                </span>
              </div>
            </div>
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Balance", value: `$${balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, color: "" },
                { label: "Margin Used", value: `$${marginUsed.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, color: "" },
                { label: "Available", value: `$${available.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, color: "text-positive" },
                { label: "Cross MMR", value: `${crossMmr.toFixed(2)}%`, color: crossMmr < 5 ? "text-destructive" : "" },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <p className="text-xs text-muted-foreground font-body uppercase tracking-wider">{label}</p>
                  <p className={`font-mono text-base font-bold ${color}`}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Positions ── */}
      <div>
        <h3 className="font-display text-sm font-bold mb-4">
          Open Positions
          {!posLoading && !posError && (
            <span className="font-mono text-xs text-muted-foreground ml-1">({positions.length})</span>
          )}
        </h3>
        {posLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : posError ? (
          <ErrorState message="Failed to load positions" onRetry={refetchPos} />
        ) : positions.length === 0 ? (
          <div className="card-gradient rounded-lg border border-border p-8 text-center">
            <LuShield className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-mono text-muted-foreground mb-1">No open positions</p>
            <p className="text-xs text-muted-foreground font-body">Open a trade on Pacifica to see your positions here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {positions.map((p, i) => (
              <PositionCard key={p.symbol ?? i} p={p} i={i} priceMap={priceMap} />
            ))}
          </div>
        )}
      </div>

      {/* ── Alert panel ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="card-gradient rounded-lg border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-sm font-bold flex items-center gap-2">
            <FiBell className="w-4 h-4 text-secondary" />
            Active Alerts
            {alerts.filter(a => a.status === "Triggered").length > 0 && (
              <span className="text-[9px] font-mono bg-destructive/20 text-destructive px-1.5 py-0.5 rounded-full animate-pulse">
                {alerts.filter(a => a.status === "Triggered").length} triggered
              </span>
            )}
          </h3>
          <div className="flex items-center gap-2">
            {/* Mute toggle */}
            <button onClick={() => setMuted(m => !m)}
              title={muted ? "Unmute alerts" : "Mute alerts"}
              className={`p-1.5 rounded transition-colors ${muted ? "text-muted-foreground hover:text-foreground" : "text-secondary hover:text-secondary/70"}`}>
              {muted ? <FiVolumeX className="w-3.5 h-3.5" /> : <FiVolume2 className="w-3.5 h-3.5" />}
            </button>
            <button onClick={() => setShowForm(v => !v)}
              className="flex items-center gap-1.5 text-xs font-body font-medium border border-primary text-primary px-3 py-1.5 rounded-md hover:bg-primary/10 transition-colors">
              <BsPlus className="w-3.5 h-3.5" /> Add Alert
            </button>
          </div>
        </div>

        {/* Add alert form */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-4">
              <div className="flex flex-wrap gap-2 p-3 bg-muted/40 rounded-lg border border-border">
                <input type="text" placeholder="Symbol (e.g. BTC)" value={form.symbol}
                  onChange={(e) => setForm(f => ({ ...f, symbol: e.target.value }))}
                  className="flex-1 min-w-28 px-3 py-1.5 text-xs font-mono rounded bg-muted border border-border text-foreground focus:outline-none focus:border-primary/50" />
                <input type="number" placeholder="Margin threshold %" value={form.threshold}
                  onChange={(e) => setForm(f => ({ ...f, threshold: e.target.value }))}
                  className="flex-1 min-w-28 px-3 py-1.5 text-xs font-mono rounded bg-muted border border-border text-foreground focus:outline-none focus:border-primary/50" />
                <button onClick={addAlert}
                  className="px-4 py-1.5 text-xs font-body bg-primary/10 border border-primary text-primary rounded hover:bg-primary/20 transition-colors">
                  Save
                </button>
              </div>
              {formErr && <p className="text-xs text-destructive font-mono mt-1">{formErr}</p>}
            </motion.div>
          )}
        </AnimatePresence>

        <table className="w-full text-xs">
          <thead>
            <tr className="text-muted-foreground border-b border-border font-body">
              <th className="py-2 text-left">Symbol</th>
              <th className="text-left">Condition</th>
              <th className="text-right">Status</th>
              <th className="w-6" />
            </tr>
          </thead>
          <tbody>
            {alerts.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-xs text-muted-foreground font-mono">
                  No alerts set — add one to get notified when margin drops
                </td>
              </tr>
            ) : (
              alerts.map((alert) => (
                <tr key={alert.id} className="border-b border-border/50 font-body">
                  <td className="py-2.5 font-mono font-bold">{alert.symbol}</td>
                  <td className="text-muted-foreground">{alert.condition}</td>
                  <td className="text-right">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      alert.status === "Triggered"
                        ? "bg-destructive/15 text-destructive animate-pulse"
                        : "bg-positive/15 text-positive"
                    }`}>
                      {alert.status === "Triggered" && "🔔 "}
                      {alert.status}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => removeAlert(alert.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors ml-2">
                      <FiX className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {muted && (
          <p className="text-[10px] font-mono text-muted-foreground mt-2 flex items-center gap-1">
            <FiVolumeX className="w-3 h-3" /> Alert sounds are muted
          </p>
        )}
      </motion.div>
    </div>
  );
};

// ── exported page ─────────────────────────────────────────────────────────
const Risk = () => {
  const { address, connected } = useSelector(selectWallet);
  return (
    <ConnectWalletGate icon={LuShield} title="positions and risk metrics">
      {connected && <RiskContent address={address} />}
    </ConnectWalletGate>
  );
};

export default Risk;
