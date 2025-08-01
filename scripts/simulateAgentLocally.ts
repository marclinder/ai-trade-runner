import { handler as agentHandler } from "../src/agent";
import { AlpacaOrder } from "../src/screeners/types";

async function simulate() {
  const result = await agentHandler();
  const resultObj = JSON.parse(result.body);
  console.log(resultObj.message);
  console.log(resultObj.trades.map((t: AlpacaOrder) => `  ${t.side.toUpperCase()} ${t.symbol} (qty ${t.qty})`).join('\n'));
}

simulate();