import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

/**
 * Custom base query that routes correctly in both environments:
 *
 * DEV  → /elfa-api/aggregations/trending-tokens?timeWindow=24h
 *         (Vite proxy rewrites to api.elfa.ai/v2 and injects API key)
 *
 * PROD → /api/elfa?path=/aggregations/trending-tokens&timeWindow=24h
 *         (Vercel serverless function at api/elfa.js injects ELFA_API_KEY)
 */
const elfaBaseQuery = fetchBaseQuery({
  baseUrl: "/",
  prepareHeaders: (headers) => headers,
});

const elfaQuery = (path) => {
  if (import.meta.env.DEV) {
    // Vite proxy: /elfa-api/* → api.elfa.ai/v2/*
    return `elfa-api${path}`;
  }
  // Vercel serverless: /api/elfa?path=/aggregations/...&rest=params
  const [pathname, qs] = path.split("?");
  const base = `api/elfa?path=${encodeURIComponent(pathname)}`;
  return qs ? `${base}&${qs}` : base;
};

export const elfaApi = createApi({
  reducerPath: "elfaApi",
  baseQuery: elfaBaseQuery,
  tagTypes: [
    "TrendingTokens",
    "TokenNews",
    "TopMentions",
    "TrendingCAs",
    "EventSummary",
  ],
  endpoints: (builder) => ({
    getTrendingTokens: builder.query({
      query: ({ timeWindow = "24h", pageSize = 20 } = {}) =>
        elfaQuery(
          `/aggregations/trending-tokens?timeWindow=${timeWindow}&pageSize=${pageSize}`,
        ),
      providesTags: ["TrendingTokens"],
      keepUnusedDataFor: 300,
      transformResponse: (res) => res?.data?.data ?? [],
    }),

    getTokenNews: builder.query({
      query: ({ token, limit = 8 }) =>
        elfaQuery(
          `/data/token-news?token=${encodeURIComponent(token)}&limit=${limit}`,
        ),
      providesTags: (_, __, { token }) => [{ type: "TokenNews", id: token }],
      keepUnusedDataFor: 300,
      transformResponse: (res) => {
        const d = res?.data;
        if (Array.isArray(d)) return d;
        if (Array.isArray(d?.data)) return d.data;
        if (Array.isArray(d?.items)) return d.items;
        return [];
      },
    }),

    getTopMentions: builder.query({
      query: ({ ticker, timeWindow = "24h", limit = 5 }) =>
        elfaQuery(
          `/data/top-mentions?ticker=${encodeURIComponent(ticker)}&timeWindow=${timeWindow}&limit=${limit}`,
        ),
      providesTags: (_, __, { ticker }) => [
        { type: "TopMentions", id: ticker },
      ],
      keepUnusedDataFor: 180,
      transformResponse: (res) => res?.data ?? [],
    }),

    getTrendingCAs: builder.query({
      query: ({ timeWindow = "24h", pageSize = 10 } = {}) =>
        elfaQuery(
          `/aggregations/trending-cas/twitter?timeWindow=${timeWindow}&pageSize=${pageSize}`,
        ),
      providesTags: ["TrendingCAs"],
      keepUnusedDataFor: 300,
      transformResponse: (res) => res?.data?.data ?? res?.data ?? [],
    }),

    getEventSummary: builder.query({
      query: ({ keywords, timeWindow = "24h" }) =>
        elfaQuery(
          `/data/event-summary?keywords=${encodeURIComponent(keywords)}&timeWindow=${timeWindow}`,
        ),
      providesTags: (_, __, { keywords }) => [
        { type: "EventSummary", id: keywords },
      ],
      keepUnusedDataFor: 600,
      transformResponse: (res) => {
        const d = res?.data;
        if (typeof d === "string") return d;
        return d?.summary ?? d?.text ?? d?.content ?? d?.data ?? null;
      },
    }),
  }),
});

export const {
  useGetTrendingTokensQuery,
  useGetTokenNewsQuery,
  useGetTopMentionsQuery,
  useGetTrendingCAsQuery,
  useGetEventSummaryQuery,
} = elfaApi;
