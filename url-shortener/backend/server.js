import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import { rateLimiter } from "./middleware/rateLimiter.js";
import urlRoutes from "./routes/urlRoutes.js";
import redirectRoute from "./routes/redirectRoute.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Rate limiting applies only to the API (write-heavy, abuse-prone routes).
// Redirects are intentionally NOT rate-limited, since real short-link
// services need redirects to always be fast and available.
app.use("/api", rateLimiter, urlRoutes);

// Redirect route sits at the root path: yourapp.com/Xk9pQ2
app.use("/", redirectRoute);

app.get("/health", (req, res) => res.json({ status: "ok" }));

async function start() {
  await connectDB();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

start();
