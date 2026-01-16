# Docker Setup for Hauska Smart Contracts

This project includes Docker support for easy deployment and development with the NFT License System.

## 🚀 Super Simple Setup (Recommended)

Just one command to run everything:

```bash
./run-docker-simple.sh
```

Or using docker-compose:

```bash
docker-compose -f docker-compose.simple.yml up
```

This will:

1. Build a single container with everything
2. Start Hardhat node
3. Deploy all contracts (including NFT system)
4. Set up NFT permissions automatically
5. Serve the complete app

Access at: **<http://localhost:3000>**

### What's Inside the Container

- All contracts compiled and deployed
- NFT License System (ERC-721) active
- Frontend served directly (no volume mounts needed)
- Hardhat node running on port 8545
- Auto-redirect from root to frontend

## Quick Start (Full Setup)

1. **Build and start all services:**

```bash
docker-compose up --build
```

2. **Access the application:**

- Frontend: <http://localhost:3000>
- Hardhat Node: <http://localhost:8545>

## Services

### Main Service (`hauska`)

- Runs Hardhat node, deploys contracts, and serves frontend
- Includes NFT License System (HauskaLicenseManagerV2)
- Automatically sets up permissions for NFT minting

### Optional Services

- **IPFS**: Decentralized storage (port 8080)
- **Graph Node**: For blockchain indexing
- **PostgreSQL**: Database for Graph Node

## Docker Commands

### Start all services

```bash
docker-compose up -d
```

### View logs

```bash
docker-compose logs -f hauska
```

### Check NFT count

```bash
docker-compose exec hauska npx hardhat run scripts/check-nft-count.js --network localhost
```

### Deploy contracts manually

```bash
docker-compose exec hauska npx hardhat run scripts/deploy-complete.js --network localhost
```

### Access Hardhat console

```bash
docker-compose exec hauska npx hardhat console --network localhost
```

### Stop all services

```bash
docker-compose down
```

### Clean everything (including volumes)

```bash
docker-compose down -v
```

## Development Mode

For development with hot reload:

```bash
# Start only the blockchain and deployer
docker-compose up hardhat-node deployer -d

# Run frontend locally
cd frontend && python3 -m http.server 3000
```

## Environment Variables

The Docker setup uses default development settings. To customize:

1. Create a `.env` file:

```env
NODE_ENV=development
HARDHAT_NETWORK=localhost
```

2. Update `docker-compose.yml` to use your settings

## NFT License System

The Docker deployment automatically:

- Deploys HauskaLicenseManagerV2 (NFT-based licenses)
- Sets up all required permissions
- Configures the factory to use NFT licenses by default

Every license purchase will mint an ERC-721 NFT that can be:

- Transferred between wallets
- Listed on NFT marketplaces
- Viewed in MetaMask

## Troubleshooting

### Port already in use

```bash
# Change ports in docker-compose.yml
ports:
  - "3001:80"      # Frontend on 3001
  - "8546:8545"    # Hardhat on 8546
```

### Contracts not deploying

```bash
# Check logs
docker-compose logs hauska

# Manually deploy
docker-compose exec hauska sh -c "cd /app && npx hardhat run scripts/deploy-complete.js --network localhost"
```

### Permission errors

```bash
# Fix NFT permissions
docker-compose exec hauska npx hardhat run scripts/fix-permissions.js --network localhost
```

## Architecture

```bash
hauska-platform/
├── Hardhat Node (port 8545)
├── Contract Deployer
├── Frontend Server (port 80/3000)
└── NFT License System
    ├── HauskaLicenseManagerV2
    ├── HauskaLicenseNFT (ERC-721)
    └── HauskaLicenseMetadata
```

## Contract Addresses

After deployment, contract addresses are saved in `/app/deployments/localhost.json` and automatically configured in the frontend.
