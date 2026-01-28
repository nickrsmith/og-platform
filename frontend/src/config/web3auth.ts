// Import from real @web3auth/modal package
import { WEB3AUTH_NETWORK } from "@web3auth/modal";
import type { Web3AuthContextConfig } from "@web3auth/modal/react";

// Check if we're using mock API - if so, use a dummy clientId for development
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false' && 
                     import.meta.env.VITE_USE_MOCK_API !== '0';

const clientId = import.meta.env.VITE_WEB3AUTH_CLIENT_ID || 
                 (USE_MOCK_API ? 'dummy-client-id-for-mock-mode' : '');

if (!import.meta.env.VITE_WEB3AUTH_CLIENT_ID && !USE_MOCK_API) {
  console.warn(
    '[Web3Auth] VITE_WEB3AUTH_CLIENT_ID not set. Web3Auth will not work. Please set it in your .env file.'
  );
}

if (USE_MOCK_API && !import.meta.env.VITE_WEB3AUTH_CLIENT_ID) {
  console.info(
    '[Web3Auth] Mock API mode: Using dummy clientId. Web3Auth will be initialized but not functional.'
  );
}

// Determine network based on environment variable
const getNetwork = (): string => {
  const network = import.meta.env.VITE_WEB3AUTH_NETWORK || 'testnet';
  return network === 'mainnet' 
    ? WEB3AUTH_NETWORK.SAPPHIRE_MAINNET 
    : WEB3AUTH_NETWORK.SAPPHIRE_DEVNET;
};

// ⭐ PRIORITY 5: Add UI configuration and logging
export const web3AuthConfig: Web3AuthContextConfig = {
  web3AuthOptions: {
    clientId: clientId?.replace(/^"|"$/g, '') || '',
    web3AuthNetwork: getNetwork(),
    // Enable logging in development for debugging
    enableLogging: import.meta.env.DEV,
    // Configure UI to match Hauska's working setup
    uiConfig: {
      appName: 'O&G Dashboard',
      mode: 'light',
      loginGridCol: 3,
      primaryButton: 'externalLogin',
    },
  }
};

