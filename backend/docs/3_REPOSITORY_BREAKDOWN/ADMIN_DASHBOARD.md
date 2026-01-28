# Repository Breakdown: Admin Panel (Admin Dashboard)

## Role in System

The admin panel is a protected, internal-facing frontend application designed exclusively for platform administrators. It is integrated into the main React frontend as a separate route section (`/admin/*`). Its purpose is to provide the tools necessary to manage, moderate, and oversee the health of the O&G marketplace.

Access is restricted to authorized admin users with a valid username and password (separate from user Web3Auth authentication).

## Tech Stack

- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **UI Library:** shadcn/ui (built on Radix UI and Tailwind CSS)
- **Routing:** Wouter (integrated into main app routing)
- **State Management:**
  - **Server State:** TanStack React Query for managing data from the `admin-service`.
  - **Shared Client State:** React Hooks (e.g., `useAdminAuth` for admin sessions).
- **Charts:** Recharts for analytics visualization

## Key Internal Components & Concepts

### Authentication

- **`src/hooks/use-admin-auth.ts`**: React hook for admin authentication, separate from the user authentication. Handles email/password login flow against the `admin-service` and manages the admin-specific JWT token (`admin_access_token`).

- **`src/lib/services/admin-auth.service.ts`**: Service layer for admin authentication operations (login, logout, get current admin, change password).

- **`src/pages/admin-login.tsx`**: Admin login page at `/admin/login` route.

- **`src/components/guards/AdminAuthGuard.tsx`**: Route guard component that protects admin routes, ensuring only authenticated admins can access them.

### API Client

- **`src/lib/api-admin.ts`**: Dedicated API client for admin-service. Automatically attaches the admin's JWT `accessToken` to all outgoing requests to the `admin-service` (defaults to port 4243). Includes error handling and automatic redirect on 401.

- **`src/lib/services/admin.service.ts`**: Service layer for all admin operations (users, organizations, releases, analytics).

### Admin Pages

- **`src/pages/admin.tsx`**: Main admin panel dashboard with multiple tabs:
  - **Users Tab:** User management (view, search, suspend/reactivate, update)
  - **Verification Tab:** Asset verification queue (approve/reject pending verifications)
  - **Organizations Tab:** Organization management (list organizations, approve/reject organization requests)
  - **Content Tab:** Content moderation (flagged listings, featured listings)
  - **Analytics Tab:** Platform metrics, revenue data, funnel visualization, users by category

### Admin Routes

The admin panel is integrated into the main app routing:

- `/admin/login` - Admin login page (public)
- `/admin` - Main admin dashboard (protected, requires admin authentication)
- All `/admin/*` routes are protected by `AdminAuthGuard`

## External Interactions

The admin panel interacts exclusively with the `admin-service` backend:

- **`admin-service` (Exclusive Backend):**
  - **Default Port:** 4243 (configurable via `ADMIN_SERVICE_PORT` env var)
  - **Target:** The dedicated API gateway for all administrative functions
  - **Protocol:** HTTP/REST in development, HTTPS/REST in production
  - **Purpose:** It is the sole communication point for the admin panel. Every action—from logging in to approving an organization or verifying an asset—is sent as a request to the `admin-service`, which then orchestrates the necessary actions with other backend services (`core-api`, `blockchain-service`, etc.).

### Authentication Flow

- Admin logs in via `/admin/login` with email/password
- `admin-service` validates credentials and returns JWT token
- Token stored in `localStorage` as `admin_access_token` (separate from user `access_token`)
- All admin API requests include `Authorization: Bearer <admin_access_token>`
- On 401, token is cleared and user redirected to `/admin/login`

## External Interactions

The `admin-dashboard` has a much simpler communication pattern than the main marketplace, as it interacts with only one backend service.

- **`admin-service` (Exclusive Backend):**
  - **Target:** The dedicated API gateway for all administrative functions in the `core-backend`.
  - **Protocol:** HTTPS/REST.
  - **Purpose:** It is the sole communication point for the admin dashboard. Every action—from logging in to approving an organization or verifying an asset—is sent as a request to the `admin-service`, which then orchestrates the necessary actions with other backend services.
