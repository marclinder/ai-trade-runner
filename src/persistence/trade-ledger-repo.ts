// src/persistence/trade-ledger-repo.ts
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, UpdateCommand, QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { TradeLedgerEntry, ExecutionAuditEvent } from './types';

// Initialize once per container (Lambda cold start caches this).
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TL_TABLE = process.env.TABLE_TRADE_LEDGER!;
const AUDIT_TABLE = process.env.TABLE_EXEC_AUDIT!;

// Utility to build sort keys consistently.
function buildSk(entryDateISO: string, id: string): string {
  return `ts#${entryDateISO}#${id}`;
}

// Write a new "pending" trade before broker submit (idempotent by id).
export async function createPendingTrade(e: TradeLedgerEntry, idempotencyKey?: string): Promise<void> {
  // statusSk helps the "open by strategy" GSI, even while pending
  const statusSk = `${e.strategyId}#${e.symbol}#${e.entryDate ?? 'pending'}`;
  await ddb.send(new PutCommand({
    TableName: TL_TABLE,
    Item: {
      ...e,
      sk: buildSk(e.entryDate ?? '1970-01-01T00:00:00Z', e.id),
      statusSk,
      ttl: undefined // add if you want auto-expire pending on failure
    },
    ConditionExpression: 'attribute_not_exists(id)' // idempotency by id
  }));
  // Optional: write an audit event
  await putAuditEvent({
    tradeId: e.id,
    eventTs: new Date().toISOString(),
    kind: 'submit',
    payload: idempotencyKey ? { idempotencyKey } : undefined
  });
}

// Mark filled and set entryPrice/entryDate.
export async function markFilled(tradeId: string, strategyId: string, entryPrice: number, entryDateISO: string, brokerOrderId?: string): Promise<void> {
  const sk = buildSk(entryDateISO, tradeId);
  const statusSk = `${strategyId}#${'UNKNOWN'}#${entryDateISO}`;
  await ddb.send(new UpdateCommand({
    TableName: TL_TABLE,
    Key: { strategyId, sk },
    UpdateExpression: 'SET entryPrice = :p, entryDate = :d, status = :s, statusSk = :ss',
    ExpressionAttributeValues: {
      ':p': entryPrice,
      ':d': entryDateISO,
      ':s': 'open',
      ':ss': statusSk
    }
  }));
  await putAuditEvent({
    tradeId,
    eventTs: new Date().toISOString(),
    kind: 'fill',
    brokerOrderId
  });
}

// Close a trade and set exitPrice/date.
export async function closeTrade(strategyId: string, entryDateISO: string, tradeId: string, exitPrice: number, exitDateISO: string): Promise<void> {
  const sk = buildSk(entryDateISO, tradeId);
  await ddb.send(new UpdateCommand({
    TableName: TL_TABLE,
    Key: { strategyId, sk },
    UpdateExpression: 'SET exitPrice = :p, exitDate = :d, status = :s',
    ExpressionAttributeValues: {
      ':p': exitPrice,
      ':d': exitDateISO,
      ':s': 'closed'
    }
  }));
  await putAuditEvent({
    tradeId,
    eventTs: new Date().toISOString(),
    kind: 'ack',
    brokerMessage: 'Closed via broker fill'
  });
}

// Query all open for a strategy (fast GSI).
export async function listOpenByStrategy(strategyId: string): Promise<TradeLedgerEntry[]> {
  const res = await ddb.send(new QueryCommand({
    TableName: TL_TABLE,
    IndexName: 'GSI_OpenByStrategy',
    KeyConditionExpression: '#status = :open AND begins_with(#ssk, :prefix)',
    ExpressionAttributeNames: { '#status': 'status', '#ssk': 'statusSk' },
    ExpressionAttributeValues: {
      ':open': 'open',
      ':prefix': `${strategyId}#`
    }
  }));
  return (res.Items ?? []) as TradeLedgerEntry[];
}

// Cross-strategy by symbol over a time window.
export async function listBySymbol(symbol: string, fromISO?: string, toISO?: string): Promise<TradeLedgerEntry[]> {
  const res = await ddb.send(new QueryCommand({
    TableName: TL_TABLE,
    IndexName: 'GSI_BySymbol',
    KeyConditionExpression: '#sym = :s' + (fromISO && toISO ? ' AND #ed BETWEEN :a AND :b' : ''),
    ExpressionAttributeNames: { '#sym': 'symbol', '#ed': 'entryDate' },
    ExpressionAttributeValues: Object.assign({ ':s': symbol }, fromISO && toISO ? { ':a': fromISO, ':b': toISO } : {})
  }));
  return (res.Items ?? []) as TradeLedgerEntry[];
}

// Direct id lookup (GSI_ById).
export async function getById(id: string, strategyId: string): Promise<TradeLedgerEntry | null> {
  const res = await ddb.send(new QueryCommand({
    TableName: TL_TABLE,
    IndexName: 'GSI_ById',
    KeyConditionExpression: '#id = :i AND #sid = :s',
    ExpressionAttributeNames: { '#id': 'id', '#sid': 'strategyId' },
    ExpressionAttributeValues: { ':i': id, ':s': strategyId },
    Limit: 1
  }));
  return (res.Items?.[0] as TradeLedgerEntry) ?? null;
}

// Append audit events.
export async function putAuditEvent(ev: ExecutionAuditEvent): Promise<void> {
  await ddb.send(new PutCommand({
    TableName: AUDIT_TABLE,
    Item: {
      ...ev,
      sk: `eventTs#${ev.eventTs}`
    }
  }));
}
