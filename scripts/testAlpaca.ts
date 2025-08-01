import { getPrice, placeOrder } from '../src/brokers/alpaca';

(async () => {
  const symbol = 'AAPL';
  const price = await getPrice(symbol);
  console.log(`Current price of ${symbol}: $${price}`);

  // const order = await placeOrder({ symbol, qty: 1, side: 'buy' });
  // console.log('Order placed:', order);
})();
