import Alpaca from "@alpacahq/alpaca-trade-api";
import { AlpacaBar } from "@alpacahq/alpaca-trade-api/dist/resources/datav2/entityv2";
import { AlpacaOrder, AlpacaOrderRequest, SymbolPrice } from "../../screeners/types";

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
  return prices[0].price;
}

// Fetch multiple prices at once
export async function getPrices(symbols: string[]): Promise<SymbolPrice[]> {
  try {
    const bars: Map<string, AlpacaBar> = await alpaca.getLatestBars(symbols);
    const result: SymbolPrice[] = [];

    for (const [symbol, bar] of bars.entries()) {
      if (bar && bar.ClosePrice !== undefined) {
        result.push({ symbol, price: bar.ClosePrice });
      }
    }

    return result;
  } catch (err) {
    console.error("getPrices error:", err);
    return [];
  }
}

export async function placeOrder( {symbol, qty, side}: AlpacaOrderRequest): Promise<AlpacaOrder | null> {
  try {
    const order:AlpacaOrder = await alpaca.createOrder({
      symbol,
      qty,
      side,
      type: "market",
      time_in_force: "gtc",
    });
    console.log("✅ Order placed:", order.symbol, order.qty, order.side);
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
