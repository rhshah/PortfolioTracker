import { fetchETFData } from './src/services/financeApi.ts';

async function main() {
  const data = await fetch('http://localhost:3000/api/finance/history?symbol=SPY&period1=2026-03-15').then(res => res.json());
  console.log(data.slice(-5));
}

main();
