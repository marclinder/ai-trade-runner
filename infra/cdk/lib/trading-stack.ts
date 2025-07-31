import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as path from 'path';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

export class TradingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const agentLambda = new NodejsFunction(this, 'AgentLambda', {
      entry: path.resolve(__dirname, '../../../src/agent/index.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      bundling: {
        sourceMap: true,
        sourcesContent: true,
        externalModules: ['aws-sdk'], // already available in Lambda runtime
      },
      environment: {
        NODE_OPTIONS: '--enable-source-maps',
      },
    });

    // EventBridge rule to run every 5 minutes
    new events.Rule(this, 'TradingSchedule', {
      schedule: events.Schedule.rate(cdk.Duration.minutes(5)),
      targets: [new targets.LambdaFunction(agentLambda)],
    });
  }
}
