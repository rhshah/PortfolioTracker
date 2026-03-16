# Stock Portfolio Tracker

A React-based web application to track and visualize your stock portfolio's performance against major benchmarks. The application uses Vite for the frontend and Express for the backend to fetch real-time financial data.

## Features

- **Portfolio Overview:** Visualize your portfolio's total value over time.
- **Benchmark Comparison:** Compare your portfolio's performance against major indices like S&P 500 (SPY) and Nasdaq (QQQ).
- **Asset Allocation:** View the distribution of your assets across different stocks.
- **Real-time Data:** Fetches historical stock data using the Yahoo Finance API.

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Recharts, Lucide React
- **Backend:** Node.js, Express, Yahoo Finance API (`yahoo-finance2`)

## Local Development

To run the application locally:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```
   This will start both the Express backend and the Vite frontend on `http://localhost:3000`.

3. **Build for production:**
   ```bash
   npm run build
   ```

4. **Start the production server:**
   ```bash
   npm start
   ```

## Deployment

### GitHub Pages (Frontend Only)

This repository includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) to automatically deploy the frontend to GitHub Pages when you push to the `main` or `master` branch.

**⚠️ Important Note for GitHub Pages:**
GitHub Pages only supports static file hosting. Because this application relies on an Express backend (`server.ts`) to fetch data from Yahoo Finance (to avoid CORS issues), the API calls to `/api/finance/history` will fail on GitHub Pages. 

To make the app fully functional in a production environment, you should deploy the full-stack application to a service that supports Node.js backends, such as:
- [Render](https://render.com/)
- [Heroku](https://heroku.com/)
- [Fly.io](https://fly.io/)
- [Vercel](https://vercel.com/) (using Serverless Functions)

If you deploy the backend separately, make sure to update the API endpoints in the frontend code to point to your hosted backend URL instead of relative paths.
