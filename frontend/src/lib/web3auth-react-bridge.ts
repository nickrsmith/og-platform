/**
 * Bridge module for Web3Auth React components
 * Note: If imports fail, check that @web3auth/modal is properly installed
 */

// Direct imports - if these fail, the package needs to be reinstalled
// The error will be caught by ErrorBoundary in main.tsx
export { 
  Web3AuthProvider,
  useWeb3Auth,
  useWeb3AuthConnect,
  useIdentityToken
} from '@web3auth/modal/react';

export type { Web3AuthContextConfig } from '@web3auth/modal/react';

