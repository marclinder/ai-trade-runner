#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { TradingStack } from '../lib/trading-stack';

const app = new cdk.App();
new TradingStack(app, 'TradingStack');