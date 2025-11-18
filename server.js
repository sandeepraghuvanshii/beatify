// server.js
import express from "express";
import axios from "axios";
import cors from "cors";
import rateLimit from "express-rate-limit";
import NodeCache from "node-cache";
import dotenv from "dotenv";
import endpoints from "./endpoints.js";
import { augmentMediaLinks } from "./utils/augmentLinks.js";
import { extractTokenFromPermaUrl } from "./utils/token.js";

dotenv.config();

const PORT = process.env.PORT || 3000;
const CACHE_TTL = parseInt(process.env.CACHE_TTL || "300", 10);
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || "60", 10);

const app = express();
app.use(cors());
app.use(express.json());

// Rate limiter for API routes
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

// Simple in-memory cache
const cache = new NodeCache({
  stdTTL: CACHE_TTL,
  checkperiod: Math.max(60, Math.floor(CACHE_TTL / 2)),
});

// Helper to fetch and cache upstream responses
async function fetchAndCache(url) {
  const key = url;
  const cached = cache.get(key);
  if (cached) return cached;

  const res = await axios.get(url, {
    headers: {
      "User-Agent": "Node.js Proxy",
      Accept: "application/json, text/javascript, */*; q=0.01",
    },
    timeout: 10000,
  });

  cache.set(key, res.data);
  return res.data;
}

// Generic handler wrapper
function handleProxy(fn) {
  return async (req, res) => {
    try {
      const url = fn(req);
      const data = await fetchAndCache(url);
      res.json(data);
    } catch (err) {
      console.error("Proxy error", err?.message || err);
      const status = err?.response?.status || 502;
      res.status(status).json({
        error: "Upstream request failed",
        details: err?.message || null,
      });
    }
  };
}

// Routes

app.get(
  "/api/launch",
  handleProxy(() => endpoints.launchData()),
);

app.get(
  "/api/search/autocomplete",
  handleProxy((req) => {
    const q = req.query.q || req.query.query || "";
    return endpoints.searchAutocomplete(q);
  }),
);

app.get(
  "/api/search",
  handleProxy((req) => {
    const q = req.query.q || req.query.query || "";
    return endpoints.searchResults(q);
  }),
);

// Song route that accepts token or full perma_url
app.get("/api/song/:token", async (req, res) => {
  try {
    const raw = req.params.token;
    const token =
      raw && (raw.startsWith("http") || raw.includes("/"))
        ? extractTokenFromPermaUrl(raw)
        : raw;
    if (!token) return res.status(400).json({ error: "Missing token" });

    const url = endpoints.songDetails(token);
    const upstream = await fetchAndCache(url);

    // augment upstream in place: decrypt, add links, remove encrypted fields
    augmentMediaLinks(upstream);

    const songObj = upstream?.song || upstream?.data || upstream;
    res.json({ upstream, song: songObj });
  } catch (err) {
    console.error("Song proxy error", err?.message || err);
    const status = err?.response?.status || 502;
    res.status(status).json({
      error: "Upstream request failed",
      details: err?.message || null,
    });
  }
});

app.get("/api/playlist/:token", async (req, res) => {
  try {
    const raw = req.params.token;
    const token =
      raw && (raw.startsWith("http") || raw.includes("/"))
        ? extractTokenFromPermaUrl(raw)
        : raw;
    if (!token) return res.status(400).json({ error: "Missing token" });

    const url = endpoints.playlistDetails(token);
    const upstream = await fetchAndCache(url);

    // augment entire playlist JSON
    augmentMediaLinks(upstream);

    res.json(upstream);
  } catch (err) {
    console.error("Playlist proxy error", err?.message || err);
    const status = err?.response?.status || 502;
    res.status(status).json({
      error: "Upstream request failed",
      details: err?.message || null,
    });
  }
});

app.get("/api/album/:token", async (req, res) => {
  try {
    const raw = req.params.token;
    const token =
      raw && (raw.startsWith("http") || raw.includes("/"))
        ? extractTokenFromPermaUrl(raw)
        : raw;
    if (!token) return res.status(400).json({ error: "Missing token" });

    const url = endpoints.albumDetails(token);
    const upstream = await fetchAndCache(url);

    augmentMediaLinks(upstream);

    res.json(upstream);
  } catch (err) {
    console.error("Album proxy error", err?.message || err);
    const status = err?.response?.status || 502;
    res.status(status).json({
      error: "Upstream request failed",
      details: err?.message || null,
    });
  }
});

app.get("/api/artist/:token", async (req, res) => {
  try {
    const raw = req.params.token;
    const token =
      raw && (raw.startsWith("http") || raw.includes("/"))
        ? extractTokenFromPermaUrl(raw)
        : raw;
    if (!token) return res.status(400).json({ error: "Missing token" });

    const url = endpoints.artistDetails(token);
    const upstream = await fetchAndCache(url);

    augmentMediaLinks(upstream);

    res.json(upstream);
  } catch (err) {
    console.error("Artist proxy error", err?.message || err);
    const status = err?.response?.status || 502;
    res.status(status).json({
      error: "Upstream request failed",
      details: err?.message || null,
    });
  }
});

app.get(
  "/api/lyrics/:token",
  handleProxy((req) => {
    const raw = req.params.token;
    const token =
      raw && (raw.startsWith("http") || raw.includes("/"))
        ? extractTokenFromPermaUrl(raw)
        : raw;
    return endpoints.lyrics(token);
  }),
);

app.get("/api/health", (req, res) => res.json({ ok: true }));

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Beatify api running on port ${PORT}`);
});
