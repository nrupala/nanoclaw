/**
 * NanoClaw Agent Runner - Windows Native (reads from stdin)
 */

const http = require('http');
const readline = require('readline');

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:8080';
const MODEL = process.env.MODEL || 'stable-code:3b-code-q4_0';

async function queryServer(prompt) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: 'You are Andy, a helpful AI assistant.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 512,
    });

    const url = new URL(SERVER_URL + '/v1/chat/completions');
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port || 80,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length,
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(body);
            resolve(json.choices?.[0]?.message?.content || 'No response');
          } catch {
            reject(new Error(body));
          }
        });
      },
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
let input = '';
rl.on('line', (line) => (input += line));
rl.on('close', async () => {
  try {
    const config = JSON.parse(input);
    const result = await queryServer(config.prompt);
    console.log('OUTPUT_START_MARKER');
    console.log(
      JSON.stringify({
        status: 'success',
        result,
        newSessionId: config.sessionId,
      }),
    );
    console.log('OUTPUT_END_MARKER');
  } catch (err) {
    console.log('OUTPUT_START_MARKER');
    console.log(JSON.stringify({ status: 'error', error: err.message }));
    console.log('OUTPUT_END_MARKER');
  }
});
