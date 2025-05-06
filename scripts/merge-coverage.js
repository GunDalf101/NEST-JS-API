const fs = require('fs');
const path = require('path');

const coverageDir = path.join(__dirname, '../coverage');
const unitCoverageDir = path.join(coverageDir, 'unit');
const e2eCoverageDir = path.join(coverageDir, 'e2e');

// Create merged coverage directory if it doesn't exist
if (!fs.existsSync(coverageDir)) {
  fs.mkdirSync(coverageDir);
}

// Read coverage data
const unitCoverage = require(path.join(unitCoverageDir, 'coverage-final.json'));
const e2eCoverage = require(path.join(e2eCoverageDir, 'coverage-final.json'));

// Merge coverage data
const mergedCoverage = { ...unitCoverage };
Object.keys(e2eCoverage).forEach(file => {
  if (mergedCoverage[file]) {
    // If file exists in both coverages, merge statement counts
    const unitStatements = mergedCoverage[file].s;
    const e2eStatements = e2eCoverage[file].s;
    Object.keys(unitStatements).forEach(key => {
      unitStatements[key] += e2eStatements[key] || 0;
    });
  } else {
    // If file only exists in e2e coverage, add it to merged coverage
    mergedCoverage[file] = e2eCoverage[file];
  }
});

// Write merged coverage data
fs.writeFileSync(
  path.join(coverageDir, 'coverage-final.json'),
  JSON.stringify(mergedCoverage, null, 2),
);

console.log('Coverage reports merged successfully!');