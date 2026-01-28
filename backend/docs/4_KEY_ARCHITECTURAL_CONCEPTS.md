# Key Architectural Concepts

This document explains the core architectural patterns and concepts that underpin the Empressa platform. Understanding these principles is key to developing, maintaining, and debugging the system effectively.

## 1. Hybrid Data Model (P2P vs. Centralized)

The platform utilizes a hybrid data model to combine the benefits of a decentralized Peer-to-Peer (P2P) network with the performance and scalability of a traditional centralized database.

- **P2P Layer (`lens-platform/lens-manager`)**
  - **Technology:** `@Empressa/lens-sdk` and **Peerbit**.
  - **Purpose:** **Real-time, user-owned data.** When a user publishes or edits their own asset metadata, it's written directly to their local P2P database and broadcast to the network.
  - **Use Case:** The "My Library" view in the `royalty-marketplace` fetches data directly from the user's local P2P node. This provides an instant, offline-first experience without needing to wait for a central server to update. The `lens-manager` acts as a super-node to ensure data availability and bridge it to the centralized layer.

- **Centralized Layer (`lens-platform/indexer-api`)**
  - **Technology:** PostgreSQL with **Prisma**.
  - **Purpose:** **Fast, scalable, public queries.** It is not efficient to ask every user's P2P node for all public data. Instead, the `lens-manager` listens for P2P changes and pushes them into a centralized SQL database.
  - **Use Case:** The main "Community Marketplace" page, which shows hundreds of assets from many different creators, queries the fast `indexer-api`. This allows for robust pagination, searching, and filtering that would be very slow on a purely P2P network.

**In summary:** We use P2P for instant write operations and real-time "my data" views, and a centralized index for fast, aggregated "all data" views.

## 2. Asynchronous Workflows (BullMQ & RabbitMQ)

Many critical processes on the platform (like file uploading and blockchain transactions) are slow and can fail. To prevent a poor user experience and ensure reliability, we process them asynchronously in the background. We use two different technologies for this:

- **BullMQ (with Redis) for Job Queues**
  - **Purpose:** Managing the lifecycle of a single, stateful task that needs to be executed reliably. It's perfect for workflows with distinct steps that can be retried on failure.
  - **How it's used:**
    - The **`ipfs-service`** uses a queue to process file pinning jobs.
    - The **`blockchain-service`** uses a queue to process on-chain transaction jobs.
  - **Analogy:** Think of BullMQ as a **to-do list** for a specific worker. The `core-api` adds a task (e.g., "pin this file"), and the worker (`ipfs-service`) picks it up, works on it, and marks it as complete or failed.

- **RabbitMQ for Event Messaging**
  - **Purpose:** Decoupling services by broadcasting that *something happened*. It allows one service to announce an event without knowing or caring who is listening.
  - **How it's used:**
    - When the `blockchain-service` successfully confirms a transaction, it publishes a `transaction.finalized.confirmed` event to RabbitMQ.
  - **Analogy:** Think of RabbitMQ as a **public announcement system**. The `blockchain-service` makes an announcement ("Hey everyone, transaction #123 is confirmed!"), and any other service that cares about this event (like the `ReconciliationProcessor` in `core-api`) can listen and react accordingly.

**Key Difference:** Use **BullMQ** to *command* a worker to *do* something. Use **RabbitMQ** to *notify* the system that something *has been done*.

## 3. Security & Key Management (`kms-service`)

User security is paramount, especially when dealing with cryptographic keys that control assets and funds. The `kms-service` is the cornerstone of our security model.

- **Principle of Least Privilege:** The `core-api`, `admin-service`, and other gateways **never** have access to raw private keys.
- **Envelope Encryption:** The `kms-service` uses a two-layer encryption strategy to protect sensitive keys (like wallet mnemonics):
    1. A unique **Data Encryption Key (DEK)** is generated for each secret. The secret is encrypted with this DEK.
    2. The DEK itself is then encrypted with a single, master **Key Encryption Key (KEK)** that is loaded securely from environment variables.
    3. The encrypted secret and the encrypted DEK are stored in the database. To decrypt, you must have the master KEK to first decrypt the DEK, which can then be used to decrypt the secret. This limits the attack surface to only the `kms-service`.
- **On-Demand Decryption:** When the `blockchain-service` needs to sign a transaction on a user's behalf, it requests the private key from the `kms-service`. The `kms-service` performs the decryption in-memory, returns the raw key over a secure internal network, and the `blockchain-service` uses it immediately and then discards it. The raw key is never stored at rest outside the KMS.

## 4. Event-Driven Reconciliation

Because many workflows are asynchronous, the final state of an asset is not known at the time of its creation. **Reconciliation** is the process of updating all systems with the final, correct information after all background jobs are complete.

- **Trigger:** The `transaction.finalized` event published on RabbitMQ by the `blockchain-service` is the primary trigger for reconciliation.
- **Orchestrator:** The `ReconciliationProcessor` in `core-api` is the main listener for these events.
- **Actions:** When it receives an event, it performs the final "cleanup" tasks:
  - **On-Chain to Off-Chain:** It takes the on-chain Asset ID from the event and saves it to the asset's record in the `indexer-api` database.
  - **Updating P2P State:** It calls the `lens-manager` to update the asset's P2P record with its final status (e.g., changing `verificationStatus` to `VERIFIED`).
  - **Logging Activity:** It calls the `indexer-api` to create activity log entries (e.g., "Asset Published", "Asset Licensed").

This event-driven pattern ensures that all parts of the system eventually converge on a consistent state, even though they operate independently.
