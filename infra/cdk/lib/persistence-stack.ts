// infra/lib/persistence-stack.ts
import { Stack, StackProps, Duration, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AttributeType, BillingMode, Table, ProjectionType, StreamViewType } from 'aws-cdk-lib/aws-dynamodb';
import { Stage } from './stage';

interface PersistenceStackProps extends StackProps {
  stage: Stage;
}

export class PersistenceStack extends Stack {
  public readonly tradeLedgerTable: Table;
  public readonly executionAuditTable: Table;
  public readonly portfolioSnapshotsTable: Table;

  constructor(scope: Construct, id: string, props: PersistenceStackProps) {
    super(scope, id, props);

    const suffix = props.stage;

    // Core per-strategy ledger
    this.tradeLedgerTable = new Table(this, `TradeLedger-${suffix}`, {
      tableName: `TradeLedger-${suffix}`,
      partitionKey: { name: 'strategyId', type: AttributeType.STRING },
      sortKey: { name: 'sk', type: AttributeType.STRING }, // sk = ts#<entryDate>#<id>
      billingMode: BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      removalPolicy: props.stage === 'prod' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      stream: StreamViewType.NEW_AND_OLD_IMAGES,
      timeToLiveAttribute: 'ttl' // optional; can be used for temp items
    });

    // GSI: find all open by strategy quickly
    this.tradeLedgerTable.addGlobalSecondaryIndex({
      indexName: 'GSI_OpenByStrategy',
      partitionKey: { name: 'status', type: AttributeType.STRING }, // "open"
      sortKey: { name: 'statusSk', type: AttributeType.STRING },    // strategyId#symbol#entryDate
      projectionType: ProjectionType.ALL
    });

    // GSI: cross-strategy by symbol
    this.tradeLedgerTable.addGlobalSecondaryIndex({
      indexName: 'GSI_BySymbol',
      partitionKey: { name: 'symbol', type: AttributeType.STRING },
      sortKey: { name: 'entryDate', type: AttributeType.STRING },
      projectionType: ProjectionType.ALL
    });

    // GSI: direct lookup by id
    this.tradeLedgerTable.addGlobalSecondaryIndex({
      indexName: 'GSI_ById',
      partitionKey: { name: 'id', type: AttributeType.STRING },
      sortKey: { name: 'strategyId', type: AttributeType.STRING },
      projectionType: ProjectionType.ALL
    });

    // Append-only execution audit
    this.executionAuditTable = new Table(this, `ExecutionAudit-${suffix}`, {
      tableName: `ExecutionAudit-${suffix}`,
      partitionKey: { name: 'tradeId', type: AttributeType.STRING },
      sortKey: { name: 'sk', type: AttributeType.STRING }, // sk = eventTs#<iso>
      billingMode: BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      removalPolicy: props.stage === 'prod' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    });

    // Daily portfolio snapshots
    this.portfolioSnapshotsTable = new Table(this, `PortfolioSnapshots-${suffix}`, {
      tableName: `PortfolioSnapshots-${suffix}`,
      partitionKey: { name: 'yyyymmdd', type: AttributeType.STRING },
      sortKey: { name: 'strategyId', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      removalPolicy: props.stage === 'prod' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    });
  }
}
