import express from "express";
import { createServer as createViteServer } from "vite";
import YahooFinance from "yahoo-finance2";

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

      const queryOptions: any = {
        period1: period1 ? new Date(period1 as string) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // Default 1 year
      };
      
      if (period2) {
        queryOptions.period2 = new Date(period2 as string);
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
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
