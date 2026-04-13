import { motion, AnimatePresence } from "framer-motion";
import { HiSparkles } from "react-icons/hi2";
import {
  FiTrendingUp,
  FiAlertCircle,
  FiChevronDown,
  FiChevronUp,
  FiExternalLink,
  FiRadio,
} from "react-icons/fi";
import { useState } from "react";
import {
  useGetTrendingTokensQuery,
  useGetTokenNewsQuery,
  useGetTopMentionsQuery,
  useGetEventSummaryQuery,
} from "../features/elfaSlice";

const ELFA_ENABLED = !!import.meta.env.VITE_ELFA_API_KEY;

const timeAgoShort = (dateStr) => {
  if (!dateStr) return "";
  const s = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};
// Keywords that strongly indicate a crypto/Web3 article
const CRYPTO_KEYWORDS = [
  "bitcoin",
  "btc",
  "ethereum",
  "eth",
  "solana",
  "sol",
  "crypto",
  "blockchain",
  "defi",
  "nft",
  "token",
  "altcoin",
  "web3",
  "dex",
  "cefi",
  "stablecoin",
  "usdc",
  "usdt",
  "trading",
  "perpetual",
  "perp",
  "futures",
  "leverage",
  "liquidation",
  "funding",
  "coinbase",
  "binance",
  "opensea",
  "uniswap",
  "aave",
  "compound",
  "dao",
  "yield",
  "staking",
  "mining",
  "wallet",
  "metamask",
  "phantom",
  "ledger",
  "airdrop",
  "memecoin",
  "doge",
  "shib",
  "pepe",
  "wif",
  "pump",
  "market cap",
  "on-chain",
  "layer2",
  "l2",
  "zk",
  "rollup",
  "bridge",
  "swap",
  "liquidity",
  "amm",
  "tvl",
  "price",
  "rally",
  "bullish",
  "bearish",
  "dump",
  "moon",
  "ath",
  "correction",
  "pacifica",
  "hyperliquid",
  "drift",
  "jupiter",
  "raydium",
  "orca",
];

const isCryptoNews = (item) => {
  const text = [
    item.title,
    item.headline,
    item.content,
    item.summary,
    item.source,
    item.domain,
    item.publisher,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return CRYPTO_KEYWORDS.some((kw) => text.includes(kw));
};

// ── HOT badge used on market cards & whale feed rows ──────────────────────
export const TrendingBadge = ({ symbol }) => {
  const { data: tokens = [] } = useGetTrendingTokensQuery(
    { timeWindow: "24h", pageSize: 30 },
    { skip: !ELFA_ENABLED },
  );
  const isTrending = tokens.some(
    (t) => (t.token ?? "").toUpperCase() === symbol.toUpperCase(),
  );
  if (!isTrending) return null;
  return (
    <span className="flex items-center gap-1 bg-secondary/15 border border-secondary/30 text-secondary text-[9px] font-mono px-1.5 py-0.5 rounded-full">
      <FiTrendingUp className="w-2.5 h-2.5" />
      HOT
    </span>
  );
};

// ── Social buzz slide-over for a single token (click on market card) ──────
export const SocialBuzzPanel = ({ symbol, onClose }) => {
  const { data: mentions = [], isLoading: mLoading } = useGetTopMentionsQuery(
    { ticker: symbol, timeWindow: "24h", limit: 5 },
    { skip: !ELFA_ENABLED || !symbol },
  );
  const { data: summary, isLoading: sLoading } = useGetEventSummaryQuery(
    { keywords: symbol, timeWindow: "24h" },
    { skip: !ELFA_ENABLED || !symbol },
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      className="fixed right-0 top-14 h-[calc(100vh-56px)] w-80 bg-card border-l border-border shadow-xl z-40 flex flex-col overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <HiSparkles className="w-4 h-4 text-secondary" />
          <span className="text-sm font-bold font-display">{symbol}</span>
          <span className="text-[9px] font-mono bg-secondary/15 text-secondary px-1.5 py-0.5 rounded-full border border-secondary/20">
            Social Buzz
          </span>
        </div>
        <button
          onClick={onClose}
          className="font-mono text-xs text-muted-foreground hover:text-foreground"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 p-4 space-y-5 overflow-y-auto">
        {/* AI Event Summary */}
        <div>
          <p className="text-[10px] text-muted-foreground font-body uppercase tracking-wider mb-2">
            What&apos;s happening
          </p>
          {sLoading ? (
            <div className="space-y-2">
              {[80, 95, 70].map((w, i) => (
                <div
                  key={i}
                  className={`h-2.5 rounded bg-muted animate-pulse`}
                  style={{ width: `${w}%` }}
                />
              ))}
            </div>
          ) : summary ? (
            <p className="text-xs leading-relaxed font-body text-foreground">
              {summary}
            </p>
          ) : (
            <p className="font-mono text-xs italic text-muted-foreground">
              No summary available
            </p>
          )}
        </div>

        {/* Top Mentions */}
        <div>
          <p className="text-[10px] text-muted-foreground font-body uppercase tracking-wider mb-2">
            Top Mentions (24h)
          </p>
          {mLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse space-y-1.5">
                  <div className="w-24 h-2.5 rounded bg-muted" />
                  <div className="w-full h-2 rounded bg-muted/60" />
                </div>
              ))}
            </div>
          ) : mentions.length === 0 ? (
            <p className="font-mono text-xs text-muted-foreground">
              No top mentions found
            </p>
          ) : (
            <div className="space-y-3">
              {mentions.map((m, i) => (
                <div
                  key={m.tweetId ?? i}
                  className="border border-border/50 rounded-lg p-2.5 space-y-1.5 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-primary">
                      @{m.account?.username ?? "unknown"}
                      {m.account?.isVerified && (
                        <span className="ml-1 text-[8px] text-secondary">
                          ✓
                        </span>
                      )}
                    </span>
                    <span className="text-[9px] text-muted-foreground font-mono">
                      {timeAgoShort(m.mentionedAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[9px] font-mono text-muted-foreground">
                    {m.likeCount != null && (
                      <span>♥ {(m.likeCount / 1000).toFixed(1)}k</span>
                    )}
                    {m.viewCount != null && (
                      <span>👁 {(m.viewCount / 1000).toFixed(0)}k</span>
                    )}
                    {m.repostCount != null && <span>↺ {m.repostCount}</span>}
                  </div>
                  {m.link && (
                    <a
                      href={m.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[9px] text-primary/70 hover:text-primary transition-colors font-mono"
                    >
                      <FiExternalLink className="w-2.5 h-2.5" /> View tweet
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ── Main collapsible panel (Home page) ─────────────────────────────────────
const ElfaPanel = () => {
  const [open, setOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("tokens");
  const [newsToken, setNewsToken] = useState("BTC");

  const { data: tokens = [], isLoading: tokLoading } =
    useGetTrendingTokensQuery(
      { timeWindow: "24h", pageSize: 15 },
      { skip: !ELFA_ENABLED },
    );
  const { data: news = [], isLoading: newsLoading } = useGetTokenNewsQuery(
    { token: newsToken, limit: 6 },
    { skip: !ELFA_ENABLED },
  );

  if (!ELFA_ENABLED) {
    return (
      <div className="flex items-center gap-3 p-4 border rounded-lg card-gradient border-secondary/10">
        <HiSparkles className="w-4 h-4 text-secondary/40 shrink-0" />
        <p className="font-mono text-xs text-muted-foreground">
          Add{" "}
          <code className="bg-muted px-1 py-0.5 rounded">
            VITE_ELFA_API_KEY
          </code>{" "}
          to enable social intelligence
        </p>
      </div>
    );
  }

  const topSymbols = tokens.slice(0, 5).map((t) => t.token ?? "");

  return (
    <div className="overflow-hidden border rounded-lg card-gradient border-secondary/20">
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full px-4 py-3 transition-colors hover:bg-secondary/5"
      >
        <div className="flex items-center gap-2">
          <HiSparkles className="w-4 h-4 text-secondary" />
          <span className="text-xs font-bold font-display text-secondary">
            Social Intelligence
          </span>
          <span className="text-[9px] font-mono bg-secondary/15 text-secondary/70 px-1.5 py-0.5 rounded-full border border-secondary/20">
            Elfa AI
          </span>
        </div>
        {open ? (
          <FiChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
        ) : (
          <FiChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {/* Tabs */}
            <div className="flex gap-1 px-4 pb-3">
              {[
                { id: "tokens", icon: FiTrendingUp, label: "Trending" },
                { id: "news", icon: FiRadio, label: "Token News" },
              ].map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-body rounded-md border transition-colors ${
                    activeTab === id
                      ? "border-secondary/40 text-secondary bg-secondary/10"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-secondary/20"
                  }`}
                >
                  <Icon className="w-3 h-3" /> {label}
                </button>
              ))}
            </div>

            <div className="px-4 pb-4">
              {/* ── Trending Tokens tab ── */}
              {activeTab === "tokens" &&
                (tokLoading ? (
                  <div className="grid grid-cols-3 gap-2 md:grid-cols-5">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-16 rounded-lg bg-muted animate-pulse"
                      />
                    ))}
                  </div>
                ) : tokens.length === 0 ? (
                  <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                    <FiAlertCircle className="w-3.5 h-3.5" /> No trending tokens
                    right now
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                    {tokens.slice(0, 10).map((t, i) => {
                      const sym = (t.token ?? "?").toUpperCase();
                      const mentions = t.current_count ?? 0;
                      const change = t.change_percent ?? null;
                      return (
                        <motion.div
                          key={sym + i}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                          onClick={() => {
                            setNewsToken(sym);
                            setActiveTab("news");
                          }}
                          className="bg-secondary/5 border border-secondary/15 rounded-lg p-2.5 text-center cursor-pointer hover:bg-secondary/10 transition-colors"
                        >
                          <div className="font-mono text-xs font-bold text-foreground">
                            {sym}
                          </div>
                          <div className="text-[9px] font-mono text-muted-foreground mt-0.5">
                            {mentions.toLocaleString()}
                          </div>
                          {change !== null && (
                            <div
                              className={`text-[9px] font-mono mt-0.5 ${change >= 0 ? "text-positive" : "text-destructive"}`}
                            >
                              {change >= 0 ? "▲" : "▼"}{" "}
                              {Math.abs(change).toFixed(0)}%
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                ))}

              {/* ── Token News tab ── */}
              {activeTab === "news" && (
                <div>
                  {/* Token selector pills */}
                  <div className="flex gap-1.5 flex-wrap mb-3">
                    {(topSymbols.length > 0
                      ? topSymbols
                      : ["BTC", "ETH", "SOL"]
                    ).map((s) => (
                      <button
                        key={s}
                        onClick={() => setNewsToken(s)}
                        className={`px-2 py-1 text-[10px] font-mono rounded border transition-colors ${
                          newsToken === s
                            ? "border-secondary/50 text-secondary bg-secondary/10"
                            : "border-border text-muted-foreground hover:border-secondary/30"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  {newsLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div
                          key={i}
                          className="animate-pulse space-y-1.5 border-b border-border/50 pb-3"
                        >
                          <div className="w-4/5 h-3 rounded bg-muted" />
                          <div className="w-1/3 h-2 rounded bg-muted/60" />
                        </div>
                      ))}
                    </div>
                  ) : news.filter(isCryptoNews).length === 0 ? (
                    <div className="flex items-center gap-2 py-2 font-mono text-xs text-muted-foreground">
                      <FiAlertCircle className="w-3.5 h-3.5" />
                      No recent crypto news for {newsToken}
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {news.filter(isCryptoNews).map((item, i) => {
                        const title =
                          item.title ??
                          item.headline ??
                          item.content ??
                          item.summary ??
                          "View article";
                        const source =
                          item.source ?? item.domain ?? item.publisher ?? "";
                        const time =
                          item.publishedAt ??
                          item.published_at ??
                          item.createdAt ??
                          item.mentionedAt ??
                          null;
                        const url = item.url ?? item.link ?? null;
                        return (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className="border-b border-border/40 pb-2.5 last:border-0"
                          >
                            <p className="mb-1 text-xs leading-snug font-body text-foreground">
                              {title.length > 90
                                ? title.slice(0, 90) + "…"
                                : title}
                            </p>
                            <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground">
                              {source && <span>{source}</span>}
                              {time && <span>{timeAgoShort(time)}</span>}
                              {url && (
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ml-auto flex items-center gap-0.5 text-primary/60 hover:text-primary transition-colors"
                                >
                                  <FiExternalLink className="w-2.5 h-2.5" />{" "}
                                  Read
                                </a>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ElfaPanel;
