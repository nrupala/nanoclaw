/**
 * NanoClaw Agent Runner - Ollama Version
 * Uses Ollama's /v1/chat API (OpenAI-compatible)
 */

import fs from 'fs';
import path from 'path';

interface ContainerInput {
  prompt: string;
  sessionId?: string;
  groupFolder: string;
  chatJid: string;
  isMain: boolean;
  assistantName?: string;
}

interface ContainerOutput {
  status: 'success' | 'error';
  result: string | null;
  newSessionId?: string;
  error?: string;
}

const OLLAMA_URL =
  process.env.OLLAMA_URL || 'http://host.docker.internal:11434';
const MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

async function queryOllama(prompt: string, context?: string): Promise<string> {
  const systemPrompt = context
    ? `You are ${process.env.ASSISTANT_NAME || 'Andy'}, a helpful AI assistant. Context:\n${context}`
    : `You are ${process.env.ASSISTANT_NAME || 'Andy'}, a helpful AI assistant.`;

  const response = await fetch(`${OLLAMA_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Ollama error: ${response.status} ${err}`);
  }

  const data = (await response.json()) as {
    choices: { message: { content: string } }[];
  };
  return data.choices[0]?.message?.content || 'No response from model';
}

async function run() {
  let input = '';
  process.stdin.setEncoding('utf8');

  for await (const chunk of process.stdin) {
    input += chunk;
  }

  if (!input.trim()) {
    console.error('No input received');
    process.exit(1);
  }

  let config: ContainerInput;
  try {
    config = JSON.parse(input);
  } catch {
    console.error('Invalid JSON input');
    process.exit(1);
  }

  const output: ContainerOutput = {
    status: 'success',
    result: null,
  };

  try {
    let context = '';
    const sessionPath = path.join(
      '/workspace/group',
      '.claude',
      'session.json',
    );
    if (fs.existsSync(sessionPath)) {
      const session = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
      context = session.summary || '';
    }

    const response = await queryOllama(config.prompt, context);
    output.result = response;
    output.newSessionId = config.sessionId || `session-${Date.now()}`;
  } catch (err) {
    output.status = 'error';
    output.error = err instanceof Error ? err.message : String(err);
  }

  console.log('OUTPUT_START_MARKER');
  console.log(JSON.stringify(output));
  console.log('OUTPUT_END_MARKER');
}

run().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
