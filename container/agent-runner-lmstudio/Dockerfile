FROM node:22-slim
WORKDIR /app
COPY package.json tsconfig.json ./
RUN npm install
COPY src ./src
RUN npx tsc
RUN mkdir -p /workspace/group /workspace/ipc/input
RUN printf '#!/bin/bash\ncat > /tmp/input.json\ncd /app\nnode dist/index.js\n' > entrypoint.sh && chmod +x entrypoint.sh
USER node
WORKDIR /workspace/group
ENTRYPOINT ["/app/entrypoint.sh"]