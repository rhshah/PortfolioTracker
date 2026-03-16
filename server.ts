import express from "express";
import { createServer as createViteServer } from "vite";
import YahooFinance from "yahoo-finance2";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const yahooFinance = new YahooFinance();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/finance/history", async (req, res) => {
    try {
      const { symbol, period1, period2 } = req.query;
      
      if (!symbol || typeof symbol !== 'string') {
        return res.status(400).json({ error: "Missing or invalid symbol" });
      }

      const parseDate = (val: any) => {
        if (!val) return null;
        // If it's a numeric string (timestamp)
        if (/^\d+$/.test(val)) {
          const num = parseInt(val, 10);
          // If it's in seconds (like Yahoo usually uses), convert to ms
          // 10^12 is a safe threshold to distinguish seconds from ms
          return new Date(num < 10000000000 ? num * 1000 : num);
        }
        return new Date(val);
      };

      const queryOptions: any = {
        period1: parseDate(period1) || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // Default 1 year
      };
      
      if (period2) {
        queryOptions.period2 = parseDate(period2);
      }
      
      const result = await yahooFinance.chart(symbol, queryOptions);
      res.json(result.quotes);
    } catch (error: any) {
      console.error(`Error fetching history for ${req.query.symbol}:`, error);
      res.status(500).json({ error: error.message || "Failed to fetch data" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
