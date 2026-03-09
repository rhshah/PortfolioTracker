import yahooFinance from "yahoo-finance2";

async function test() {
  try {
    const result = await yahooFinance.historical("SPY", { period1: "2023-01-01" });
    console.log("Success:", result.length);
  } catch (err) {
    console.error("Error:", err);
  }
}
test();
