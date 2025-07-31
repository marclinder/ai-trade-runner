import { APIGatewayProxyHandler } from 'aws-lambda';

type TradeAction = 'BUY' | 'SELL' | 'HOLD';

function getMockPrice(): number {
  return Math.random() * 100;
}

function makeTradeDecision(price: number): TradeAction {
  if (price < 30) return 'BUY';
  if (price > 70) return 'SELL';
  return 'HOLD';
}

export const handler: APIGatewayProxyHandler = async () => {
  const price = getMockPrice();
  const action = makeTradeDecision(price);

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Trade logic executed',
      price,
      action,
    }),
  };
};
