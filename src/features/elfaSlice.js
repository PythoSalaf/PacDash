import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const elfaApi = createApi({
  reducerPath: "elfaApi",
  // Requests go to /elfa-api/* on localhost — Vite proxy rewrites to api.elfa.ai/v2/*
  baseQuery: fetchBaseQuery({ baseUrl: "/elfa-api" }),
  tagTypes: [
    "TrendingTokens",
    "TokenNews",
    "TopMentions",
    "TrendingCAs",
    "EventSummary",
  ],
  endpoints: (builder) => ({
    // ✅ FREE — trending tokens by mention count
    // Response: { data: { data: [{token, current_count, previous_count, change_percent}] } }
    getTrendingTokens: builder.query({
      query: ({ timeWindow = "24h", pageSize = 20 } = {}) =>
        `/aggregations/trending-tokens?timeWindow=${timeWindow}&pageSize=${pageSize}`,
      providesTags: ["TrendingTokens"],
      keepUnusedDataFor: 300,
      transformResponse: (res) => res?.data?.data ?? [],
    }),

    // ✅ FREE — news/articles mentioning a token (replaces narratives which is Grow tier)
    // Response: { data: [{title, url, source, publishedAt, ...}] }
    getTokenNews: builder.query({
      query: ({ token, limit = 8 }) =>
        `/data/token-news?token=${encodeURIComponent(token)}&limit=${limit}`,
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

    // ✅ FREE — top social mentions for a ticker (for Social Buzz panel on market click)
    // Response: { data: [{tweetId, link, likeCount, repostCount, viewCount, account:{username}}] }
    getTopMentions: builder.query({
      query: ({ ticker, timeWindow = "24h", limit = 5 }) =>
        `/data/top-mentions?ticker=${encodeURIComponent(ticker)}&timeWindow=${timeWindow}&limit=${limit}`,
      providesTags: (_, __, { ticker }) => [
        { type: "TopMentions", id: ticker },
      ],
      keepUnusedDataFor: 180,
      transformResponse: (res) => res?.data ?? [],
    }),

    // ✅ FREE — contract addresses trending on Twitter (for Whale Feed confluence)
    // Response: { data: { data: [{contractAddress, mentionCount, ...}] } }
    getTrendingCAs: builder.query({
      query: ({ timeWindow = "24h", pageSize = 10 } = {}) =>
        `/aggregations/trending-cas/twitter?timeWindow=${timeWindow}&pageSize=${pageSize}`,
      providesTags: ["TrendingCAs"],
      keepUnusedDataFor: 300,
      transformResponse: (res) => res?.data?.data ?? res?.data ?? [],
    }),

    // ✅ FREE (5 credits) — AI-written summary of what's happening with a token socially
    // Response: { data: { summary: "..." } }
    getEventSummary: builder.query({
      query: ({ keywords, timeWindow = "24h" }) =>
        `/data/event-summary?keywords=${encodeURIComponent(keywords)}&timeWindow=${timeWindow}`,
      providesTags: (_, __, { keywords }) => [
        { type: "EventSummary", id: keywords },
      ],
      keepUnusedDataFor: 600, // cache 10 min — costs 5 credits each call
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
