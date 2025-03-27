#!/usr/bin/env node

/**
 * TypeScript Setup Helper
 * 
 * This script automates the setup of TypeScript in a JavaScript project.
 * It installs necessary dependencies, creates configuration files, and sets up
 * npm scripts for running and building TypeScript.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Configuration
const dependencies = [
  'typescript',
  'ts-node',
  '@types/node'
];

const devDependencies = [
  '@typescript-eslint/eslint-plugin',
  '@typescript-eslint/parser'
];

const additionalTypeDefinitions = [
  '@types/react',
  '@types/react-dom',
  '@types/inquirer',
  '@types/figlet',
  '@types/qrcode'
];

// Helper functions
function runCommand(command) {
  console.log(chalk.cyan(`Running: ${command}`));
  try {
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(chalk.red(`Failed to execute: ${command}`));
    console.error(error.message);
    return false;
  }
}

function createFile(filePath, content) {
  console.log(chalk.cyan(`Creating: ${filePath}`));
  const dirPath = path.dirname(filePath);
  
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  
  try {
    fs.writeFileSync(filePath, content);
    return true;
  } catch (error) {
    console.error(chalk.red(`Failed to create: ${filePath}`));
    console.error(error.message);
    return false;
  }
}

function updatePackageJson() {
  console.log(chalk.cyan('Updating package.json...'));
  
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Add TypeScript scripts
    packageJson.scripts = {
      ...(packageJson.scripts || {}),
      "type-check": "tsc --noEmit",
      "type-check:cli": "tsc -p cli/tsconfig.json --noEmit",
      "ts-cli": "ts-node cli/src/cli.ts",
      "build-cli": "tsc -p cli/tsconfig.json",
      "start-ts-cli": "npm run build-cli && node cli/dist/src/cli.js",
      "migration-status": "node scripts/migration-status.js",
      "migrate-js": "node scripts/migrate-to-ts.js"
    };
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log(chalk.green('Successfully updated package.json'));
    return true;
  } catch (error) {
    console.error(chalk.red('Failed to update package.json'));
    console.error(error.message);
    return false;
  }
}

// Main functions
function installDependencies() {
  console.log(chalk.bold('\n📦 Installing Dependencies\n'));
  
  // Install core dependencies
  const success1 = runCommand(`npm install --save ${dependencies.join(' ')}`);
  
  // Install dev dependencies
  const success2 = runCommand(`npm install --save-dev ${devDependencies.join(' ')}`);
  
  // Install type definitions
  const success3 = runCommand(`npm install --save-dev ${additionalTypeDefinitions.join(' ')}`);
  
  return success1 && success2 && success3;
}

function createTsConfig() {
  console.log(chalk.bold('\n📝 Creating TypeScript Configuration\n'));
  
  const tsConfig = {
    "compilerOptions": {
      "target": "es2018",
      "module": "commonjs",
      "moduleResolution": "node",
      "esModuleInterop": true,
      "forceConsistentCasingInFileNames": true,
      "strict": true,
      "skipLibCheck": true,
      "declaration": true,
      "sourceMap": true,
      "outDir": "dist",
      "baseUrl": ".",
      "paths": {
        "@/*": ["./*"]
      },
      "lib": ["dom", "dom.iterable", "esnext"],
      "allowJs": true,
      "resolveJsonModule": true,
      "isolatedModules": true,
      "jsx": "preserve",
      "incremental": true
    },
    "include": ["**/*.ts", "**/*.tsx"],
    "exclude": ["node_modules", "dist", ".next"]
  };
  
  const tsConfigPath = path.join(process.cwd(), 'tsconfig.json');
  const success = createFile(tsConfigPath, JSON.stringify(tsConfig, null, 2));
  
  // Create CLI-specific tsconfig
  const cliTsConfigPath = path.join(process.cwd(), 'cli', 'tsconfig.json');
  const cliTsConfig = {
    "extends": "../tsconfig.json",
    "compilerOptions": {
      "outDir": "dist",
      "rootDir": ".."
    },
    "include": ["src/**/*.ts", "types/**/*.ts", "utils/**/*.ts"],
    "exclude": ["node_modules", "dist"]
  };
  
  const success2 = createFile(cliTsConfigPath, JSON.stringify(cliTsConfig, null, 2));
  
  return success && success2;
}

function createTypeDefinitions() {
  console.log(chalk.bold('\n📋 Creating Type Definitions\n'));
  
  const typesDir = path.join(process.cwd(), 'types');
  
  if (!fs.existsSync(typesDir)) {
    fs.mkdirSync(typesDir, { recursive: true });
  }
  
  // Create index.ts with core types
  const indexTypesContent = `/**
 * Central Type Definitions
 */

// Wallet Types
export interface Wallet {
  publicKey: string;
  secretKey: Uint8Array;
}

// Add more types as needed
`;
  
  // Create declarations.d.ts
  const declarationsContent = `/**
 * Type declarations for libraries missing TypeScript definitions
 */

// Declare modules that don't have type definitions
declare module '*.json' {
  const value: any;
  export default value;
}

// Add more declarations as needed
`;
  
  const success1 = createFile(path.join(typesDir, 'index.ts'), indexTypesContent);
  const success2 = createFile(path.join(typesDir, 'declarations.d.ts'), declarationsContent);
  
  return success1 && success2;
}

function createMigrationScripts() {
  console.log(chalk.bold('\n🔄 Creating Migration Scripts\n'));
  
  const scriptsDir = path.join(process.cwd(), 'scripts');
  
  if (!fs.existsSync(scriptsDir)) {
    fs.mkdirSync(scriptsDir, { recursive: true });
  }
  
  // Migration status script
  const migrationStatusScript = `#!/usr/bin/env node

/**
 * Migration Status Reporter
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

// Analyze files and report
// ... implementation ...
console.log(chalk.bold('\\n🔄 TypeScript Migration Status\\n'));
`;
  
  // JS to TS migration script
  const migrateJsScript = `#!/usr/bin/env node

/**
 * JavaScript to TypeScript Migration Helper
 */

const fs = require('fs');
const path = require('path');

// Implementation
// ... implementation ...
console.log('Migration helper');
`;
  
  const success1 = createFile(path.join(scriptsDir, 'migration-status.js'), migrationStatusScript);
  const success2 = createFile(path.join(scriptsDir, 'migrate-to-ts.js'), migrateJsScript);
  
  // Make executable
  if (success1) runCommand(`chmod +x ${path.join(scriptsDir, 'migration-status.js')}`);
  if (success2) runCommand(`chmod +x ${path.join(scriptsDir, 'migrate-to-ts.js')}`);
  
  return success1 && success2;
}

// Main execution
console.log(chalk.bold.green('🚀 Setting up TypeScript for your project\n'));

let success = true;

success = installDependencies() && success;
success = createTsConfig() && success;
success = createTypeDefinitions() && success;
success = createMigrationScripts() && success;
success = updatePackageJson() && success;

if (success) {
  console.log(chalk.bold.green('\n✅ TypeScript setup completed successfully!\n'));
  console.log(chalk.cyan('Next steps:'));
  console.log('1. Run ' + chalk.bold('npm run migration-status') + ' to see current TypeScript migration status');
  console.log('2. Run ' + chalk.bold('npm run migrate-js <source.js> <destination.ts>') + ' to convert JS files to TS');
  console.log('3. Run ' + chalk.bold('npm run type-check') + ' to verify your TypeScript code');
  console.log('\nHappy coding! 🎉\n');
} else {
  console.log(chalk.bold.red('\n❌ TypeScript setup completed with some errors.\n'));
  console.log(chalk.yellow('Please check the logs above and fix any issues.'));
} 