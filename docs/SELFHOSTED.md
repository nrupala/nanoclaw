# NanoClaw Self-Hosted - Local AI Assistant

A self-hosted AI assistant that runs entirely on your machine with local LLM models. No cloud APIs, no subscriptions, no dependencies on external services.

## Why Self-Hosted?

| Aspect   | Regular NanoClaw             | Self-Hosted NanoClaw    |
| -------- | ---------------------------- | ----------------------- |
| AI Model | Claude API (cloud)           | Local Ollama/LM Studio  |
| Costs    | API usage fees               | One-time model download |
| Privacy  | Data via cloud               | Data stays local        |
| Internet | Required                     | Works offline           |
| Setup    | Requires Claude Code account | Just Docker + Ollama    |
| Speed    | Fast (cloud)                 | Depends on hardware     |

## Requirements

### Hardware

- Windows 10/11 with WSL2, or macOS/Linux
- 8GB RAM minimum (16GB recommended)
- 10GB free disk space
- Docker Desktop

### Software

- [Docker Desktop](https://docker.com/products/docker-desktop)
- [Ollama](https://ollama.ai) or [LM Studio](https://lmstudio.ai)
- Node.js 20+ (for development)

### Optional

- Telegram bot token (free from @BotFather)

## What's Different from Regular NanoClaw?

### No Claude Code Account Needed

Regular NanoClaw requires:

- Claude Code subscription
- Anthropic API key
- Credit card for API usage

Self-hosted NanoClaw needs:

- Ollama (free download)
- A model (free, downloaded once)

### Local-First Architecture

```
Regular:  Message --> Cloud API --> Claude --> Response
Self-Hosted: Message --> Local Ollama --> Response
```

### Complete Privacy

Your conversations never leave your machine. This is important for:

- Sensitive work discussions
- Personal matters
- Learning without internet tracking

## Why This Matters for the World

### 1. Accessibility

Not everyone has access to Claude API or can afford API calls. Self-hosted works for:

- Students in developing countries
- Privacy-conscious users
- Offline environments
- Organizations with data compliance needs

### 2. Cost

API calls add up. With local models:

- No per-message costs
- No credit card required
- One-time hardware investment

### 3. Learning

Running local AI helps understand:

- How AI models work
- System prompts and behaviors
- Containerization

### 4. Customization

With local models, you can:

- Fine-tune your own models
- Use specialized models for code, writing, analysis
- Experiment without limits

## Quick Comparison

| Feature            | Cloud AI   | Self-Hosted         |
| ------------------ | ---------- | ------------------- |
| Cost per 1000 msgs | ~$1-3      | $0 after setup      |
| Setup time         | 10 minutes | 30 minutes          |
| Privacy            | Partial    | Complete            |
| Offline            | No         | Yes                 |
| Speed              | Fast       | Depends on hardware |
| Custom models      | Limited    | Full control        |

## Is Self-Hosted Right for You?

Choose **Regular NanoClaw** if:

- You have reliable internet
- You want the best AI capability
- Speed is critical
- You have Claude API access

Choose **Self-Hosted NanoClaw** if:

- You want zero API costs
- Privacy is important
- You want to learn about AI
- Internet is unreliable
- You have appropriate hardware

## Performance Expectations

With a good local setup (16GB RAM, decent CPU):

| Task             | Response Time |
| ---------------- | ------------- |
| Simple questions | 2-5 seconds   |
| Code reviews     | 5-15 seconds  |
| Complex analysis | 15-30 seconds |

## Getting Started

See [LOCAL_LLM.md](LOCAL_LLM.md) for setup instructions.

Summary:

1. Install Ollama
2. Start the fast server
3. Configure .env
4. Run NanoClaw

## Supported Models

Start with these free models:

- **stable-code:3b-code-q4_0** - Fast, good for code (1.6GB)
- **qwen2.5-coder:1.5b** - Very fast (1GB)
- **llama3.2:3b** - General purpose (2GB)
- **qwen3.5:9b** - More capable (5.5GB)

## FAQ

**Q: Is it as good as Claude?**
A: Local models are generally less capable than Claude for complex reasoning, but excellent for code tasks and simple queries.

**Q: Can I use GPU acceleration?**
A: Yes, Ollama uses CUDA (NVIDIA) or Metal (Apple Silicon) automatically.

**Q: What if I need better AI?**
A: Start with self-hosted, upgrade to cloud for difficult tasks.

**Q: Can I switch back and forth?**
A: Yes, just change SERVER_URL in .env

## The Bigger Picture

Self-hosted AI represents a shift toward:

- Decentralized AI infrastructure
- User-owned computing
- Privacy-first design
- Accessible AI for everyone

This isn't about replacing cloud AI - it's about having choices.
