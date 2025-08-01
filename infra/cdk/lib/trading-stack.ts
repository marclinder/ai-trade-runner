import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as path from 'path';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

import dotenv from 'dotenv'; 
dotenv.config({ path: '../../.env' });

export class TradingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const agentLambda = new NodejsFunction(this, 'AgentLambda', {
      functionName: 'AgentLambda',
      entry: path.resolve(__dirname, '../../../src/agent/index.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: cdk.Duration.seconds(60), 
      bundling: {
        sourceMap: true,
        sourcesContent: true,
        externalModules: ['aws-sdk'], // already available in Lambda runtime
      },
      environment: {
        NODE_OPTIONS: '--enable-source-maps',
        ALPACA_API_KEY: process.env.ALPACA_API_KEY ?? '',
        ALPACA_SECRET_KEY: process.env.ALPACA_SECRET_KEY ?? '',

        ALPACA_USE_PAPER: process.env.ALPACA_USE_PAPER ?? 'false',
        OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? '',
        OPENAI_MODEL: process.env.OPENAI_MODEL ?? 'gpt-4o',
        OPENAI_TEMPERATURE: process.env.OPENAI_TEMPERATURE ?? '0.2',
        OPENAI_MAX_TOKENS: process.env.OPENAI_MAX_TOKENS ?? '300',
        
        SHOULD_RUN: process.env.SHOULD_RUN ?? 'false',
      },
    });
    // EventBridge rule to run every 5 minutes
    new events.Rule(this, 'TradingSchedule', {
      schedule: events.Schedule.rate(cdk.Duration.minutes(5)),
      targets: [new targets.LambdaFunction(agentLambda)],
    });
  }
}
