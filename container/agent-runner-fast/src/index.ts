/**
 * NanoClaw Agent Runner Fast - Local LLM version
 * Reads JSON from stdin, queries local LLM, outputs with markers
 */

import http from 'http';
import https from 'https';

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

const OUTPUT_START = '---NANOCLAW_OUTPUT_START---';
const OUTPUT_END = '---NANOCLAW_OUTPUT_END---';

function log(msg: string): void {
  console.error(`[runner-fast] ${msg}`);
}

async function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => {
      resolve(data);
    });
    process.stdin.on('error', reject);
  });
}

function writeOutput(output: ContainerOutput): void {
  console.log(OUTPUT_START);
  console.log(JSON.stringify(output));
  console.log(OUTPUT_END);
}

function makeRequest(url: string, data: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const isHttps = parsed.protocol === 'https:';
    const lib = isHttps ? https : http;

    const req = lib.request(
      {
        hostname: parsed.hostname,
        port: parsed.port || (isHttps ? 443 : 80),
        path: parsed.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(body);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${body.slice(0, 200)}`));
          }
        });
      },
    );

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function queryLLM(prompt: string): Promise<string> {
  const serverUrl =
    process.env.SERVER_URL || 'http://host.docker.internal:8090';
  const model = process.env.MODEL || 'stable-code:3b-code-q4_0';

  log(`Server: ${serverUrl}, Model: ${model}`);

  const requestBody = JSON.stringify({
    model,
    messages: [
      {
        role: 'system',
        content:
          'You are Andy, a helpful AI assistant. Keep responses short and concise.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 512,
  });

  try {
    const response = await makeRequest(
      `${serverUrl}/v1/chat/completions`,
      requestBody,
    );
    const json = JSON.parse(response);
    const content = json.choices?.[0]?.message?.content;
    return content || 'No response from model';
  } catch (err) {
    log(`LLM error: ${err}`);
    throw err;
  }
}

async function main(): Promise<void> {
  log('Starting...');

  let input: string;
  try {
    input = await readStdin();
  } catch (err) {
    log(`Failed to read stdin: ${err}`);
    process.exit(0);
  }

  if (!input.trim()) {
    log('No input received');
    process.exit(0);
  }

  let config: ContainerInput;
  try {
    config = JSON.parse(input);
  } catch (err) {
    log(`Failed to parse input: ${err}`);
    writeOutput({ status: 'error', result: null, error: 'Invalid JSON input' });
    return;
  }

  log(`Prompt: ${config.prompt.slice(0, 50)}...`);

  const output: ContainerOutput = {
    status: 'success',
    result: null,
    newSessionId: config.sessionId || `session-${Date.now()}`,
  };

  try {
    output.result = await queryLLM(config.prompt);
    log(`Response: ${output.result?.slice(0, 50)}...`);
  } catch (err) {
    output.status = 'error';
    output.error = err instanceof Error ? err.message : String(err);
    log(`Error: ${output.error}`);
  }

  writeOutput(output);
}

main().catch((err) => {
  log(`Fatal: ${err}`);
  writeOutput({ status: 'error', result: null, error: String(err) });
});
