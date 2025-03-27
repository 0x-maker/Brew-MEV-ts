/**
 * Type declarations for libraries missing TypeScript definitions
 */

// Declare modules that don't have type definitions
declare module '*.json' {
  const value: any;
  export default value;
}

// Add custom type declarations for any libraries without @types packages
declare module 'solana-related-lib-without-types' {
  export function someFunction(param: string): Promise<any>;
  export class SomeClass {
    constructor(options: any);
    method(): void;
  }
}

// Extend existing libraries with additional functionality if needed
declare module '@solana/web3.js' {
  interface Connection {
    // Add any custom methods that might be added via monkey patching
    customMethod?(param: string): Promise<any>;
  }
}

// Declare global variables that might be used
declare global {
  interface Window {
    solana?: any;
    solflare?: any;
  }
}

// For image imports in TypeScript files
declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

// For CSS modules
declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.module.scss' {
  const classes: { [key: string]: string };
  export default classes;
}

// Add more declarations as needed during the migration process 