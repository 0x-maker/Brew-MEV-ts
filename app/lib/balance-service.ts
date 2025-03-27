// Import libs using require for compatibility
const solanaWeb3 = require('@solana/web3.js');
const Connection = solanaWeb3.Connection;
const PublicKey = solanaWeb3.PublicKey;
const clusterApiUrl = solanaWeb3.clusterApiUrl;
const LAMPORTS_PER_SOL = solanaWeb3.LAMPORTS_PER_SOL;

// Define multiple RPC endpoints to try for mainnet
const MAINNET_RPC_ENDPOINTS = [
  clusterApiUrl('mainnet-beta'),
  'https://api.mainnet-beta.solana.com',
  'https://solana-api.projectserum.com',
  'https://rpc.ankr.com/solana'
];

// Define devnet RPC endpoints for testing
const DEVNET_RPC_ENDPOINTS = [
  clusterApiUrl('devnet'),
  'https://api.devnet.solana.com'
];

// Keep track of dev mode locally for when the API call fails
let localDevMode = false;

// Check if we should use simulation mode
const checkDevMode = async (): Promise<boolean> => {
  if (process.env.NODE_ENV !== 'development') {
    return false;
  }
  
  // In server context, default to true for development
  if (typeof window === 'undefined') {
    return true;
  }
  
  try {
    // Use absolute path to make sure we're not calling the client API from server
    // This ensures it works in both client and server contexts
    const devModeEndpoint = '/api/wallet/dev-mode';
      
    const response = await fetch(devModeEndpoint, {
      cache: 'no-store' // Don't cache the response
    });
    
    if (response.ok) {
      const data = await response.json();
      localDevMode = data.devMode;
      return data.devMode;
    }
  } catch (error) {
    console.warn('Error checking dev mode, using local setting:', error);
  }
  
  return localDevMode;
};

// Get the appropriate RPC endpoints based on environment
const getRpcEndpoints = (useDevnet: boolean = false): string[] => {
  // In development without simulation mode, use devnet
  if (process.env.NODE_ENV === 'development' && useDevnet) {
    return DEVNET_RPC_ENDPOINTS;
  }
  
  // Otherwise use mainnet endpoints
  return MAINNET_RPC_ENDPOINTS;
};

// Get the balance of a Solana wallet with retry and fallback
export const getBalance = async (publicKeyString: string, useDevnet: boolean = false): Promise<number> => {
  let lastError;

  // Check if the public key string is valid
  try {
    new PublicKey(publicKeyString);
  } catch (error) {
    console.error('Invalid public key:', publicKeyString);
    throw new Error('Invalid wallet address format');
  }

  // Get appropriate endpoints based on environment
  const endpoints = getRpcEndpoints(useDevnet);
  
  // Try each endpoint until one works
  for (const endpoint of endpoints) {
    try {
      const publicKey = new PublicKey(publicKeyString);
      const connection = new Connection(endpoint, 'confirmed');
      
      // Add a timeout to the balance request
      const balancePromise = connection.getBalance(publicKey);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out')), 15000)
      );
      
      const balanceInLamports = await Promise.race([balancePromise, timeoutPromise]) as number;
      const balanceInSol = balanceInLamports / LAMPORTS_PER_SOL;
      
      // If we reach here, we got a valid balance
      return balanceInSol;
    } catch (error) {
      console.warn(`Error getting balance from ${endpoint}:`, error);
      lastError = error;
      // Continue to the next endpoint
    }
  }

  // If we exhausted all endpoints, throw the last error
  console.error('All RPC endpoints failed:', lastError);
  throw new Error('Failed to fetch wallet balance. Network error.');
};

// Request an airdrop from devnet (for testing only)
export const requestDevnetAirdrop = async (
  publicKeyString: string, 
  amount: number = 1
): Promise<boolean> => {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    console.error('Airdrops only available in development mode');
    return false;
  }
  
  try {
    const publicKey = new PublicKey(publicKeyString);
    
    // Try each devnet endpoint until one works
    for (const endpoint of DEVNET_RPC_ENDPOINTS) {
      try {
        console.log(`Attempting airdrop from ${endpoint}...`);
        const connection = new Connection(endpoint, 'confirmed');
        
        // Amount in lamports (1 SOL = 1,000,000,000 lamports)
        const lamports = amount * LAMPORTS_PER_SOL;
        
        // Request the airdrop
        const signature = await connection.requestAirdrop(publicKey, lamports);
        console.log(`Airdrop requested with signature: ${signature}`);
        
        // Wait for confirmation with a longer timeout
        try {
          const confirmationResult = await Promise.race([
            connection.confirmTransaction(signature),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Confirmation timeout')), 30000))
          ]);
          console.log('Confirmation result:', confirmationResult);
        } catch (confirmError) {
          console.warn('Confirmation error:', confirmError);
          // Consider it successful anyway, as sometimes the airdrop succeeds but confirmation fails
        }
        
        console.log(`Airdrop successful: ${amount} SOL to ${publicKeyString}`);
        return true;
      } catch (error) {
        console.warn(`Error requesting airdrop from ${endpoint}:`, error);
        // Continue to the next endpoint
      }
    }
    
    throw new Error('All devnet endpoints failed for airdrop');
  } catch (error) {
    console.error('Error requesting airdrop:', error);
    return false;
  }
};

// Simulate a balance fetch for testing/development
export const getSimulatedBalance = (): number => {
  // Return a random balance between 0.5 and 10 SOL
  return Math.random() * 9.5 + 0.5;
};

// Get balance with fallback to simulation during development
export const getSafeBalance = async (
  publicKeyString: string,
  forceSimulation?: boolean
): Promise<number> => {
  // Check if we should use simulation mode
  const useSimulation = forceSimulation || 
    (process.env.NODE_ENV === 'development' && (
      // In server context or when explicitly asked to use simulation
      typeof window === 'undefined' || await checkDevMode()
    ));
  
  try {
    // If in simulation mode, return a simulated balance
    if (useSimulation) {
      console.log('Using simulated balance for', publicKeyString);
      return getSimulatedBalance();
    }
    
    // In development with no simulation, use devnet
    const useDevnet = process.env.NODE_ENV === 'development' && !useSimulation;
    
    // Get the real balance
    return await getBalance(publicKeyString, useDevnet);
  } catch (error) {
    console.warn('Error getting real balance:', error);
    
    // In development, fall back to simulation if real balance fails
    if (process.env.NODE_ENV === 'development') {
      console.log('Falling back to simulated balance');
      return getSimulatedBalance();
    }
    
    // In production, rethrow the error
    throw error;
  }
};

// Check if a wallet has enough SOL to run the bot
export const hasMinimumBalance = async (publicKeyString: string): Promise<boolean> => {
  try {
    // The minimum balance is encoded in base64 as 'MA==' which decodes to 3.0
    const minimumBalance = 3.0; // This should be obtained from brew.js decodeBase64 function
    const balance = await getSafeBalance(publicKeyString);
    return balance >= minimumBalance;
  } catch (error) {
    console.error('Error checking minimum balance:', error);
    return false;
  }
}; 