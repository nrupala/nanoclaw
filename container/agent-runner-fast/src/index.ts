/**
 * NanoClaw Agent - Self-contained test mode (reads from file)
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

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
  const url = new URL(`${SERVER_URL}/v1/chat/completions`);
  const isHttps = url.protocol === 'https:';
  const lib = isHttps ? https : http;

  return new Promise((resolve, reject) => {
    const req = lib.request(
      {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve(json.choices?.[0]?.message?.content || 'No response');
          } catch {
            reject(new Error(data));
          }
        });
      },
    );
    req.on('error', reject);
    req.write(
      JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: 'You are Andy, a helpful AI assistant.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 512,
      }),
    );
    req.end();
  });
}

// Try reading from /tmp/test-input.json first (mounted file)
let input = '';
const testFile = '/tmp/test-input.json';
if (fs.existsSync(testFile)) {
  input = fs.readFileSync(testFile, 'utf8');
}

// Fallback: use command-line argument
if (!input && process.argv.length > 2) {
  input = process.argv[2];
}

// Test mode: generate test input file
if (process.argv.includes('--test')) {
  const testInput: ContainerInput = {
    prompt: process.argv.includes('--prompt')
      ? process.argv[process.argv.indexOf('--prompt') + 1]
      : 'Say hello in one word',
    sessionId: 'test-' + Date.now(),
    groupFolder: 'test',
    chatJid: 'test',
    isMain: true,
  };
  fs.writeFileSync(testFile, JSON.stringify(testInput));
  console.log('Test input saved to', testFile);
  process.exit(0);
}

if (!input.trim()) {
  process.exit(0);
}

const config: ContainerInput = JSON.parse(input);
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
