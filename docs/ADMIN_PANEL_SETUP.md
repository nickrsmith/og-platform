# Admin Panel Setup Guide

**Last Updated:** January 16, 2026  
**Version:** 1.0

## Overview

The Admin Panel is a protected section of the main React frontend application, accessible at `/admin/*` routes. It provides platform administrators with tools to manage users, organizations, verify assets, moderate content, and view platform analytics.

## Prerequisites

- Backend services running (admin-service, core-api, database)
- Database migrations applied
- Frontend development server running

## Quick Start

### 1. Create Admin User

```bash
cd backend
node scripts/create-admin.mjs admin@example.com Admin User
# Or with your own password (minimum 12 characters):
node scripts/create-admin.mjs admin@example.com Admin User "YourSecurePassword123!"
```

**Output:**
- Creates admin user in database
- Generates CSV file: `admin-credentials-{firstname}-{lastname}.csv` (in `backend/` directory)
- **IMPORTANT:** Save credentials securely and delete CSV file after saving

**Password Requirements:**
- Minimum 12 characters
- Should contain uppercase, lowercase, numbers, and special characters

### 2. Start Admin Service

```bash
cd backend
pnpm nest start admin-service --watch
```

**Expected Output:**
```
[Admin Service] Service is listening on 0.0.0.0:4243
[Admin Service] Health check endpoint: http://0.0.0.0:4243/health
```

**Default Port:** 4243 (configurable via `ADMIN_SERVICE_PORT` environment variable)

### 3. Start Frontend (if not running)

```bash
cd frontend
npm run dev
```

**Default Port:** 5000 (configurable in `vite.config.ts`)

### 4. Access Admin Panel

1. Visit: `http://localhost:5000/admin/login`
2. Enter credentials from CSV file (or password you provided)
3. Click "Login" or press Enter
4. You will be redirected to `/admin` dashboard on successful login

## Admin Panel Features

### Users Tab
- **View Users:** Search and filter all platform users
- **User Details:** View user information (email, category, status, verification)
- **Suspend/Reactivate:** Suspend or reactivate user accounts
- **Update User:** Edit user details (name, category)

**Endpoints:**
- `GET /users` - List users (with filters)
- `PATCH /users/:id` - Update user
- `PATCH /users/:id/suspend` - Suspend user
- `PATCH /users/:id/reactivate` - Reactivate user

### Verification Tab
- **Pending Verifications:** View assets pending verification
- **Approve/Reject:** Approve or reject asset verifications
- **Review Details:** View asset details before making decision

**Endpoints:**
- `GET /releases/pending-verifications` - List pending verifications
- `POST /releases/:id/approve-verification` - Approve verification
- `POST /releases/:id/reject-verification` - Reject verification (with optional reason)

### Organizations Tab
- **Organization List:** View all organizations on the platform
- **Pending Requests:** Review and approve/reject organization creation requests
- **Organization Details:** View organization information and members

**Endpoints:**
- `GET /organizations` - List all organizations
- `GET /organizations/requests` - List pending requests
- `POST /organizations/requests/:id/approve` - Approve request
- `POST /organizations/requests/:id/reject` - Reject request (with optional reason)
- `GET /organizations/:orgId/members` - List organization members
- `POST /organizations/:orgId/members/invite` - Invite member
- `PATCH /organizations/:orgId/members/:userId` - Update member role
- `DELETE /organizations/:orgId/members/:userId` - Remove member

### Content Tab
- **Flagged Listings:** Review reported/flagged listings
- **Featured Listings:** Manage featured listings for homepage

**Endpoints:**
- `GET /releases/flagged` - List flagged listings (placeholder)
- `POST /releases/:id/flag` - Flag a listing
- `POST /releases/:id/unflag` - Unflag a listing
- `GET /releases/featured` - List featured listings (placeholder)
- `POST /releases/:id/feature` - Feature a listing
- `POST /releases/:id/unfeature` - Unfeature a listing

**Note:** Flagged and featured endpoints are placeholder implementations until `flagged` and `featured` fields are added to the Release schema.

### Analytics Tab
- **Platform Metrics:** View platform statistics (users, organizations, releases, transactions)
- **Revenue Data:** View revenue analytics (placeholder)
- **Funnel Visualization:** View user conversion funnel
- **Users by Category:** View user distribution by category (A, B, C)

**Endpoints:**
- `GET /analytics/metrics` - Platform metrics
- `GET /analytics/revenue` - Revenue data (placeholder)
- `GET /analytics/funnel` - Funnel data
- `GET /analytics/users-by-category` - Users by category

## Configuration

### Environment Variables

**Frontend (`frontend/.env` or `.env.local`):**
```bash
VITE_ADMIN_API_URL=http://localhost:4243
```

**Backend (`backend/.env`):**
```bash
ADMIN_SERVICE_PORT=4243
ADMIN_SERVICE_HOST=0.0.0.0
```

### Default Ports

- **Frontend:** `http://localhost:5000` (config in `vite.config.ts`)
- **Admin Service:** `http://localhost:4243` (default, configurable via `ADMIN_SERVICE_PORT`)
- **Core API:** `http://localhost:3000` (default)

## Authentication

### Admin Authentication Flow

1. Admin visits `/admin/login`
2. Enters email and password
3. Frontend sends `POST /auth/login` to admin-service
4. Admin-service validates credentials against `admin_users` table
5. Returns JWT token (`admin_access_token`)
6. Token stored in `localStorage` (separate from user `access_token`)
7. All subsequent API requests include `Authorization: Bearer <admin_access_token>`
8. On 401 response, token is cleared and user redirected to `/admin/login`

### Token Storage

- **Admin Token:** `localStorage.getItem('admin_access_token')`
- **User Token:** `localStorage.getItem('access_token')`
- **Separation:** Admin and user authentication are completely separate

### Route Protection

- `/admin/login` - Public (no authentication required)
- `/admin/*` (all other admin routes) - Protected by `AdminAuthGuard`
- `AdminAuthGuard` checks for `admin_access_token` and validates with `/auth/me` endpoint

## Troubleshooting

### "Failed to fetch" Error

**Possible Causes:**

1. **Admin-service not running:**
   ```bash
   # Check if port 4243 is listening
   netstat -ano | findstr :4243  # Windows
   lsof -i :4243  # Mac/Linux
   ```

2. **Port mismatch:**
   - Verify admin-service is running on port 4243 (check console output)
   - Verify frontend `VITE_ADMIN_API_URL` matches admin-service port
   - Default frontend expects port 4243

3. **CORS issues:**
   - Admin-service allows all localhost origins in development
   - Check browser console for CORS errors
   - Verify `ADMIN_DASHBOARD_URL` or CORS configuration

4. **Invalid credentials:**
   - Verify admin user exists in database
   - Check CSV file for correct email/password
   - Password must be at least 12 characters
   - Email is case-sensitive

### Test Admin Service Directly

```bash
# Test login endpoint
curl -X POST http://localhost:4243/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-admin@email.com","password":"your-password"}'
```

**Expected Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Health Check

```bash
# Test health endpoint
curl http://localhost:4243/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "service": "admin-service",
  "checks": {
    "database": { "status": "healthy" },
    "redis": { "status": "healthy" }
  }
}
```

### Common Issues

**Issue:** Can't create admin user  
**Solution:** Check database connection, ensure migrations are applied

**Issue:** Login works but can't access admin panel  
**Solution:** Check browser console for errors, verify token is stored in localStorage

**Issue:** "Insufficient permissions" error  
**Solution:** Verify user is in `admin_users` table with `isActive = true`

## Security Considerations

### Admin Credentials

- **Never commit** CSV files with credentials to version control
- **Delete CSV files** after saving credentials securely
- **Use strong passwords** (12+ characters, mixed case, numbers, symbols)
- **Rotate passwords** periodically
- **Limit admin user creation** - only create admins when necessary

### Token Security

- Admin tokens are stored in `localStorage` (client-side)
- Tokens expire based on JWT expiration (`exp` claim)
- Logout clears token from localStorage
- Tokens are validated on every request to protected endpoints

### Network Security

- Admin-service should only be accessible from trusted networks in production
- Use HTTPS in production
- Configure CORS appropriately for production origins
- Consider IP whitelisting for admin endpoints

## Additional Resources

- **Admin Panel Plan:** `ADMIN_PANEL_AUTHENTICATION_PLAN.md`
- **Quick Start Guide:** `ADMIN_QUICK_START.md`
- **Backend/Frontend Mapping:** `BACKEND_FRONTEND_MAPPING.md`
- **Admin Dashboard Docs:** `backend/docs/3_REPOSITORY_BREAKDOWN/ADMIN_DASHBOARD.md`

## Support

For issues or questions:
1. Check this guide's troubleshooting section
2. Review admin-service logs for errors
3. Check browser console for frontend errors
4. Verify all environment variables are set correctly
5. Ensure database migrations are applied
