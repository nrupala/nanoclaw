/**
 * NanoClaw Agent Runner - LM Studio Version
 * Uses OpenAI-compatible API (v1/chat/completions)
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

const LM_STUDIO_URL =
  process.env.LM_STUDIO_URL || 'http://host.docker.internal:1234';
const MODEL = process.env.LM_STUDIO_MODEL || 'qwen/qwen2.5-coder-14b';

async function queryLMStudio(
  prompt: string,
  context?: string,
): Promise<string> {
  const systemPrompt = context
    ? `You are ${process.env.ASSISTANT_NAME || 'Andy'}, a helpful AI assistant. Context from conversation:\n${context}`
    : `You are ${process.env.ASSISTANT_NAME || 'Andy'}, a helpful AI assistant.`;

  const response = await fetch(`${LM_STUDIO_URL}/v1/chat/completions`, {
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
    throw new Error(`LM Studio error: ${response.status} ${err}`);
  }

  const data = (await response.json()) as {
    choices: { message: { content: string } }[];
  };
  return data.choices[0]?.message?.content || 'No response from model';
}

async function run() {
  // Simple stdin read with event loop
  let input = '';
  process.stdin.resume();

  await new Promise<void>((resolve) => {
    process.stdin.on('data', (chunk: Buffer) => {
      input += chunk.toString();
    });
    process.stdin.on('end', () => resolve());
    process.stdin.on('error', () => resolve());
    // Resolve after a short delay even if no data
    setTimeout(() => resolve(), 1000);
  });

  // Also try reading what's already available
  if (!input) {
    const chunks: Buffer[] = [];
    process.stdin.on('data', (c: Buffer) => chunks.push(c));
    await new Promise<void>((r) => setTimeout(r, 500));
    input = chunks.map((c) => c.toString()).join('');
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

    const response = await queryLMStudio(config.prompt, context);
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
