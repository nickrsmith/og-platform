# Frontend Quick Start Guide

## 🚀 Running the Frontend with Mock Data

The frontend is configured to use **mock data by default** for development, so you can work on the UI without needing the backend running.

### Starting the Development Server

```bash
cd frontend
npm install  # Only needed first time
npm run dev
```

The server will start on **http://localhost:5000**

### Mock Data System

The frontend automatically uses mock data when:
- `VITE_USE_MOCK_API` is not set to `false` (defaults to `true`)
- Backend API is unavailable
- API requests fail

**Mock data includes:**
- ✅ User authentication (dev token bypass)
- ✅ Assets/listings
- ✅ Data rooms
- ✅ Transactions
- ✅ Division orders
- ✅ Enverus integration data

### Development Authentication

For quick UI development, you can bypass authentication:

1. **Dev Token Method:**
   - Open browser console
   - Run: `localStorage.setItem('access_token', 'dev-token-bypass')`
   - Refresh the page
   - You'll be logged in as a dev user

2. **User Category Override:**
   - To test different user categories (A, B, C):
   - Run: `localStorage.setItem('dev_user_category', 'A')` (or 'B' or 'C')
   - Refresh the page

### Available Pages

Once running, you can access:

- **Dashboard:** http://localhost:5000/
- **Marketplace:** http://localhost:5000/marketplace
- **My Assets:** http://localhost:5000/my-assets
- **Create Listing:** http://localhost:5000/create-listing
- **Data Rooms:** http://localhost:5000/data-rooms
- **Settlements:** http://localhost:5000/settlements
- **Portfolio:** http://localhost:5000/portfolio
- **Login:** http://localhost:5000/login

### Environment Variables (Optional)

Create a `.env` file in the `frontend/` directory if you need to customize:

```env
# Use real API instead of mock data
# For MVP: Set to false to connect to real backend
VITE_USE_MOCK_API=false

# API base URL (if using real backend)
VITE_API_BASE_URL=http://localhost:3000

# API version
VITE_API_VERSION=v1

# Mock API delay (ms) - simulate network latency (only used when VITE_USE_MOCK_API=true)
VITE_MOCK_API_DELAY=300
```

**For MVP:** Set `VITE_USE_MOCK_API=false` in your `.env` file to use the real backend API instead of mock data.

### Troubleshooting

**Web3Auth Error (Invalid clientId):**
- This is fixed automatically in mock mode - Web3Auth is disabled when using mock data
- If you see this error, refresh the page - the fix skips Web3Auth initialization in mock mode

**Port already in use:**
- Change port in `vite.config.ts` (line 63: `port: 5000`)

**Dependencies issues:**
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again

**Build errors:**
- Check TypeScript errors: `npm run check`
- Clear Vite cache: Delete `.vite` folder if it exists

### Mock Data Location

Mock data is located in:
- `src/lib/mock-api/` - All mock API implementations
- `src/lib/mock-data.ts` - Static mock data
- `src/lib/services/` - Service layer that uses mock data

### Next Steps

1. ✅ Server running on http://localhost:5000
2. ✅ Mock data enabled by default
3. ✅ Use dev token for authentication bypass
4. 🎨 Start designing and building UI components!

---

**Note:** The mock API system automatically falls back to mock data if the real API is unavailable, so you can develop the frontend independently.
