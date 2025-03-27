#!/usr/bin/env node

/**
 * This script helps migrate JavaScript files to TypeScript
 * Usage: node scripts/migrate-to-ts.js <source.js> <destination.ts>
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get command line arguments
const sourceFile = process.argv[2];
const destFile = process.argv[3];

if (!sourceFile || !destFile) {
  console.error('Usage: node scripts/migrate-to-ts.js <source.js> <destination.ts>');
  process.exit(1);
}

// Check if source file exists
if (!fs.existsSync(sourceFile)) {
  console.error(`Source file ${sourceFile} does not exist`);
  process.exit(1);
}

// Read source file
const sourceCode = fs.readFileSync(sourceFile, 'utf8');

// Create destination directory if it doesn't exist
const destDir = path.dirname(destFile);
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Convert requires to imports
let tsCode = sourceCode
  // Convert CommonJS require to ES imports
  .replace(/const\s+(\w+)\s*=\s*require\(['"]([^'"]+)['"]\);?/g, 'import $1 from \'$2\';')
  // Convert destructured require
  .replace(/const\s+\{\s*([^}]+)\s*\}\s*=\s*require\(['"]([^'"]+)['"]\);?/g, (match, imports, module) => {
    const importNames = imports
      .split(',')
      .map(name => name.trim())
      .join(', ');
    return `import { ${importNames} } from '${module}';`;
  })
  // Add JSDoc comments for functions
  .replace(/function\s+(\w+)\s*\(([^)]*)\)\s*\{/g, (match, funcName, params) => {
    return `/**\n * ${funcName} function\n */\nfunction ${funcName}(${params}) {`;
  });

// Write TypeScript file
fs.writeFileSync(destFile, tsCode);

console.log(`Migrated ${sourceFile} to ${destFile}`);
console.log('Remember to add appropriate type annotations!');

// Optionally run ESLint and Prettier on the new file
try {
  console.log('Running ESLint...');
  execSync(`npx eslint --fix ${destFile}`, { stdio: 'inherit' });
  
  console.log('Running Prettier...');
  execSync(`npx prettier --write ${destFile}`, { stdio: 'inherit' });
} catch (error) {
  console.log('Error running ESLint or Prettier, you may need to install them first');
} 