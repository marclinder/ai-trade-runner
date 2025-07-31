import Alpaca from '@alpacahq/alpaca-trade-api';

const alpaca = new Alpaca({
  keyId: process.env.ALPACA_API_KEY!,
  secretKey: process.env.ALPACA_SECRET_KEY!,
  paper: true, // Paper trading mode
});

export async function executeTrade(symbol: string, qty: number, side: 'buy' | 'sell') {
  const order = await alpaca.createOrder({
    symbol,
    qty,
    side,
    type: 'market',
    time_in_force: 'gtc',
  });

  return {
    id: order.id,
    status: order.status,
  };
}
