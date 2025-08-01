import 'dotenv/config'; // Load .env before anything else
import { handler as agentHandler } from '../src/agent/index';

async function simulate() {
  const event = {}; // optional: stub event
  const context = {}; // optional: stub context
  const result = await agentHandler();
  console.log(JSON.stringify(result, null, 2));
}

simulate();