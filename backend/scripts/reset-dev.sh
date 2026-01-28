#!/bin/sh
set -e

pnpm infra:down -v
pnpm infra:up
pnpm prisma migrate dev
pnpm start:dev