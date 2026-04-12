/**
 * Fast Ollama API Server for NanoClaw
 * Uses Ollama's /v1/chat API - Already optimized for speed
 */

import express from 'express';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());

const OLLAMA_BASE = process.env.OLLAMA_BASE || 'http://localhost:11434';
const MODEL = process.env.MODEL || 'stable-code:3b-code-q4_0';

console.log(`🤖 Fast Ollama Server starting...`);
console.log(`   Model: ${MODEL}`);
console.log(`   Base: ${OLLAMA_BASE}`);

app.post('/v1/chat/completions', async (req, res) => {
  const { messages, model, temperature = 0.7, max_tokens = 2048 } = req.body;

  try {
    const response = await fetch(`${OLLAMA_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model || MODEL,
        messages,
        temperature,
        max_tokens,
        stream: false,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      res.status(response.status).json({ error: err });
      return;
    }

    const data = await response.json();
    res.json({
      choices: [{ message: { content: data.message?.content || '' } }],
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok', model: MODEL }));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`✅ Fast Ollama Server ready on port ${PORT}`);
});
