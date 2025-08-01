import { askLLM } from '../src/llm/openai';

async function main() {
  const answer = await askLLM('What is the current sentiment on Solana meme coins?');
  console.log('LLM response:', answer);
}

main();