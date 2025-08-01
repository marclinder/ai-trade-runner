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
  try {
    const bar: AlpacaBar = await alpaca.getLatestBar(symbol);
    return bar.ClosePrice;
  } catch (err) {
    console.error("getPrice error:", err);
    return undefined;
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
  const order = await alpaca.createOrder({
    symbol,
    qty,
    side,
    type: "market",
    time_in_force: "gtc",
  });

  console.log("placeOrder", order);
  return order;
}
