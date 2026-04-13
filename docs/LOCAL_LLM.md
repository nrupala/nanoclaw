# Local LLM Setup for NanoClaw

NanoClaw can run with local LLM models instead of the Anthropic API. This guide covers setup with Ollama or LM Studio.

## Why Local LLMs?

- No API costs - run models locally
- Privacy - conversations stay on your machine
- Offline capability - works without internet
- Use any model - Ollama has hundreds of models available

## Prerequisites

- Windows 10/11 with WSL2 enabled, or macOS/Linux
- Docker Desktop with WSL2 backend (Windows)
- [Ollama](https://ollama.ai) or [LM Studio](https://lmstudio.ai)

## Quick Start

### 1. Install Ollama

Download from https://ollama.ai and run. It will start automatically on port 11434.

```bash
# Pull a coding model (recommended for code tasks)
ollama pull stable-code:3b-code-q4_0

# Or use Qwen for general tasks
ollama pull qwen3.5:9b
```

### 2. Start the Fast Server

The fast-ollama-server proxies requests to Ollama with optimized formatting:

```bash
# Windows (PowerShell)
node container\fast-ollama-server\server-windows.cjs

# Or macOS/Linux
node container/fast-ollama-server/server-linux.cjs
```

The server runs on port 8080 and accepts the same API format as Claude.

### 3. Configure NanoClaw

Create or edit your `.env` file:

```bash
# Use local Ollama via the fast server
CONTAINER_IMAGE=nanoclaw-agent-fast:latest
SERVER_URL=http://localhost:8080
MODEL=stable-code:3b-code-q4_0

# Telegram bot (get from @BotFather)
TELEGRAM_BOT_TOKEN=your-bot-token
```

### 4. Start NanoClaw

```bash
npm run dev
```

Message your Telegram bot to test. The bot should respond using the local model.

## Using LM Studio

LM Studio provides a UI and alternative local inference:

1. Download from https://lmstudio.ai
2. Start LM Studio and load a model
3. It runs on port 1234 by default

Configure NanoClaw:

```bash
CONTAINER_IMAGE=nanoclaw-agent-lmstudio:latest
SERVER_URL=http://localhost:1234/v1
MODEL=your-model-name
```

## Custom Docker Images

The project includes pre-built images:

| Image                            | Description                          |
| -------------------------------- | ------------------------------------ |
| `nanoclaw-agent-fast:latest`     | Optimized for Ollama via fast server |
| `nanoclaw-agent-lmstudio:latest` | For LM Studio                        |
| `nanoclaw-agent-ollama:latest`   | Direct Ollama connection             |

Build your own:

```bash
# Build fast agent
docker build -t nanoclaw-agent-fast:latest -f container/agent-runner-fast/Dockerfile container/agent-runner-fast

# Or build all
./container/build.sh
```

## Network Troubleshooting

### WSL2 Docker Can't Reach Windows Host

If running Docker in WSL2 and the container can't reach the Windows-hosted Ollama server:

The `--network=host` flag is now enabled by default in the container runner. This allows the container to access Windows host services directly.

### Common Issues

**Connection refused:**

- Verify Ollama is running: `curl http://localhost:11434/api/tags`
- Check the fast server: `curl http://localhost:8080/health`

**Model not found:**

- Pull the model: `ollama pull stable-code:3b-code-q4_0`

**Slow responses:**

- Try a smaller model like `stable-code:3b-code-q4_0` (1.6GB)
- Or use `qwen2.5-coder:1.5b` for fastest responses

## Recommended Models

| Model                    | Size  | Best For                |
| ------------------------ | ----- | ----------------------- |
| stable-code:3b-code-q4_0 | 1.6GB | Code tasks, fastest     |
| qwen2.5-coder:1.5b       | 1GB   | Very fast, simple tasks |
| qwen3.5:9b               | 5.5GB | General tasks           |
| deepseek-coder:6.7b      | 4GB   | Advanced coding         |

## API Format

The fast server exposes:

```
GET /health          - Health check
POST /v1/messages    - Chat completions (Anthropic-compatible)
```

Request format:

```json
{
  "model": "stable-code:3b-code-q4_0",
  "messages": [{ "role": "user", "content": "Hello" }],
  "max_tokens": 1024
}
```

## Security Notes

- Local models run entirely on your machine
- No data leaves your network
- Credentials stay in your `.env` file (already gitignored)
- The container is isolated from your filesystem

## Performance

Local models are slower than cloud APIs but suitable for:

- Learning and experimentation
- Simple tasks and queries
- Offline use
- Cost-sensitive scenarios

For production use, consider the Anthropic API for speed and capability.
