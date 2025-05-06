const { spawnSync } = require('child_process');
const path = require('path');

const testFile = process.argv[2];
if (!testFile) {
  console.error('Please provide a test file path');
  process.exit(1);
}

const result = spawnSync('node', [
  '--max-old-space-size=128',
  '--gc-interval=25',
  '--expose-gc',
  path.join(__dirname, '../node_modules/jest/bin/jest.js'),
  '--no-cache',
  '--runInBand',
  '--detectOpenHandles',
  '--forceExit',
  '--silent',
  testFile
], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_OPTIONS: '--max-old-space-size=128'
  }
});