import { askLLM } from '../src/llm/openai';

async function main() {
  const answer = await askLLM('APPL', 1);
  console.log('LLM response:', answer);
}

main();