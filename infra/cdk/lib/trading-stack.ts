import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as path from 'path';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

import { Stage } from './stage';
import { PersistenceStack } from './persistence-stack';

interface TradingStackProps extends cdk.StackProps {
  stage: Stage;
  persistence: PersistenceStack; // pass the whole stack
}

export class TradingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TradingStackProps) {
    super(scope, id, props);
    const { stage, persistence } = props;

    // Agent (runs every 5 min)
    const agentLambda = new NodejsFunction(this, `AgentLambda-${stage}`, {
      functionName: `AgentLambda-${stage}`,
      entry: path.resolve(__dirname, '../../../src/agent/index.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: cdk.Duration.seconds(60),
      bundling: { sourceMap: true, sourcesContent: true, externalModules: ['aws-sdk'] },
      environment: {
        STAGE: stage,
        NODE_OPTIONS: '--enable-source-maps',
        TABLE_TRADE_LEDGER: persistence.tradeLedgerTable.tableName,
        TABLE_EXEC_AUDIT: persistence.executionAuditTable.tableName,
        TABLE_PORTFOLIO_SNAPSHOTS: persistence.portfolioSnapshotsTable.tableName,

        // Loaded in bin/app.ts via dotenv per-stage
        ALPACA_API_KEY: process.env.ALPACA_API_KEY ?? '',
        ALPACA_SECRET_KEY: process.env.ALPACA_SECRET_KEY ?? '',
        ALPACA_USE_PAPER: props.stage === 'prod'
          ? (process.env.ALPACA_USE_PAPER ?? 'false')    // allow real live if you really set it
          : 'true',                                      // force paper in stage

        OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? '',
        OPENAI_MODEL: process.env.OPENAI_MODEL ?? 'gpt-4o',
        OPENAI_TEMPERATURE: process.env.OPENAI_TEMPERATURE ?? '0.2',
        OPENAI_MAX_TOKENS: process.env.OPENAI_MAX_TOKENS ?? '300',
        SHOULD_RUN: process.env.SHOULD_RUN ?? 'false',
      },
    });

    // Grant R/W to agent
    persistence.tradeLedgerTable.grantReadWriteData(agentLambda);
    persistence.executionAuditTable.grantReadWriteData(agentLambda);
    persistence.portfolioSnapshotsTable.grantReadWriteData(agentLambda);

    // 5‑minute schedule
    new events.Rule(this, `TradingSchedule-${stage}`, {
      ruleName: `TradingSchedule-${stage}`,
      schedule: events.Schedule.rate(cdk.Duration.minutes(5)),
      targets: [new targets.LambdaFunction(agentLambda)],
    });

    // Daily snapshot lambda (runs once per day)
    const snapshotLambda = new NodejsFunction(this, `SnapshotLambda-${stage}`, {
      functionName: `SnapshotLambda-${stage}`,
      entry: path.resolve(__dirname, '../../../src/utils/snapshotPortfolio.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: cdk.Duration.seconds(60),
      bundling: { sourceMap: true, sourcesContent: true, externalModules: ['aws-sdk'] },
      environment: {
        STAGE: stage,
        TABLE_TRADE_LEDGER: persistence.tradeLedgerTable.tableName,
        TABLE_PORTFOLIO_SNAPSHOTS: persistence.portfolioSnapshotsTable.tableName,
        ALPACA_API_KEY: process.env.ALPACA_API_KEY ?? '',
        ALPACA_SECRET_KEY: process.env.ALPACA_SECRET_KEY ?? '',
        ALPACA_USE_PAPER: process.env.ALPACA_USE_PAPER ?? 'false',
      },
    });

    // Least-privilege for snapshotter
    persistence.tradeLedgerTable.grantReadData(snapshotLambda);
    persistence.portfolioSnapshotsTable.grantReadWriteData(snapshotLambda);

    // Run ~23:55 New York (~03:55 UTC during DST). Adjust if you want exact market close alignment.
    new events.Rule(this, `DailySnapshot-${stage}`, {
      ruleName: `DailySnapshot-${stage}`,
      schedule: events.Schedule.cron({ minute: '55', hour: '3' }),
      targets: [new targets.LambdaFunction(snapshotLambda)],
    });
  }
}
