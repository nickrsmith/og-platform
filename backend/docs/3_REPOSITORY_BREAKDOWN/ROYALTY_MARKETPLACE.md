# Repository Breakdown: `royalty-marketplace`

## Role in System

The `royalty-marketplace` is the primary user-facing frontend application for the Empressa platform. It serves both creators and consumers of digital assets. Creators use it to publish and manage their work, while consumers use it to discover, purchase, and access licensed assets.

It is a client-side, browser-based application that acts as the main interface for all user-driven workflows.

## Tech Stack

- **Framework:** Vue 3 (Composition API)
- **Build Tool:** Vite
- **UI Library:** Vuetify 3
- **Routing:** `unplugin-vue-router` (File-based routing)
- **State Management:**
  - **Server State:** TanStack Vue Query for caching, refetching, and managing server data.
  - **Shared Client State:** Vue Composables (e.g., `useAuth`, `useSnackbar`).
- **P2P Communication:** `@Empressa/lens-sdk` and Peerbit.
- **Authentication:** `@web3auth/modal` for handling social logins.

## Key Internal Components & Concepts

- **`src/composables/`**: This is the heart of the application's logic.
  - `useAuth.ts`: Manages the user's session, including exchanging Web3Auth tokens for Empressa JWTs and handling logout.
  - `useLens.ts`: A critical composable that initializes and manages the client-side Peerbit/Lens P2P node. It is responsible for joining the user's "Site" program and enabling direct P2P data synchronization.
  - `useAssets.ts`: Contains Vue Query hooks for all asset-related data fetching, both from the centralized `indexer-api` (`useAllVerifiedAssets`) and the local P2P node (`useMyP2pLibrary`).
  - `useTransactionWorkflow.ts`: A powerful utility for managing the lifecycle of on-chain transactions. It provides UI feedback by polling the `core-api` for the status of both the background job and the final blockchain transaction.

- **`src/pages/`**: Contains the application's views, structured according to the file-based routing convention.
  - `asset-library/`: The main marketplace section.
  - `asset-library/publish.vue`: The form for uploading and publishing a new asset. This component demonstrates the dual-path submission (metadata to P2P, files to `core-api`).
  - `asset-library/my-library.vue`: This view primarily fetches its data directly from the local P2P node via `useMyP2pLibrary`, providing a real-time view of the user's own and purchased assets.

- **`src/lib/api.ts`**: A pre-configured Axios instance that automatically attaches the user's JWT `accessToken` to outgoing requests to the `core-api`. It also includes an interceptor to handle 401 (Unauthorized) errors by automatically logging the user out.

## External Interactions

The `royalty-marketplace` is a true client that interacts with multiple services:

- **`core-api` (Primary Backend):**
  - **Target:** All business logic, user management, and orchestration.
  - **Protocol:** HTTPS/REST.
  - **Purpose:** Used for authentication, initiating all on-chain actions (publishing, licensing), updating profile information, and fetching data that doesn't require real-time P2P sync.

- **Web3Auth (Identity Provider):**
  - **Target:** External identity service.
  - **Protocol:** Web3Auth SDK.
  - **Purpose:** To handle the user-facing login/signup flow (e.g., Google popup) and issue a verifiable `idToken`.

- **`lens-manager` (P2P Network Node):**
  - **Target:** The backend's primary P2P node.
  - **Protocol:** WebSockets (managed by Peerbit).
  - **Purpose:** The client-side P2P node connects directly to the `lens-manager` to bootstrap its connection to the network, discover other peers, and synchronize P2P database records (like asset metadata). This enables real-time updates without polling a central server.
