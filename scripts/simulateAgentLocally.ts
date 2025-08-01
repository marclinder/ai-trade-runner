import { handler as agentHandler } from "../src/agent";

async function simulate() {
  const result = await agentHandler();
  console.log(JSON.stringify(result, null, 2));
}

simulate();