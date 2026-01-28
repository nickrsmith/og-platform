# Persona Verification Testing Guide

This document outlines the testing procedures for the Persona identity verification integration.

## Overview

The Persona verification system consists of:
1. **Backend Endpoints:**
   - `POST /verification/persona/session` - Create verification session
   - `GET /verification/persona/status` - Get verification status
   - `POST /verification/webhooks/persona` - Webhook handler

2. **Frontend Components:**
   - `identity-verification.tsx` - Main verification page
   - `verification-gate.tsx` - Gate component that blocks unverified users

## Test Cases

### Test Case 1: Create Persona Session

**Objective:** Verify that a user can create a Persona verification session.

**Steps:**
1. Authenticate as a user (JWT token required)
2. Call `POST /verification/persona/session`
3. Verify response contains `sessionId` and `clientToken`
4. Verify session ID is stored in database (`personaSessionId` field)

**Expected Results:**
- Status: 200 OK
- Response body contains `{ sessionId: string, clientToken: string }`
- Database updated with `personaSessionId`
- User's `kycStatus` is set to `'pending'` (if not already set)

**Test Data:**
```json
POST /api/v1/verification/persona/session
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "templateId": "optional-template-id"
}
```

### Test Case 2: Get Verification Status

**Objective:** Verify that verification status can be retrieved.

**Steps:**
1. Authenticate as a user
2. Call `GET /verification/persona/status`
3. Verify response contains current status

**Expected Results:**
- Status: 200 OK
- Response body contains:
  ```json
  {
    "verified": boolean,
    "status": "pending" | "verified" | "failed",
    "sessionId": string | null,
    "personaStatus": string | undefined
  }
  ```

**Test Scenarios:**
- **Unverified user:** `verified: false, status: "pending"`
- **Verified user:** `verified: true, status: "verified"`
- **Failed verification:** `verified: false, status: "failed"`

### Test Case 3: Persona Webhook Handling

**Objective:** Verify that webhooks from Persona update user verification status.

**Steps:**
1. Set up webhook endpoint (configure in Persona dashboard)
2. Trigger verification completion in Persona
3. Verify webhook is received at `POST /verification/webhooks/persona`
4. Check database for updated verification status

**Expected Webhook Payload:**
```json
{
  "data": {
    "type": "inquiry",
    "id": "inq_xxxxx",
    "attributes": {
      "status": "completed",
      "name-first": "John",
      "name-last": "Doe"
    }
  }
}
```

**Expected Results:**
- Webhook processed successfully (200 OK)
- User's `personaVerified` field updated to `true`
- User's `kycStatus` updated to `'verified'`
- User's `personaSessionId` matches webhook inquiry ID

**Test Scenarios:**
- **Successful verification:** `kycStatus: "verified", personaVerified: true`
- **Failed verification:** `kycStatus: "failed", personaVerified: false`
- **Pending verification:** `kycStatus: "pending", personaVerified: false`

### Test Case 4: Frontend Verification Flow

**Objective:** Verify end-to-end verification flow in the frontend.

**Steps:**
1. Navigate to `/verify-identity` page
2. Click "Start Verification" button
3. Complete Persona verification flow (or use mock mode)
4. Verify redirect to intended page after completion

**Expected Results:**
- Persona SDK initializes correctly
- Verification flow opens in Persona modal
- On completion, user redirected to dashboard or original redirect path
- Verification status badge shows "Verified"

**Test Scenarios:**
- **With redirect:** User redirected from `/create-listing` should return after verification
- **Without redirect:** User redirected to dashboard
- **Failed verification:** User sees error message and can retry

### Test Case 5: Verification Gate Component

**Objective:** Verify that unverified users are blocked from creating listings.

**Steps:**
1. Login as unverified user
2. Navigate to `/create-listing`
3. Verify verification gate is shown
4. Verify listing form is not accessible

**Expected Results:**
- Verification gate displays blocking UI
- Status badge shows "Pending" or "Not Verified"
- "Start Verification" button redirects to `/verify-identity`
- Listing form is not visible until verification complete

**Test Scenarios:**
- **Unverified user:** Gate blocks access
- **Verified user:** Gate allows access, shows listing form
- **Pending verification:** Gate shows "Pending" status with option to check/retry

### Test Case 6: Verification Status Persistence

**Objective:** Verify that verification status persists across sessions.

**Steps:**
1. Complete verification as a user
2. Logout
3. Login again
4. Verify status is still "verified"

**Expected Results:**
- User's `personaVerified` remains `true` after logout/login
- Verification gate allows access after login
- No re-verification required

### Test Case 7: Multiple Verification Attempts

**Objective:** Verify behavior when user attempts verification multiple times.

**Steps:**
1. Create first verification session
2. Start verification but don't complete
3. Create second verification session
4. Complete verification

**Expected Results:**
- New session ID replaces old session ID in database
- Most recent session is used for status checks
- Webhook updates correct session

## Integration Test Setup

### Prerequisites
1. Persona account with API keys configured
2. Webhook URL configured in Persona dashboard
3. Test users with different verification states
4. Backend running on `http://localhost:3002`
5. Frontend running on `http://localhost:5000`

### Environment Variables Required
```bash
PERSONA_API_KEY=your_persona_api_key
PERSONA_WEBHOOK_SECRET=your_webhook_secret  # For webhook signature verification
```

### Manual Test Checklist

- [ ] Test Case 1: Create Persona Session
- [ ] Test Case 2: Get Verification Status
- [ ] Test Case 3: Persona Webhook Handling
- [ ] Test Case 4: Frontend Verification Flow
- [ ] Test Case 5: Verification Gate Component
- [ ] Test Case 6: Verification Status Persistence
- [ ] Test Case 7: Multiple Verification Attempts

## Error Scenarios

### Error 1: Missing API Key
**Scenario:** `PERSONA_API_KEY` not set
**Expected:** Error logged, verification fails gracefully
**Action:** Set API key in environment variables

### Error 2: Invalid Session Token
**Scenario:** Client token expired or invalid
**Expected:** Persona SDK shows error, user can retry
**Action:** Create new session

### Error 3: Webhook Signature Mismatch
**Scenario:** Webhook received with invalid signature
**Expected:** Webhook rejected, logged as error
**Action:** Verify `PERSONA_WEBHOOK_SECRET` matches Persona dashboard

### Error 4: User Not Authenticated
**Scenario:** API called without JWT token
**Expected:** 401 Unauthorized
**Action:** Ensure user is logged in

## Performance Testing

### Load Test
- Create 10 verification sessions simultaneously
- Verify all sessions created successfully
- Check database for correct session storage

### Concurrency Test
- Multiple users verify simultaneously
- Verify webhooks processed correctly
- Verify no race conditions in status updates

## Security Testing

### Test Cases
1. **Webhook Signature Verification:** Verify webhooks are validated
2. **User Isolation:** User A cannot see User B's verification status
3. **SQL Injection:** Verify database queries are parameterized
4. **XSS Prevention:** Verify frontend sanitizes user input

## Notes

- In development/mock mode, verification auto-approves for faster testing
- Persona SDK requires HTTPS in production (or localhost for development)
- Webhook endpoint should be publicly accessible (use ngrok for local testing)
- Verification status is cached in user object; may require refresh to see updates
