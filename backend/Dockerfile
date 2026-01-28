# Generic Dockerfile Template for NestJS Monorepo Apps (Corrected for Production)

# --- ARGUMENTS ---
ARG APP_NAME

# --- 1. Build Stage ---
FROM node:22-alpine AS builder
ARG APP_NAME
WORKDIR /usr/src/app

# Tell pnpm it's running in a non-interactive CI environment
ENV CI=true

# Install pnpm globally
RUN npm install -g pnpm

# Copy the entire project source first to ensure prisma.config.ts and schema.prisma are available
COPY . .

# Install dependencies. The `prisma generate` postinstall script will now work correctly.
RUN pnpm install --frozen-lockfile

# Generate Prisma client
RUN pnpm prisma generate

# Copy the migration script and make it executable
# This is already included in the `COPY . .` step, but we ensure permissions here.
RUN chmod +x /usr/src/app/scripts/run-migrations.sh

# Build the specific application requested by the build argument
RUN pnpm nest build ${APP_NAME}

# --- 2. Development Stage ---
FROM node:22-alpine AS development
ARG APP_NAME
WORKDIR /usr/src/app

ENV APP_NAME=${APP_NAME}
ENV NODE_ENV=development

RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY prisma.config.ts ./

# Install all dependencies (including dev dependencies)
RUN pnpm install

# Copy source code
COPY . .

# Generate Prisma client
RUN pnpm prisma generate

# Copy migration script and make it executable
RUN chmod +x /usr/src/app/scripts/run-migrations.sh

# Expose the appropriate port based on the service
EXPOSE 3000 3001 3003 3004 4242

# Default command (can be overridden in docker-compose)
CMD ["sh", "-c", "pnpm nest start ${APP_NAME} --watch"]

# --- 3. Production Stage ---
FROM node:22-alpine AS production
ARG APP_NAME
ARG NODE_ENV=production
WORKDIR /usr/src/app

ENV APP_NAME=${APP_NAME}
ENV NODE_ENV=${NODE_ENV}

RUN npm install -g pnpm

# Copy only the necessary files from the builder stage to keep the image slim
COPY --from=builder /usr/src/app/package.json ./
COPY --from=builder /usr/src/app/pnpm-workspace.yaml ./
COPY --from=builder /usr/src/app/pnpm-lock.yaml ./
COPY --from=builder /usr/src/app/prisma.config.ts ./

# This preserves the exact module structure the build was created against.
COPY --from=builder /usr/src/app/node_modules ./node_modules
RUN pnpm prune --prod
# Copy the generated Prisma client from the builder stage to the final image

# Copy the built application code, prisma schema, and migration script
COPY --from=builder /usr/src/app/dist/apps/${APP_NAME} ./dist/apps/${APP_NAME}
COPY --from=builder /usr/src/app/libs/database/prisma ./libs/database/prisma

# Explicitly run prisma generate in the final stage
RUN pnpm prisma generate

COPY --from=builder /usr/src/app/scripts/run-migrations.sh /usr/local/bin/run-migrations.sh
# Copy admin creation script for one-off tasks (ensure scripts directory exists)
RUN mkdir -p /usr/src/app/scripts
COPY --from=builder /usr/src/app/scripts/create-admin.mjs /usr/src/app/scripts/create-admin.mjs

EXPOSE 3000 3001 3003 3004 4242
# Use shell form so ${APP_NAME} is expanded at runtime from ENV variable
# CMD ["sh", "-c", "node dist/apps/${APP_NAME}/apps/${APP_NAME}/src/main.js"]
CMD ["sh", "-c", "pnpm prisma migrate deploy && node dist/apps/${APP_NAME}/apps/${APP_NAME}/src/main.js"]