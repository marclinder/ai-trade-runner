import 'dotenv/config';
import Alpaca from '@alpacahq/alpaca-trade-api';
import { AlpacaBar } from '@alpacahq/alpaca-trade-api/dist/resources/datav2/entityv2';

const {
  ALPACA_API_KEY,
  ALPACA_SECRET_KEY,
  ALPACA_USE_PAPER = 'true', // optional, defaults to true
} = process.env;
if (!ALPACA_API_KEY || !ALPACA_SECRET_KEY) {
  throw new Error('Missing Alpaca credentials in environment variables');
}

const alpaca = new Alpaca({
  keyId: ALPACA_API_KEY,
  secretKey: ALPACA_SECRET_KEY,
  paper: ALPACA_USE_PAPER === 'true',
});

export async function getPrice(symbol: string): Promise<number> {
  const barset = await alpaca.getBarsV2(symbol, {
    timeframe: '1Min',
    limit: 1,
  });

  const bars: AlpacaBar[] = [];
  for await (const bar of barset as AsyncIterable<AlpacaBar>) {
    bars.push(bar);
  }

  if (!bars.length) throw new Error(`No price data for ${symbol}`);

  return bars[0].ClosePrice;
}

export async function placeOrder({
  symbol,
  qty,
  side,
}: {
  symbol: string;
  qty: number;
  side: 'buy' | 'sell';
}) {
  const order = await alpaca.createOrder({
    symbol,
    qty,
    side,
    type: 'market',
    time_in_force: 'gtc',
  });
  console.log('placeOrder', order)
  return order;
}
// typeof order.post
