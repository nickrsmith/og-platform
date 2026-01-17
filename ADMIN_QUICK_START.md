# Admin Panel Quick Start Guide

## 🚀 Quick Setup

### 1. Create Admin User

```bash
cd backend
node scripts/create-admin.mjs admin@example.com Admin User
# Or with your own password (min 12 chars):
node scripts/create-admin.mjs admin@example.com Admin User "YourSecurePassword123!"
```

**Output:** Creates a CSV file with credentials - **SAVE THESE CREDENTIALS!**

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

### 3. Start Frontend (if not running)

```bash
cd frontend
npm run dev
```

**Expected:** Frontend runs on `http://localhost:5000` (or 5173)

### 4. Login to Admin Panel

1. Visit: `http://localhost:5000/admin/login`
2. Enter credentials from CSV file
3. Should redirect to `/admin` panel

---

## 🔧 Troubleshooting "Failed to fetch" Error

### Check 1: Is admin-service running?
```bash
# Check if port 4243 is listening
netstat -ano | findstr :4243  # Windows
lsof -i :4243  # Mac/Linux
```

### Check 2: Verify port configuration
- **Admin Service:** Default port is **4243** (check console output)
- **Frontend API Client:** Defaults to **4243** (in `api-admin.ts`)
- **Environment Variable:** Set `VITE_ADMIN_API_URL=http://localhost:4243` if needed

### Check 3: Test admin-service directly
```bash
# Test login endpoint
curl -X POST http://localhost:4243/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-admin@email.com","password":"your-password"}'
```

### Check 4: Check CORS
- Admin-service allows all localhost origins in development
- If still having issues, check browser console for CORS errors

### Check 5: Verify credentials
- Make sure admin user exists: Check database or run create-admin script again
- Password must be at least 12 characters
- Email must match exactly (case-sensitive)

---

## 📝 Default Ports

- **Frontend:** `http://localhost:5000` (config in `vite.config.ts`)
- **Admin Service:** `http://localhost:4243` (default, configurable via `ADMIN_SERVICE_PORT`)
- **Core API:** `http://localhost:3000` (default)

---

## 🔐 Admin Credentials Storage

Credentials are saved to:
- **File:** `admin-credentials-{firstname}-{lastname}.csv`
- **Location:** `backend/` directory (or `/tmp` on Linux if permission denied)

**⚠️ SECURITY WARNING:** Delete CSV file after saving credentials securely!
