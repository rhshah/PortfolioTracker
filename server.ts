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

  app.use(express.json({ limit: '50mb' }));

  app.post("/api/finance/correlation", (req, res) => {
    try {
      const { fetchedData, symbols } = req.body;

      if (!fetchedData || !symbols || !Array.isArray(symbols)) {
        return res.status(400).json({ error: "Missing fetchedData or symbols array" });
      }

      // 1. Align Time Series
      const allDatesSet = new Set<string>();
      symbols.forEach(sym => {
        if (fetchedData[sym]) {
          fetchedData[sym].forEach((d: any) => allDatesSet.add(d.date));
        }
      });
      
      const allDates = Array.from(allDatesSet).sort();
      const alignedPrices: Record<string, number[]> = {};
      
      symbols.forEach(sym => {
        alignedPrices[sym] = [];
        let lastPrice = 0;
        
        if (fetchedData[sym] && fetchedData[sym].length > 0) {
          lastPrice = fetchedData[sym][0].price;
        }

        const dateToPrice = new Map<string, number>();
        if (fetchedData[sym]) {
          fetchedData[sym].forEach((d: any) => dateToPrice.set(d.date, d.price));
        }

        allDates.forEach(date => {
          if (dateToPrice.has(date)) {
            lastPrice = dateToPrice.get(date)!;
          }
          alignedPrices[sym].push(lastPrice);
        });
      });

      // 2. Calculate Log Returns
      const calculateLogReturns = (data: number[]) => {
        if (data.length < 2) return [];
        const returns = [];
        for (let i = 1; i < data.length; i++) {
          const prevValue = data[i - 1];
          const currentValue = data[i];
          if (prevValue <= 0 || currentValue <= 0) {
            returns.push(0);
          } else {
            returns.push(Math.log(currentValue / prevValue));
          }
        }
        return returns;
      };

      // 3. Calculate Correlation
      const calculateCorrelation = (x: number[], y: number[]) => {
        if (x.length === 0 || y.length === 0 || x.length !== y.length) return 0;
        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
        const sumX2 = x.reduce((a, b) => a + b * b, 0);
        const sumY2 = y.reduce((a, b) => a + b * b, 0);
        
        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
        
        if (denominator === 0) return 0;
        return numerator / denominator;
      };

      // 4. Build Matrix
      const correlationMatrix: any = {
        symbols: symbols,
        matrix: {}
      };

      // Pre-calculate log returns for the last 252 days
      const precalculatedReturns: Record<string, number[]> = {};
      for (const sym of symbols) {
        const prices = alignedPrices[sym].slice(-252);
        if (prices.length > 5) {
          precalculatedReturns[sym] = calculateLogReturns(prices);
        }
      }

      for (const h1 of symbols) {
        correlationMatrix.matrix[h1] = {};
        for (const h2 of symbols) {
          if (h1 === h2) {
            correlationMatrix.matrix[h1][h2] = 1.0;
            continue;
          }

          const returns1 = precalculatedReturns[h1];
          const returns2 = precalculatedReturns[h2];

          if (returns1 && returns2) {
            correlationMatrix.matrix[h1][h2] = calculateCorrelation(returns1, returns2);
          } else {
            correlationMatrix.matrix[h1][h2] = 0.5;
          }
        }
      }

      res.json(correlationMatrix);
    } catch (error: any) {
      console.error(`Error calculating correlation matrix:`, error);
      res.status(500).json({ error: error.message || "Failed to calculate correlation matrix" });
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
