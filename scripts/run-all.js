#!/usr/bin/env node

/**
 * Run All Services
 * 
 * This script starts all parts of the application:
 * - Next.js frontend (npm run dev)
 * - TypeScript CLI (npm run ts-cli)
 * 
 * Usage: npm run start-all
 */

const { spawn } = require('child_process');
const path = require('path');
const chalk = require('chalk');

// Configuration
const services = [
  {
    name: 'Web Frontend',
    command: 'npm',
    args: ['run', 'dev'],
    color: 'green'
  },
  {
    name: 'TypeScript CLI',
    command: 'npm',
    args: ['run', 'ts-cli'],
    color: 'blue'
  }
];

// Keep track of running processes
const processes = [];

// Function to create a prefix for log messages
function createPrefix(name, color) {
  return chalk[color](`[${name}]`);
}

// Start all services
function startAllServices() {
  console.log(chalk.cyan('Starting all services...'));
  
  services.forEach(service => {
    const prefix = createPrefix(service.name, service.color);
    console.log(`${prefix} Starting...`);
    
    const childProcess = spawn(service.command, service.args, {
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: true
    });
    
    processes.push(childProcess);
    
    childProcess.stdout.on('data', (data) => {
      data.toString().split('\n').filter(line => line).forEach(line => {
        console.log(`${prefix} ${line}`);
      });
    });
    
    childProcess.stderr.on('data', (data) => {
      data.toString().split('\n').filter(line => line).forEach(line => {
        console.log(`${prefix} ${chalk.red(line)}`);
      });
    });
    
    childProcess.on('close', (code) => {
      console.log(`${prefix} ${code === 0 
        ? chalk.green(`Process exited successfully`) 
        : chalk.red(`Process exited with code ${code}`)}`);
    });
  });
  
  console.log(chalk.cyan('All services started.'));
  console.log(chalk.yellow('Press Ctrl+C to stop all services.'));
}

// Clean up on exit
process.on('SIGINT', () => {
  console.log(chalk.yellow('\nShutting down all services...'));
  
  processes.forEach(proc => {
    proc.kill('SIGINT');
  });
  
  // Give them a moment to clean up
  setTimeout(() => {
    console.log(chalk.green('All services stopped.'));
    process.exit(0);
  }, 1000);
});

// Start everything
startAllServices(); 