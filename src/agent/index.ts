import { Handler } from "aws-lambda";

export const handler: Handler = async (event) => {
  console.log("Agent Lambda invoked with event:", JSON.stringify(event));

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Agent executed successfully.",
      input: event,
    }),
  };
};