FROM node:22-slim
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json tsconfig.json ./
RUN npm install
COPY src ./src
RUN npx tsc
RUN mkdir -p /workspace/group /workspace/ipc/input
RUN printf '#!/bin/bash\ncd /app\necho "Starting agent-runner-fast..."\nnode dist/index.js\n' > entrypoint.sh && chmod +x entrypoint.sh
USER node
WORKDIR /workspace/group
ENTRYPOINT ["/app/entrypoint.sh"]