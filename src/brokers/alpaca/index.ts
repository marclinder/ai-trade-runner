import Alpaca from "@alpacahq/alpaca-trade-api";
import { AlpacaBar } from "@alpacahq/alpaca-trade-api/dist/resources/datav2/entityv2";

const {
  ALPACA_API_KEY,
  ALPACA_SECRET_KEY,
  ALPACA_USE_PAPER = "true",
} = process.env;

if (!ALPACA_API_KEY || !ALPACA_SECRET_KEY) {
  throw new Error("Missing Alpaca credentials");
}

const alpaca = new Alpaca({
  keyId: ALPACA_API_KEY,
  secretKey: ALPACA_SECRET_KEY,
  paper: ALPACA_USE_PAPER === "true",
});

export async function getPrice(symbol: string): Promise<number | undefined> {
  const prices = await getPrices([symbol]);
  return prices[symbol];
}

// Fetch multiple prices at once
export async function getPrices(symbols: string[]): Promise<Record<string, number>> {
  try {
    const bars: Map<string, AlpacaBar> = await alpaca.getLatestBars(symbols);
    const result: Record<string, number> = {};
    for (const [symbol, bar] of bars.entries()) {
      if (bar && bar.ClosePrice !== undefined) {
        result[symbol] = bar.ClosePrice;
      }
    }

    return result;
  } catch (err) {
    console.error("getPrices error:", err);
    return {};
  }
}

export async function placeOrder({
  symbol,
  qty,
  side,
}: {
  symbol: string;
  qty: number;
  side: "buy" | "sell";
}) {
  try {
    const order = await alpaca.createOrder({
      symbol,
      qty,
      side,
      type: "market",
      time_in_force: "gtc",
    });

    console.log("✅ Order placed:", order);
    return order;
  } catch (err: any) {
    console.error("Failed to place order:", {
      symbol,
      qty,
      side,
      error: err?.response?.data || err?.message || err,
    });

    return null;
  }
}
