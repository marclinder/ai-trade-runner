// src/plugins/llm-openai/index.ts
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
dotenv.config(); // Load from root .env

const {
  OPENAI_API_KEY,
  OPENAI_MODEL = 'gpt-4o',
  OPENAI_TEMPERATURE = '0.2',
  OPENAI_MAX_TOKENS = '300',
} = process.env;

if (!OPENAI_API_KEY) {
  throw new Error('Missing OpenAI API key in environment variables');
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

export async function askLLM(prompt: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    temperature: parseFloat(OPENAI_TEMPERATURE),
    max_tokens: parseInt(OPENAI_MAX_TOKENS),
    messages: [{ role: 'user', content: prompt }],
  });
  const responseContent = response.choices[0]?.message?.content?.trim() ?? '';
  console.log('askLLM ');
  console.log('   prompt:', prompt);
  console.log('   responseContent:', responseContent);
  return responseContent;
}
