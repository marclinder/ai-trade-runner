// scripts/invokeAgent.ts

import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { fromIni } from "@aws-sdk/credential-provider-ini";

// Set your function name and AWS region
const FUNCTION_NAME = "AgentLambda-stage";
const REGION = "us-east-1";
const PROFILE = "trade-bot";

async function invokeLambda() {
  // Set up Lambda client with credentials from your named profile
  const client = new LambdaClient({
    region: REGION,
    credentials: fromIni({ profile: PROFILE }),
  });

  // Prepare the command
  const command = new InvokeCommand({
    FunctionName: FUNCTION_NAME,
    InvocationType: "RequestResponse", // or 'Event' for async
    Payload: Buffer.from(JSON.stringify({})), // Adjust if needed
  });

  try {
    // Send the command to invoke Lambda
    const response = await client.send(command);

    const payloadBuffer = response.Payload;
    const payloadText = payloadBuffer
      ? Buffer.from(payloadBuffer).toString("utf8")
      : "No payload returned";

    console.log("Lambda response:");
    console.log(payloadText);
  } catch (error) {
    console.error("Error invoking Lambda:", error);
  }
}

invokeLambda();
