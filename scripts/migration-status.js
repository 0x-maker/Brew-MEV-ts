#!/usr/bin/env node

/**
 * Migration Status Reporter
 * 
 * This script analyzes the codebase to report on the TypeScript migration progress.
 * It counts JavaScript and TypeScript files and calculates the migration percentage.
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Directories to analyze
const dirsToAnalyze = [
  'app',
  'cli',
  'components',
  'services',
  'utils'
];

// Extensions to count
const jsExtensions = ['.js', '.jsx'];
const tsExtensions = ['.ts', '.tsx'];

// Files to ignore
const ignoreFiles = [
  'node_modules',
  '.next',
  'dist',
  'out'
];

// Stats object
const stats = {
  total: {
    js: 0,
    ts: 0
  },
  byDirectory: {}
};

/**
 * Analyzes a directory and counts JS/TS files
 * @param {string} dir - Directory to analyze
 * @param {boolean} isRecursive - Whether to analyze subdirectories
 */
function analyzeDirectory(dir, isRecursive = true) {
  if (!fs.existsSync(dir)) {
    return;
  }

  if (!stats.byDirectory[dir]) {
    stats.byDirectory[dir] = { js: 0, ts: 0 };
  }

  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const fullPath = path.join(dir, file);
    
    // Skip ignored files/directories
    if (ignoreFiles.some(ignore => fullPath.includes(ignore))) {
      return;
    }
    
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && isRecursive) {
      analyzeDirectory(fullPath);
    } else if (stat.isFile()) {
      const ext = path.extname(file).toLowerCase();
      
      if (jsExtensions.includes(ext)) {
        stats.total.js++;
        stats.byDirectory[dir].js++;
      } else if (tsExtensions.includes(ext)) {
        stats.total.ts++;
        stats.byDirectory[dir].ts++;
      }
    }
  });
}

// Analyze all directories
dirsToAnalyze.forEach(dir => analyzeDirectory(dir));

// Calculate overall percentage
const totalFiles = stats.total.js + stats.total.ts;
const migrationPercentage = totalFiles > 0 
  ? Math.round((stats.total.ts / totalFiles) * 100) 
  : 0;

// Print results
console.log(chalk.bold('\n🔄 TypeScript Migration Status\n'));
console.log(chalk.cyan(`Overall Progress: ${chalk.bold(`${migrationPercentage}%`)}`));
console.log(chalk.cyan(`Total TypeScript Files: ${chalk.bold(stats.total.ts)}`));
console.log(chalk.cyan(`Total JavaScript Files: ${chalk.bold(stats.total.js)}`));
console.log(chalk.cyan(`Total Files: ${chalk.bold(totalFiles)}`));

console.log(chalk.bold('\nProgress by Directory:'));
Object.keys(stats.byDirectory).sort().forEach(dir => {
  const dirStats = stats.byDirectory[dir];
  const dirTotal = dirStats.js + dirStats.ts;
  
  if (dirTotal === 0) return;
  
  const dirPercentage = Math.round((dirStats.ts / dirTotal) * 100);
  const color = dirPercentage === 100 ? 'green' : dirPercentage > 50 ? 'yellow' : 'red';
  
  console.log(`${chalk.gray(dir)}: ${chalk[color](`${dirPercentage}%`)} [TS: ${dirStats.ts}, JS: ${dirStats.js}]`);
});

console.log(chalk.bold('\nRecommendation:'));
if (migrationPercentage < 100) {
  console.log(chalk.yellow('Run the following command to migrate a JavaScript file to TypeScript:'));
  console.log(chalk.gray('npm run migrate-js <source.js> <destination.ts>'));
} else {
  console.log(chalk.green('Migration complete! All files have been converted to TypeScript.'));
}

console.log(''); // Empty line at the end 