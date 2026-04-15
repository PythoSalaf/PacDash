import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { IoWifiOutline, IoMenu } from "react-icons/io5";
import { IoMdClose } from "react-icons/io";
import { FiDollarSign, FiLogOut, FiRefreshCw } from "react-icons/fi";
import { disconnectWallet, selectWallet } from "../features/walletSlice";
import { triggerRefresh, selectLastRefreshed } from "../features/refreshSlice";
import { pacificaApi } from "../features/pacificaSlice";
import { elfaApi } from "../features/elfaSlice";
import { BsGlobe } from "react-icons/bs";
import { FaAnchor, FaArrowTrendUp } from "react-icons/fa6";
import { LuShield } from "react-icons/lu";
import { Link } from "react-router";

const Navbar = () => {
  const dispatch = useDispatch();
  const { address } = useSelector(selectWallet);
  const lastRefreshed = useSelector(selectLastRefreshed);

  const { publicKey, connected, disconnect } = useWallet();
  const { setVisible } = useWalletModal();

  const [menuOpen, setMenuOpen] = useState(false);
  const [time, setTime] = useState(new Date());
  const [spinning, setSpinning] = useState(false);

  const displayAddr = address ?? publicKey?.toBase58();
  const truncAddr = (a) => (a ? `${a.slice(0, 4)}…${a.slice(-4)}` : "");
  const navItem = [
    { id: "/", label: "Markets", icon: BsGlobe },
    { id: "pnl", label: "PnL", icon: FaArrowTrendUp },
    { id: "risk", label: "Risk", icon: LuShield },
    { id: "whale-feed", label: "Whale Feed", icon: FaAnchor },
    { id: "funding", label: "Funding", icon: FiDollarSign },
  ];

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleRefresh = useCallback(() => {
    setSpinning(true);
    dispatch(
      pacificaApi.util.invalidateTags([
        "MarketInfo",
        "MarketPrices",
        "CandleData",
        "FundingRateHistory",
        "RecentTrades",
        "AccountInfo",
        "Positions",
        "TradeHistory",
      ]),
    );
    dispatch(
      elfaApi.util.invalidateTags([
        "TrendingTokens",
        "TokenNews",
        "TopMentions",
        "TrendingCAs",
        "EventSummary",
      ]),
    );
    dispatch(triggerRefresh());
    setTimeout(() => setSpinning(false), 800);
  }, [dispatch]);

  const sinceRefresh = lastRefreshed
    ? (() => {
        const s = Math.floor((Date.now() - lastRefreshed) / 1000);
        if (s < 60) return `${s}s ago`;
        return `${Math.floor(s / 60)}m ago`;
      })()
    : null;

  const handleDisconnect = async () => {
    await disconnect();
    dispatch(disconnectWallet());
  };

  return (
    <header className="flex items-center justify-between px-3 md:px-6 border-b h-14 border-border bg-card shrink-0">
      <div className="flex items-center gap-3">
        <h1 className="text-lg md:text-xl font-bold font-display text-primary glow-cyan">
          PacDash
        </h1>
        <span className="hidden md:block text-xs text-muted-foreground font-mono">
          Powered by Pacifica
        </span>
      </div>

      <div className="hidden md:flex items-center gap-3">
        {connected && displayAddr ? (
          <span className="px-2 py-1 font-mono text-xs rounded text-primary bg-primary/10 border border-primary/20">
            {truncAddr(displayAddr)}
          </span>
        ) : (
          <span className="px-2 py-1 font-mono text-xs rounded text-muted-foreground bg-muted">
            Not connected
          </span>
        )}
        <span className="flex items-center gap-1 px-2 py-1 text-xs rounded-full font-body text-positive bg-positive/10">
          <IoWifiOutline className="w-3 h-3" /> Solana
        </span>
      </div>

      <div className="hidden md:flex items-center gap-3">
        <span className="font-mono text-xs text-muted-foreground">
          {time.toLocaleTimeString()} UTC
        </span>

        <button
          onClick={handleRefresh}
          title={
            sinceRefresh ? `Last refreshed ${sinceRefresh}` : "Refresh all data"
          }
          className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground border border-border hover:border-primary/40 px-2.5 py-1.5 rounded-lg transition-colors"
        >
          <FiRefreshCw
            className={`w-3.5 h-3.5 ${spinning ? "animate-spin" : ""}`}
          />
          {sinceRefresh ?? "Refresh"}
        </button>

        {connected ? (
          <button
            onClick={handleDisconnect}
            className="flex items-center gap-1.5 text-xs font-body border border-destructive/40 text-destructive/80 px-3 py-1.5 rounded-xl hover:bg-destructive/10 transition-colors"
          >
            <FiLogOut className="w-3 h-3" /> Disconnect
          </button>
        ) : (
          <button
            onClick={() => setVisible(true)}
            className="text-xs font-body border border-primary text-primary px-3 py-1.5 rounded-xl hover:bg-primary/10 transition-colors"
          >
            Connect Wallet
          </button>
        )}
      </div>

      <div
        className="block md:hidden text-white"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        {menuOpen ? (
          <IoMdClose className="w-6 h-6" />
        ) : (
          <IoMenu className="w-6 h-6" />
        )}
      </div>
      {menuOpen && (
        <div className="absolute top-14 left-0 right-0 bg-card  p-4 flex flex-col gap-3 w-full z-10">
          <div className="flex items-start flex-col gap-y-4 text-white mb-5">
            {navItem.map((item) => (
              <Link
                key={item.id}
                to={item.id}
                className="border-b pb-3 w-full"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {item.label}
              </Link>
            ))}
          </div>
          {connected && displayAddr ? (
            <span className="px-2 py-1 font-mono text-xs rounded text-primary bg-primary/10 border border-primary/20">
              {truncAddr(displayAddr)}
            </span>
          ) : (
            <span className="px-2 py-1 font-mono text-xs rounded text-muted-foreground bg-muted">
              Not connected
            </span>
          )}
          <div className="">
            {connected ? (
              <button
                onClick={handleDisconnect}
                className="flex items-center gap-1.5 text-xs font-body my-3 border border-destructive/40 text-destructive/80 px-3 py-1.5 rounded-xl hover:bg-destructive/10 transition-colors w-full"
              >
                <FiLogOut className="w-3 h-3" /> Disconnect
              </button>
            ) : (
              <button
                onClick={() => setVisible(true)}
                className="text-xs font-body border w-full my-3 border-primary text-primary px-3 py-1.5 rounded-xl hover:bg-primary/10 transition-colors"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
