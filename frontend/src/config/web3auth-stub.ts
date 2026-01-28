// Stub file for when @web3auth/modal is not installed
export const WEB3AUTH_NETWORK = {
  SAPPHIRE_MAINNET: 'sapphire_mainnet',
  SAPPHIRE_DEVNET: 'sapphire_devnet',
} as const;

export type Web3AuthContextConfig = {
  web3AuthOptions: {
    clientId: string;
    web3AuthNetwork: string;
  };
};

