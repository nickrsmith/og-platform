# Frontend Environment Variables Setup

This document describes all environment variables needed for the frontend application.

## Quick Setup

1. Create a `.env` file in the `frontend/` directory
2. Copy the variables below into your `.env` file
3. Update values as needed for your environment
4. Restart the dev server after making changes

## Environment Variables

### Required for Production

```bash
# API Configuration
VITE_API_BASE_URL=https://api.your-domain.com
VITE_API_VERSION=v1

# MUST set this to false for production
VITE_USE_MOCK_API=false
```

### Optional (Development)

```bash
# Enable mock API for development (default: true if not set)
VITE_USE_MOCK_API=true

# Mock API delay in milliseconds (default: 300)
VITE_MOCK_API_DELAY=300

# Web3Auth Client ID (optional, only needed if using Web3Auth)
VITE_WEB3AUTH_CLIENT_ID=your_web3auth_client_id_here

# Web3Auth Network (default: testnet)
VITE_WEB3AUTH_NETWORK=testnet
```

## Variable Details

### `VITE_API_BASE_URL`
- **Description:** Backend API base URL
- **Default:** `http://localhost:3002`
- **Development:** `http://localhost:3002`
- **Production:** Your production API URL (e.g., `https://api.your-domain.com`)
- **Required:** Yes for production

### `VITE_API_VERSION`
- **Description:** API version path
- **Default:** `v1`
- **Example:** URLs will be `${VITE_API_BASE_URL}/api/v1/...`
- **Required:** No (will use `v1` if not set)

### `VITE_USE_MOCK_API`
- **Description:** Enable/disable mock API mode
- **Default:** `true` (if not set or empty)
- **Values:** 
  - `false` or `0` = Use real backend API
  - `true` or anything else = Use mock API
- **Development:** Can be `true` to test without backend
- **Production:** **MUST** be `false`
- **Required:** Yes for production

### `VITE_MOCK_API_DELAY`
- **Description:** Simulated network delay for mock API (milliseconds)
- **Default:** `300`
- **Usage:** Only applies when `VITE_USE_MOCK_API=true`
- **Purpose:** Simulate realistic API response times for testing

### `VITE_WEB3AUTH_CLIENT_ID`
- **Description:** Web3Auth client ID for authentication
- **Default:** None (required if using Web3Auth without mock API)
- **Where to get:** https://dashboard.web3auth.io
- **Required:** Yes if using Web3Auth authentication (and `VITE_USE_MOCK_API=false`)

### `VITE_WEB3AUTH_NETWORK`
- **Description:** Web3Auth network environment
- **Default:** `testnet`
- **Values:** `testnet` or `mainnet`
- **Required:** No

## Example Configurations

### Development (Mock API)
```bash
# Use mock API - no backend needed
VITE_USE_MOCK_API=true
VITE_API_BASE_URL=http://localhost:3002
```

### Development (Real Backend)
```bash
# Connect to local backend
VITE_USE_MOCK_API=false
VITE_API_BASE_URL=http://localhost:3002
VITE_API_VERSION=v1
```

### Production
```bash
# Production configuration
VITE_USE_MOCK_API=false
VITE_API_BASE_URL=https://api.your-domain.com
VITE_API_VERSION=v1
VITE_WEB3AUTH_CLIENT_ID=your_production_client_id
VITE_WEB3AUTH_NETWORK=mainnet
```

### Staging
```bash
# Staging configuration
VITE_USE_MOCK_API=false
VITE_API_BASE_URL=https://staging-api.your-domain.com
VITE_API_VERSION=v1
VITE_WEB3AUTH_CLIENT_ID=your_staging_client_id
VITE_WEB3AUTH_NETWORK=testnet
```

## Creating .env File

Create a `.env` file in the `frontend/` directory:

```bash
cd frontend
touch .env
# Or on Windows:
# type nul > .env
```

Then copy the appropriate configuration above into the file.

## Notes

- All Vite environment variables **must** be prefixed with `VITE_`
- Changes to `.env` require restarting the dev server
- `.env` files are git-ignored (never commit them)
- For production deployments (Vercel, Netlify, etc.), set these variables in your hosting platform's environment variable settings
- See `VERCEL_DEPLOYMENT.md` for deployment-specific configuration

## Verification

To verify your environment variables are loaded:

1. In the browser console, check `import.meta.env`
2. You should see all your `VITE_*` variables
3. In code, access via `import.meta.env.VITE_VARIABLE_NAME`

## Troubleshooting

**Mock API still active in production?**
- Ensure `VITE_USE_MOCK_API=false` (not `VITE_USE_MOCK_API=0` or unset)
- Restart dev server after changing `.env`
- Check build output for environment variable values

**API calls failing?**
- Verify `VITE_API_BASE_URL` is correct
- Check CORS settings on backend
- Ensure backend is running (if not using mock API)

**Web3Auth not working?**
- Verify `VITE_WEB3AUTH_CLIENT_ID` is set
- Check `VITE_USE_MOCK_API` is `false` (Web3Auth doesn't work with mock API)
- Verify network setting matches your Web3Auth app configuration
