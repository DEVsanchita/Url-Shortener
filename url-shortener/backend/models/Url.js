import mongoose from "mongoose";

// A counter collection gives us a strictly increasing integer ID.
// We base62-encode that ID to produce the short code — this avoids
// collisions entirely (no random-hash retry loops needed).
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 100000 } // start higher so early codes aren't 1-char
});
export const Counter = mongoose.model("Counter", counterSchema);

const urlSchema = new mongoose.Schema({
  shortCode: { type: String, required: true, unique: true, index: true },
  longUrl: { type: String, required: true },
  clicks: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

// Track individual click events for analytics (kept lightweight)
const clickSchema = new mongoose.Schema({
  shortCode: { type: String, required: true, index: true },
  timestamp: { type: Date, default: Date.now },
  ip: String,
  userAgent: String
});

export const Url = mongoose.model("Url", urlSchema);
export const Click = mongoose.model("Click", clickSchema);

export async function getNextSequence() {
  const result = await Counter.findByIdAndUpdate(
    "urlId",
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return result.seq;
}
