# Multi-stage Dockerfile for Hauska Platform

# Stage 1: Build contracts
FROM node:22.14.0 AS contracts-builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y git python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY package-lock.json ./

# Install dependencies
RUN npm ci

# Copy contract files
COPY contracts/ ./contracts/
COPY hardhat.config.js ./
COPY .env.example ./.env

# Compile contracts
RUN npx hardhat compile

# Stage 2: Frontend builder
FROM node:22.14.0 AS frontend-builder

WORKDIR /app/frontend

# Copy frontend files (no package.json needed for static files)
COPY frontend/ ./

# Build frontend if needed (currently static files)
RUN echo "Frontend is static, no build needed"

# Stage 3: Final runtime image
FROM ubuntu:22.04

WORKDIR /app

# Install Node.js and runtime dependencies
RUN apt-get update && \
    apt-get install -y curl git python3 make g++ nginx supervisor bash && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Install Foundry (includes Anvil)
RUN curl -L https://foundry.paradigm.xyz | bash
ENV PATH="/root/.foundry/bin:${PATH}"
RUN /root/.foundry/bin/foundryup

# Copy from builders
COPY --from=contracts-builder /app/node_modules ./node_modules
COPY --from=contracts-builder /app/artifacts ./artifacts
COPY --from=contracts-builder /app/cache ./cache

# Copy all project files
COPY . .

# Setup nginx for frontend (Ubuntu uses sites-available/sites-enabled)
RUN rm -f /etc/nginx/sites-enabled/default
COPY docker/nginx.conf /etc/nginx/sites-available/hauska
RUN ln -s /etc/nginx/sites-available/hauska /etc/nginx/sites-enabled/

# Setup supervisor
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Create startup script and helpers
COPY docker/startup.sh /usr/local/bin/startup.sh
COPY docker/startup-banner.sh /app/docker/startup-banner.sh
COPY docker/wait-for-blockchain.sh /app/docker/wait-for-blockchain.sh
RUN chmod +x /usr/local/bin/startup.sh /app/docker/startup-banner.sh /app/docker/wait-for-blockchain.sh

# Expose ports
EXPOSE 80 8545

# Start services
CMD ["/usr/local/bin/startup.sh"]