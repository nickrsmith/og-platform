require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true // Enable IR-based compilation to resolve stack too deep
    }
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
      accounts: process.env.ANVIL_PRIVATE_KEY ? [process.env.ANVIL_PRIVATE_KEY] : ["0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"],
      allowUnlimitedContractSize: true
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://eth-sepolia.g.alchemy.com/v2/YOUR-API-KEY",
      accounts: process.env.PRIVATE_KEY && process.env.PRIVATE_KEY !== "your-private-key-here" ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111
    },
    hardhat: {
      chainId: 31337,
      allowUnlimitedContractSize: true
    },
    docker: {
      url: "http://hardhat-node:8545",
      chainId: 31337,
      accounts: {
        mnemonic: "test test test test test test test test test test test junk"
      },
      allowUnlimitedContractSize: true
    },
    privatechain: {
      url: "http://68.183.203.195:8545/",
      chainId: 31337,
      accounts: ["0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"],
      allowUnlimitedContractSize: true
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  }
};