/**
 * Fast Ollama Server - Simple HTTP Proxy
 * Converts OpenAI format to Ollama format
 */

const http = require('http');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL = process.env.MODEL || 'stable-code:3b-code-q4_0';
const PORT = process.env.PORT || 8090;

const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = req.url;

  // GET endpoints - health check
  if (url === '/' || url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', model: MODEL }));
    return;
  }

  // POST /v1/chat/completions
  if (url === '/v1/chat/completions' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const { messages, temperature = 0.7, max_tokens = 512 } = data;

        console.log('📥 Chat request, messages:', messages?.length);

        const ollamaRes = await fetch(`${OLLAMA_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: MODEL,
            messages: messages || [],
            temperature,
            max_tokens,
            stream: false,
          }),
        });

        if (!ollamaRes.ok) {
          const err = await ollamaRes.text();
          console.log('❌ Ollama error:', err.slice(0, 100));
          res.writeHead(ollamaRes.status, {
            'Content-Type': 'application/json',
          });
          res.end(JSON.stringify({ error: err }));
          return;
        }

        const ollamaData = await ollamaRes.json();
        console.log('✅ Response received');

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            choices: [
              {
                message: {
                  role: 'assistant',
                  content: ollamaData.message?.content || 'No response',
                },
              },
            ],
            model: MODEL,
            usage: {
              prompt_tokens: ollamaData.prompt_eval_count || 0,
              completion_tokens: ollamaData.eval_count || 0,
            },
          }),
        );
      } catch (err) {
        console.log('❌ Parse error:', err.message);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`✅ Fast Ollama Server ready on http://localhost:${PORT}`);
  console.log(`   Model: ${MODEL}`);
  console.log(`   Test: curl http://localhost:${PORT}/health`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`❌ Port ${PORT} in use`);
  }
});
