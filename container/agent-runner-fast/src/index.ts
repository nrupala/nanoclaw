/**
 * NanoClaw Agent Runner - Fast Server Version (Fixed stdin)
 */

import fs from 'fs';
import path from 'path';

interface ContainerInput {
  prompt: string;
  sessionId?: string;
  groupFolder: string;
  chatJid: string;
  isMain: boolean;
}

interface ContainerOutput {
  status: 'success' | 'error';
  result: string | null;
  newSessionId?: string;
  error?: string;
}

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:8080';
const MODEL = process.env.MODEL || 'stable-code:3b-code-q4_0';

async function queryServer(prompt: string): Promise<string> {
  const response = await fetch(`${SERVER_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: 'You are Andy, a helpful AI assistant.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) throw new Error(`Error: ${response.status}`);
  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'No response';
}

const inputData = fs.readFileSync('/dev/stdin', 'utf8').trim();
if (!inputData) {
  console.error('No input received');
  process.exit(1);
}

const config: ContainerInput = JSON.parse(inputData);
const output: ContainerOutput = { status: 'success', result: null };

try {
  output.result = await queryServer(config.prompt);
  output.newSessionId = config.sessionId || `session-${Date.now()}`;
} catch (err) {
  output.status = 'error';
  output.error = err instanceof Error ? err.message : String(err);
}

console.log('OUTPUT_START_MARKER');
console.log(JSON.stringify(output));
console.log('OUTPUT_END_MARKER');
