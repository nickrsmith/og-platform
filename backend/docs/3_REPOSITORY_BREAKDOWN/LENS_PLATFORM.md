# Repository Breakdown: `lens-platform`

**Note:** P2P/lens-platform real-time sync is deferred until after MVP. This architecture is documented for future reference.

## Role in System

The `lens-platform` is the data layer backbone of the Empressa platform. It is a NestJS monorepo responsible for managing both the decentralized Peer-to-Peer (P2P) network and the centralized, queryable index of platform data. Its primary purpose is to provide a robust, hybrid data architecture that offers both real-time updates and fast, scalable queries.

## Tech Stack

- **Framework:** NestJS
- **P2P Communication:** `@Empressa/lens-sdk`, Peerbit
- **Database:** PostgreSQL with Prisma ORM

## Microservice Breakdown

This monorepo contains two distinct, deployable applications (`apps/*`).

### 1. `lens-manager`

- **Role:** A powerful, always-on P2P super-node that acts as the central hub and bridge for the platform's decentralized data.
- **Responsibilities:**
  - **P2P Site Management:** It programmatically creates, opens, and manages user "Site" programs using the `@Empressa/lens-sdk`. Each organization on the platform has its own "Site," which is a distributed database containing its assets, members, etc.
  - **Federation:** It actively "federates" (subscribes to and syncs) data from other sites on the P2P network. This ensures that data is replicated and available even when the original publisher is offline.
  - **Indexer Bridge:** This is its most critical function. It listens for `change` events within the P2P databases it manages. When a new record is detected (e.g., a creator publishes a new asset's metadata), the `lens-manager` immediately makes an API call to the `indexer-api` to persist this data in the central PostgreSQL database.

### 2. `indexer-api`

- **Role:** A standard, high-performance REST API that serves as the query layer for the centralized PostgreSQL database.
- **Responsibilities:**
  - **Data Persistence:** It exposes internal endpoints that the `lens-manager` and `core-api` use to create, update, and delete records in the central database.
  - **Fast Queries:** It provides public-facing, paginated, and filterable endpoints for the frontend applications to fetch data that doesn't need to be real-time (e.g., the main marketplace view, organization discovery). By serving this data from an indexed SQL database, it is much faster and more scalable than querying the P2P network directly for large, public datasets.
  - **Analytics Support:** It contains endpoints for creating and querying analytics data (like `sales_analytics` and `transaction_history`), which are populated by the `ReconciliationProcessor` in the `core-api`.

## External Interactions

- **`core-backend`**:
  - The `lens-manager` is called by `core-api` and `admin-service` to provision new P2P sites for organizations and to update P2P records after on-chain events.
  - The `indexer-api` is called by the `ReconciliationProcessor` in `core-api` to store the final state of assets and log activities after blockchain transactions are confirmed.

- **`royalty-marketplace` (Frontend)**:
  - The client-side P2P node in the user's browser connects **directly** to the `lens-manager` via WebSockets to join the P2P network, discover peers, and sync data for real-time views like "My Library."
  - The frontend also makes standard HTTPS requests to the `indexer-api` (often proxied via `core-api`) to fetch public data for pages like the main community marketplace.

- **PostgreSQL Database**:
  - The `indexer-api` is the primary service responsible for all reads and writes to the central database, which is managed via the Prisma ORM.
