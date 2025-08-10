// src/ops/snapshotPortfolio.ts
// Daily portfolio snapshotter.
// - Discovers strategies dynamically (no hardcoded names)
// - Reads all open trades from TradeLedger via GSI_OpenByStrategy (status = 'open')
// - Aggregates positions by symbol per strategy
// - Optionally plug in live marks later (uses avgPrice as placeholder)
// - Writes one PortfolioSnapshots item per strategy for the NY-local date

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

// Environment
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TL_TABLE = process.env.TABLE_TRADE_LEDGER!;
const SNAP_TABLE = process.env.TABLE_PORTFOLIO_SNAPSHOTS!;

// Format YYYYMMDD in America/New_York
function yyyymmddNY(): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = fmt.formatToParts(new Date());
  const y = parts.find(p => p.type === 'year')?.value ?? '1970';
  const m = parts.find(p => p.type === 'month')?.value ?? '01';
  const d = parts.find(p => p.type === 'day')?.value ?? '01';
  return `${y}${m}${d}`;
}

type OpenTrade = {
  strategyId: string;
  symbol: string;
  quantity: number;
  entryPrice?: number | null;
  entryDate?: string | null;
  status: 'open';
  // other fields ignored here
};

/**
 * Query all open trades across all strategies using GSI_OpenByStrategy.
 * GSI_OpenByStrategy:
 *   PK = status ("open")
 *   SK = statusSk = strategyId#symbol#entryDate
 */
async function fetchAllOpenTrades(): Promise<OpenTrade[]> {
  const items: OpenTrade[] = [];
  let ExclusiveStartKey: Record<string, unknown> | undefined;

  do {
    const res = await ddb.send(new QueryCommand({
      TableName: TL_TABLE,
      IndexName: 'GSI_OpenByStrategy',
      KeyConditionExpression: '#status = :open',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':open': 'open' },
      ExclusiveStartKey,
    }));

    for (const it of res.Items ?? []) {
      // Defensive parsing with minimal fields
      const strategyId = String(it.strategyId);
      const symbol = String(it.symbol);
      const quantity = Number(it.quantity);
      const entryPrice = typeof it.entryPrice === 'number' ? it.entryPrice : null;
      const entryDate = typeof it.entryDate === 'string' ? it.entryDate : null;

      if (!Number.isFinite(quantity)) continue;
      items.push({
        strategyId,
        symbol,
        quantity,
        entryPrice,
        entryDate,
        status: 'open',
      });
    }

    ExclusiveStartKey = res.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (ExclusiveStartKey);

  return items;
}

export const handler = async () => {
  // 1) Pull all open trades across all strategies
  const openTrades = await fetchAllOpenTrades();

  if (openTrades.length === 0) {
    // Nothing open. You may still want to write a zeroed snapshot per known strategy,
    // but since we are fully dynamic we just exit.
    return { ok: true, wrote: 0, strategies: [] };
  }

  // 2) Bucket by strategyId
  const byStrategy = new Map<string, OpenTrade[]>();
  for (const t of openTrades) {
    const arr = byStrategy.get(t.strategyId) ?? [];
    arr.push(t);
    byStrategy.set(t.strategyId, arr);
  }

  // 3) For each strategy, aggregate positions by symbol
  const dateKey = yyyymmddNY();
  let wrote = 0;
  const strategies: string[] = [];

  for (const [strategyId, trades] of byStrategy.entries()) {
    strategies.push(strategyId);

    // Aggregate quantity and average cost per symbol
    const bySymbol = new Map<string, { qty: number; avgPrice: number }>();
    for (const t of trades) {
      const sym = t.symbol;
      const qty = t.quantity;
      const price = Number(t.entryPrice ?? 0);

      const existing = bySymbol.get(sym) ?? { qty: 0, avgPrice: 0 };
      const newQty = existing.qty + qty;
      const newAvg =
        newQty === 0
          ? 0
          : ((existing.avgPrice * existing.qty) + (price * qty)) / newQty;

      bySymbol.set(sym, { qty: newQty, avgPrice: newAvg });
    }

    // 4) (Optional) fetch live prices here
    // const prices = await getPrices(Array.from(bySymbol.keys()));

    let totalMarketValue = 0;
    const positionsBySymbol: Record<string, { qty: number; avgPrice: number; marketPrice?: number }> = {};

    for (const [sym, pos] of bySymbol.entries()) {
      const marketPrice = /* prices?.[sym] ?? */ pos.avgPrice; // placeholder until broker data is wired
      totalMarketValue += pos.qty * marketPrice;
      positionsBySymbol[sym] = {
        qty: pos.qty,
        avgPrice: Number(pos.avgPrice.toFixed(4)),
        marketPrice: Number(marketPrice.toFixed(4)),
      };
    }

    // 5) Write snapshot row for this strategy
    await ddb.send(new PutCommand({
      TableName: SNAP_TABLE,
      Item: {
        yyyymmdd: dateKey,
        strategyId,
        totalMarketValue: Number(totalMarketValue.toFixed(2)),
        cash: null,                  // fill when broker cash is wired
        realizedPnLToDate: null,     // future calc
        unrealizedPnL: null,         // future calc
        positionsBySymbol,
      },
    }));

    wrote += 1;
  }

  return { ok: true, wrote, strategies };
};
