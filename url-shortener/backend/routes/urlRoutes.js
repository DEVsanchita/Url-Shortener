import express from "express";
import { Url, Click, getNextSequence } from "../models/Url.js";
import { encode } from "../utils/base62.js";

const router = express.Router();
const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

function isValidUrl(str) {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

// POST /api/shorten  { longUrl }
router.post("/shorten", async (req, res) => {
  try {
    const { longUrl } = req.body;

    if (!longUrl || !isValidUrl(longUrl)) {
      return res.status(400).json({ error: "A valid longUrl is required." });
    }

    // If this URL was already shortened before, return the existing code
    // instead of creating a duplicate entry.
    const existing = await Url.findOne({ longUrl });
    if (existing) {
      return res.json({
        shortCode: existing.shortCode,
        shortUrl: `${BASE_URL}/${existing.shortCode}`,
        longUrl: existing.longUrl
      });
    }

    const seq = await getNextSequence();
    const shortCode = encode(seq);

    const url = await Url.create({ shortCode, longUrl });

    res.status(201).json({
      shortCode: url.shortCode,
      shortUrl: `${BASE_URL}/${url.shortCode}`,
      longUrl: url.longUrl
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong shortening the URL." });
  }
});

// GET /api/analytics/:shortCode
router.get("/analytics/:shortCode", async (req, res) => {
  try {
    const url = await Url.findOne({ shortCode: req.params.shortCode });
    if (!url) return res.status(404).json({ error: "Short URL not found." });

    const recentClicks = await Click.find({ shortCode: url.shortCode })
      .sort({ timestamp: -1 })
      .limit(20);

    res.json({
      shortCode: url.shortCode,
      longUrl: url.longUrl,
      totalClicks: url.clicks,
      createdAt: url.createdAt,
      recentClicks
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong fetching analytics." });
  }
});

// GET /api/top  -- top 10 most-clicked links (aggregation example)
router.get("/top", async (req, res) => {
  try {
    const topUrls = await Url.find().sort({ clicks: -1 }).limit(10);
    res.json(topUrls);
  } catch (err) {
    res.status(500).json({ error: "Something went wrong fetching top links." });
  }
});

export default router;
