const { spawn } = require('child_process');
const fs = require('fs');

const input = fs.readFileSync(
  'container/agent-runner-fast/test-input.json',
  'utf8',
);
const child = spawn('node', ['container/agent-runner-fast/dist/index.js'], {
  env: {
    ...process.env,
    SERVER_URL: 'http://localhost:8090',
    MODEL: 'stable-code:3b-code-q4_0',
  },
  stdio: ['pipe', 'pipe', 'pipe'],
});

child.stdin.write(input);
child.stdin.end();

child.stdout.on('data', (d) => console.log('OUT:', d.toString()));
child.stderr.on('data', (d) => console.error('ERR:', d.toString()));

setTimeout(() => child.kill(), 30000);
