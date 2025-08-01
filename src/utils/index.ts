
export interface MarketMoverEntry {
  symbol: string;
  price: number;
  change: number;
  percent_change: number;
}

export interface MarketMoversResponse {
  gainers: MarketMoverEntry[];
  losers: MarketMoverEntry[];
  last_updated: string;
  market_type: 'stocks';
}

export async function fetchMarketMovers(top: number = 10): Promise<MarketMoversResponse> {
  const { ALPACA_API_KEY, ALPACA_SECRET_KEY } = process.env;

  if (!ALPACA_API_KEY || !ALPACA_SECRET_KEY) {
    throw new Error('Missing Alpaca API credentials');
  }
  const BASE_URL = 'https://data.alpaca.markets/v1beta1/screener/stocks';
  const url = `${BASE_URL}/movers?top=${top}`;
  const res = await fetch(url, {
    headers: {
      'APCA-API-KEY-ID': ALPACA_API_KEY,
      'APCA-API-SECRET-KEY': ALPACA_SECRET_KEY,
      'accept': 'application/json',
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to fetch market movers: ${res.status} ${errText}`);
  }

  const data = await res.json();
  return data;
}