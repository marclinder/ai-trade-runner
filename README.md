# AI Trade Runner

A modular, AI-augmented trading bot built with TypeScript, AWS CDK, and broker abstraction. Supports stocks, crypto, and (eventually) 0DTE options. Designed for automation, safety, and extensibility.

---

## 📦 Project Structure

```
/src/
  agent/        # Main Lambda logic
  brokers/      # Broker clients (Alpaca, Tastytrade, IBKR)
  strategies/   # Pluggable strategy modules
  utils/        # Logging, risk mgmt, helpers
/infra/
  cdk/          # AWS CDK app (infrastructure as code)
```

---

## Deployment

To deploy the stack from ./infra/cdk:

```bash
npx cdk bootstrap --profile <profile>
npx cdk deploy --profile <profile>
```

You can customize the profile name (e.g. `trade-bot`) in `.aws/credentials`.

---

## 🚀 Status

🔧 **In Progress**  
✅ Project initialized  
🔜 CDK and agent scaffolding in progress

---

## 🛠️ Tasks

### Core Setup
- [x] Initialize repo and structure
- [x] Add `.gitignore`, `.env.example`, `LICENSE`
- [ ] Scaffold CDK app (`cdk init app --language=typescript`)
- [ ] Add Lambda + EventBridge cron job
- [ ] Add Secrets Manager integration
- [ ] Add Budget + kill-switch CDK construct

### Broker Layer
- [ ] Add Alpaca client (basic buy/sell, get balance, etc.)
- [ ] Define broker interface
- [ ] Stub Tastytrade + IBKR clients

### Agent Logic
- [ ] Create Lambda handler (src/agent/index.ts)
- [ ] Load config from `.env` and Secrets Manager
- [ ] Plug in strategy module
- [ ] Support dry-run vs live mode

### Strategies
- [ ] Add a sample swing trade strategy (e.g. SMA crossover)
- [ ] Add 0DTE SPY lotto stub strategy
- [ ] Strategy registry / config system

### Utilities
- [ ] Risk manager (max exposure, stop loss, etc.)
- [ ] Logging to CloudWatch
- [ ] Alerting via SNS (email + SMS)

---

## ⚠️ Disclaimer

This project is for educational and experimental purposes. Use at your own risk. No financial advice is provided.

---

## 📄 License

MIT — see [LICENSE](./LICENSE) for details.
