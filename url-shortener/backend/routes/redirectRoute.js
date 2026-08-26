import express from "express";
import { Url, Click } from "../models/Url.js";

const router = express.Router();

// GET /:shortCode  -- redirects to the original long URL
// This is the most frequently hit route (read-heavy), so it's kept
// as lean as possible: one lookup, one increment, one redirect.
router.get("/:shortCode", async (req, res) => {
  try {
    const { shortCode } = req.params;
    const url = await Url.findOne({ shortCode });

    if (!url) {
      return res.status(404).send("Short URL not found.");
    }

    // Fire-and-forget analytics writes so they don't slow down the redirect
    Url.updateOne({ shortCode }, { $inc: { clicks: 1 } }).exec();
    Click.create({
      shortCode,
      ip: req.ip,
      userAgent: req.headers["user-agent"]
    }).catch((err) => console.error("Click log failed:", err.message));

    return res.redirect(302, url.longUrl);
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong.");
  }
});

export default router;
