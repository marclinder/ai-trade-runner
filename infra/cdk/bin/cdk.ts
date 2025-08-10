#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as path from 'path';
import dotenv from 'dotenv';

import { assertStage } from '../lib/stage';
import { PersistenceStack } from '../lib/persistence-stack';
import { TradingStack } from '../lib/trading-stack';

const app = new cdk.App();
const stage = assertStage(app.node.tryGetContext('stage') ?? process.env.STAGE);

// Load per-stage env before constructing stacks.
dotenv.config({ path: path.resolve(__dirname, `../../../.env.${stage}`) });

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
};

// 1) Create persistence first so we can pass constructs.
const persistence = new PersistenceStack(app, `Persistence-${stage}`, { stage, env });

// 2) Create trading stack and pass the whole persistence stack.
const trading = new TradingStack(app, `Trading-${stage}`, {
  stage,
  env,
  persistence,
});
cdk.Tags.of(persistence).add('env', stage);
cdk.Tags.of(persistence).add('app', 'ai-trade-runner');
cdk.Tags.of(trading).add('env', stage);
cdk.Tags.of(trading).add('app', 'ai-trade-runner');
