import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const pacificaApi = createApi({
  reducerPath: "pacificaApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://test-api.pacifica.fi/api/v1",
    prepareHeaders: (headers) => {
      headers.set("Accept", "application/json");
      return headers;
    },
  }),
  tagTypes: [
    "MarketInfo",
    "MarketPrices",
    "CandleData",
    "FundingRateHistory",
    "RecentTrades",
    "AccountInfo",
    "Positions",
    "TradeHistory",
    "EquityHistory",
    "AccountFundingHistory",
  ],
  endpoints: (builder) => ({
    // ── PUBLIC MARKET ENDPOINTS ───────────────────────────────────────────

    // GET /api/v1/info
    getMarketInfo: builder.query({
      query: () => "/info",
      providesTags: ["MarketInfo"],
      transformResponse: (res) => res?.data ?? [],
    }),

    // GET /api/v1/info/prices
    getMarketPrices: builder.query({
      query: () => "/info/prices",
      providesTags: ["MarketPrices"],
      keepUnusedDataFor: 15,
      transformResponse: (res) => res?.data ?? [],
    }),

    // GET /api/v1/kline
    getCandleData: builder.query({
      query: ({ symbol = "BTC", interval = "1h", start_time, end_time }) =>
        `/kline?symbol=${symbol}&interval=${interval}&start_time=${start_time}${end_time ? `&end_time=${end_time}` : ""}`,
      providesTags: ["CandleData"],
      transformResponse: (res) => res?.data ?? [],
    }),

    // GET /api/v1/funding_rate/history?symbol=BTC — market funding history (public)
    getFundingRateHistory: builder.query({
      query: ({ symbol, limit = 90 }) =>
        `/funding_rate/history?symbol=${symbol}&limit=${limit}`,
      providesTags: (_, __, { symbol }) => [
        { type: "FundingRateHistory", id: symbol },
      ],
      transformResponse: (res) => res?.data ?? [],
    }),

    // GET /api/v1/trades?symbol=BTC — public recent trades for a market
    getRecentTrades: builder.query({
      query: ({ symbol }) => `/trades?symbol=${symbol}`,
      providesTags: (_, __, { symbol }) => [
        { type: "RecentTrades", id: symbol },
      ],
      keepUnusedDataFor: 5,
      transformResponse: (res) => res?.data ?? [],
    }),

    // ── AUTHENTICATED ACCOUNT ENDPOINTS ──────────────────────────────────

    // GET /api/v1/account?account=ADDRESS
    getAccountInfo: builder.query({
      query: (address) => `/account?account=${address}`,
      providesTags: ["AccountInfo"],
      transformResponse: (res) => {
        const d = Array.isArray(res?.data) ? res.data[0] : res?.data;
        return d ?? null;
      },
    }),

    // GET /api/v1/positions?account=ADDRESS
    getPositions: builder.query({
      query: (address) => `/positions?account=${address}`,
      providesTags: ["Positions"],
      transformResponse: (res) => res?.data ?? [],
    }),

    // GET /api/v1/trades/history?account=ADDRESS
    getTradeHistory: builder.query({
      query: ({ address, limit = 100, symbol }) => {
        let url = `/trades/history?account=${address}&limit=${limit}`;
        if (symbol) url += `&symbol=${symbol}`;
        return url;
      },
      providesTags: ["TradeHistory"],
      transformResponse: (res) => res?.data ?? [],
    }),

    // NOTE: Pacifica has no public equity_history endpoint.
    // Equity chart is derived from trade history cumulative PnL in PnL.jsx.

    // GET /api/v1/funding/history?account=ADDRESS — user's funding payments
    getAccountFundingHistory: builder.query({
      query: ({ address, limit = 50 }) =>
        `/funding/history?account=${address}&limit=${limit}`,
      providesTags: ["AccountFundingHistory"],
      transformResponse: (res) => res?.data ?? [],
    }),
  }),
});

export const {
  useGetMarketInfoQuery,
  useGetMarketPricesQuery,
  useGetCandleDataQuery,
  useGetFundingRateHistoryQuery,
  useGetRecentTradesQuery,
  useGetAccountInfoQuery,
  useGetPositionsQuery,
  useGetTradeHistoryQuery,
  useGetAccountFundingHistoryQuery,
} = pacificaApi;
