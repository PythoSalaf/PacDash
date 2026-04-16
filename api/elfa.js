/**
 * Vercel serverless function — proxies all Elfa AI requests server-side.
 * Injects the API key from an environment variable so it never leaks to the browser.
 *
 * Route: /api/elfa?path=/aggregations/trending-tokens&timeWindow=24h&pageSize=20
 *
 * Set ELFA_API_KEY (no VITE_ prefix) in your Vercel project environment variables.
 * Dashboard → Project → Settings → Environment Variables
 */
export default async function handler(req, res) {
  // Allow preflight CORS from any origin
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const apiKey = process.env.ELFA_API_KEY;
  if (!apiKey) {
    return res
      .status(500)
      .json({ error: "ELFA_API_KEY not configured on Vercel" });
  }

  // Extract the Elfa path from query param, e.g. /aggregations/trending-tokens
  const { path, ...rest } = req.query;
  if (!path) {
    return res.status(400).json({ error: "Missing path query parameter" });
  }

  // Build the full Elfa URL with remaining query params
  const params = new URLSearchParams(rest).toString();
  const elfaUrl = `https://api.elfa.ai/v2${path}${params ? `?${params}` : ""}`;

  try {
    const upstream = await fetch(elfaUrl, {
      headers: {
        "x-elfa-api-key": apiKey,
        Accept: "application/json",
      },
    });

    const data = await upstream.json();
    return res.status(upstream.status).json(data);
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Upstream Elfa request failed", detail: err.message });
  }
}
