const { spawnSync } = require('child_process');
const { readdirSync, statSync } = require('fs');
const { join, relative } = require('path');

const TEST_BATCH_SIZE = 3; // Number of test files to run at once
const MEMORY_LIMIT = 256; // Memory limit in MB

function findTestFiles(dir) {
  const files = [];
  
  readdirSync(dir).forEach(file => {
    const fullPath = join(dir, file);
    const relativePath = relative(process.cwd(), fullPath);
    
    if (statSync(fullPath).isDirectory()) {
      files.push(...findTestFiles(fullPath));
    } else if (file.endsWith('.spec.ts')) {
      files.push(relativePath);
    }
  });
  
  return files;
}

function runTestBatch(testFiles) {
  console.log(`\nRunning test batch: ${testFiles.join(', ')}`);
  
  const result = spawnSync('npx', [
    'jest',
    '--runInBand',
    '--no-cache',
    '--silent',
    ...testFiles
  ], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_OPTIONS: `--max-old-space-size=${MEMORY_LIMIT}`
    }
  });
  
  return result.status === 0;
}

// Find all test files
const testFiles = findTestFiles(join(process.cwd(), 'src'));

// Group tests into batches
const batches = [];
for (let i = 0; i < testFiles.length; i += TEST_BATCH_SIZE) {
  batches.push(testFiles.slice(i, i + TEST_BATCH_SIZE));
}

// Run test batches
let failedTests = [];
batches.forEach((batch, index) => {
  console.log(`\nRunning batch ${index + 1} of ${batches.length}`);
  
  if (!runTestBatch(batch)) {
    failedTests.push(...batch);
  }
});

// Report results
if (failedTests.length > 0) {
  console.log('\nFailed tests:');
  failedTests.forEach(test => console.log(`- ${test}`));
  process.exit(1);
} else {
  console.log('\nAll tests passed!');
  process.exit(0);
}