# Self-Hosted NanoClaw Build Plan

## Current Architecture (Original)

```
Docker Container (nanoclaw-agent)
  └── agent-runner/index.ts
       └── query() from @anthropic-ai/claude-agent-sdk
            └── Claude API (cloud)
```

## Target Architecture (Self-Hosted)

```
NanoClaw Core (Node.js)
  └── Docker Container (nanoclaw-agent-fast)
       └── agent-runner-fast/index.ts (NEW)
            └── HTTP to localhost:8080
                 └── Fast Ollama Server
                      └── Ollama (local)
```

## What We Need to Build

### 1. Fast Ollama Server (`server-windows.cjs`)

**Purpose**: Proxies local Ollama with OpenAI-compatible API

**Current Issues**:

- JSON parsing fails with curl
- No GET / endpoint for health checks

**Required Endpoints**:
| Endpoint | Method | Purpose |
|---------|--------|---------|
| `/` | GET | Health check |
| `/health` | GET | Health check |
| `/v1/chat/completions` | POST | Chat completions (main) |
| `/v1/messages` | POST | Anthropic-compatible |

**Request Format** (OpenAI):

```json
{
  "model": "stable-code:3b-code-q4_0",
  "messages": [
    { "role": "system", "content": "You are Andy, a helpful AI assistant." },
    { "role": "user", "content": "User message" }
  ],
  "temperature": 0.7,
  "max_tokens": 512
}
```

**Response Format** (OpenAI):

```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "Response text"
      }
    }
  ]
}
```

### 2. Agent Runner Fast (`agent-runner-fast/src/index.ts`)

**Purpose**: Replace Claude Agent SDK with local LLM

**Input**: Same ContainerInput via stdin

```json
{
  "prompt": "User message...",
  "sessionId": "session-123",
  "groupFolder": "Telegram",
  "chatJid": "tg:924669303",
  "isMain": false,
  "assistantName": "@Andy"
}
```

**Output**: Same OUTPUT_MARKER format

```
---NANOCLAW_OUTPUT_START---
{"status":"success","result":"Response text","newSessionId":"session-456"}
---NANOCLAW_OUTPUT_END---
```

**Functions Needed**:

1. Read JSON from stdin
2. Format prompt with system message
3. Call fast-ollama-server
4. Parse response
5. Output with markers

### 3. Dockerfile (agent-runner-fast)

**Purpose**: Build container with agent-runner-fast

**Base**: node:22-slim
**Dependencies**: None - uses built-in fetch

---

## Test Plan

### Phase 1: Test Fast Ollama Server

```bash
# 1. Start server
node container/fast-ollama-server/server-windows.cjs

# 2. Health check
curl http://localhost:8080/
# Expected: {"status":"ok",...}

# 3. Chat completion
curl -X POST http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"stable-code:3b-code-q4_0","messages":[{"role":"user","content":"hello"}],"max_tokens":50}'
# Expected: {"choices":[{"message":{"content":"..."}}]}
```

### Phase 2: Test Agent Runner Fast (outside Docker)

```bash
# 1. Test input
echo '{"prompt":"Say hello","sessionId":"test","groupFolder":"test","chatJid":"test","isMain":true}' | \
  node container/agent-runner-fast/dist/index.js
# Expected: OUTPUT_START_MARKER + JSON + OUTPUT_END_MARKER
```

### Phase 3: Test Docker Container

```bash
# 1. Build
docker build -t nanoclaw-agent-fast:latest -f container/agent-runner-fast/Dockerfile container/agent-runner-fast

# 2. Run
echo '{"prompt":"Say hi","sessionId":"test","groupFolder":"test","chatJid":"test","isMain":true}' | \
  docker run --rm -i --network=host nanoclaw-agent-fast
# Expected: OUTPUT markers with response
```

### Phase 4: Test Full Integration

```bash
# 1. Start fast server
node container/fast-ollama-server/server-windows.cjs

# 2. Start NanoClaw
npm run dev

# 3. Send message to Telegram bot
# Expected: Bot responds with local LLM response
```

---

## Gap Analysis

| Component          | Current State | Required     | Status      |
| ------------------ | ------------- | ------------ | ----------- |
| Fast Ollama Server | Has bugs      | Fixed server | In Progress |
| Agent Runner Fast  | Has bugs      | Fixed runner | Not done    |
| Dockerfile         | Exists        | Tested       | Not done    |
| Network=host       | Configured    | Verified     | Done        |
| Container Image    | Built         | Tested       | Not done    |

---

## Implementation Steps

### Step 1: Fix Fast Ollama Server

- [x] Add GET / endpoint
- [ ] Fix JSON parsing
- [ ] Add logging
- [ ] Test with curl

### Step 2: Fix Agent Runner Fast

- [ ] Fix output markers
- [ ] Add proper error handling
- [ ] Use environment variables
- [ ] Build TypeScript

### Step 3: Build Docker Image

- [ ] Fix Dockerfile if needed
- [ ] Build image
- [ ] Test locally

### Step 4: Full Integration Test

- [ ] Start server
- [ ] Start NanoClaw
- [ ] Send Telegram message
- [ ] Verify response

---

## Files to Modify/Create

| File                                              | Action                            |
| ------------------------------------------------- | --------------------------------- |
| `container/fast-ollama-server/server-windows.cjs` | Fix JSON parsing, add endpoints   |
| `container/agent-runner-fast/src/index.ts`        | Fix output format, error handling |
| `container/agent-runner-fast/Dockerfile`          | Review                            |

---

## Success Criteria

1. `curl http://localhost:8080/` returns health JSON
2. `curl -X POST .../v1/chat/completions` returns valid response
3. Docker container outputs correct markers
4. Telegram bot receives and responds to messages
5. Full conversation works end-to-end
