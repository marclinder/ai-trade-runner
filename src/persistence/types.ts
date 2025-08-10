// All files include comments for clarity.
// src/types/trade-ledger.ts

export type AssetClass = 'equity' | 'option';

export interface BaseTrade {
  id: string;                      // ULID/UUID
  strategyId: string;              // e.g. 'plugin-insiders'
  symbol: string;                  // e.g. 'NVDA' or 'AAPL'
  assetClass: AssetClass;
  action: 'buy' | 'sell';
  quantity: number;
  entryPrice: number | null;       // null until filled
  exitPrice: number | null;        // set when closing
  entryDate: string | null;        // ISO, set at execution/filled time
  exitDate: string | null;         // ISO
  score: number | null;            // strategy confidence (0-10)
  rationale: string | null;        // human-readable reason
  status: 'open' | 'closed' | 'pending' | 'cancelled';
  tags?: string[];
  llmSummary?: string | null;
  pluginMetadata?: Record<string, unknown>; // strategy-specific fields
  rawSignalData?: Record<string, unknown>;
  marketConditions?: Record<string, unknown>;
}

// Options extension. Present only when assetClass === 'option'
export interface OptionFields {
  optionType: 'call' | 'put';
  strikePrice: number;
  expirationDate: string;       // ISO date only, e.g. 2025-09-19
  contractMultiplier?: number;  // usually 100
}

// Union that is easy to validate at runtime.
export type TradeLedgerEntry =
  | (BaseTrade & { assetClass: 'equity' })
  | (BaseTrade & { assetClass: 'option' } & OptionFields);

// Execution audit events for broker reconciliation and forensics.
export interface ExecutionAuditEvent {
  tradeId: string;                   // matches TradeLedgerEntry.id
  eventTs: string;                   // ISO timestamp
  kind: 'submit' | 'ack' | 'fill' | 'partial_fill' | 'cancel' | 'reject';
  brokerOrderId?: string;
  brokerMessage?: string;
  payload?: Record<string, unknown>; // raw SDK response snapshot
}

// Portfolio snapshot rollups for dashboards/backtests.
export interface PortfolioSnapshot {
  yyyymmdd: string;     // partition key
  strategyId: string;   // sort key
  totalMarketValue: number;
  cash: number;
  realizedPnLToDate: number;
  unrealizedPnL: number;
  positionsBySymbol?: Record<string, {
    qty: number;
    avgPrice: number;
    marketPrice?: number;
  }>;
}
