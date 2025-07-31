type TradeAction = 'BUY' | 'SELL' | 'HOLD';

function getMockPrice(): number {
  return Math.random() * 100;
}

function makeTradeDecision(price: number): TradeAction {
  if (price < 30) return 'BUY';
  if (price > 70) return 'SELL';
  return 'HOLD';
}

function simulate() {
  const price = getMockPrice();
  const action = makeTradeDecision(price);

  console.log(JSON.stringify({
    message: 'Local simulation',
    price,
    action,
  }, null, 2));
}

simulate();
