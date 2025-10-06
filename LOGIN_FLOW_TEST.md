# Login Flow Test Guide

## Test Accounts

### 1. Demo Account
- **Account ID**: `demo-user`
- **PIN**: `0000`
- **Name**: Demo User
- **Email**: demo@astralplanner.com
- **Type**: Demo Account
- **Premium**: No
- **Role**: user
- **Avatar**: 🎯
- **Theme**: Green
- **Features**: Full access to demo features with sample data

### 2. Premium Account (Nick's Account)
- **Account ID**: `nick-planner`
- **PIN**: `7347`
- **Name**: Nick
- **Email**: nick@astralplanner.com
- **Type**: Regular Account
- **Premium**: Yes
- **Role**: premium
- **Avatar**: 👨‍💼
- **Theme**: Blue
- **Features**: Full premium access to all features

## Login Flow Steps

### 1. Account Selection
1. User visits `/login`
2. Two account cards are displayed:
   - Demo Account (with green demo badge)
   - Nick's Planner (with ⚡ premium badge)
3. Click on desired account card
4. Transition to PIN entry screen

### 2. PIN Entry
1. Selected account is displayed at top
2. 4-digit PIN input field is focused
3. For Demo Account:
   - PIN `0000` is auto-filled
   - Green indicator shows "Demo PIN auto-filled for easy access"
   - Security score shows "Weak" (expected for demo)
4. For Nick's Account:
   - User must enter PIN `7347`
   - Security score dynamically updates based on PIN strength
5. Visual indicators:
   - Back button to return to account selection
   - Sign In button (disabled until 4 digits entered)

### 3. Authentication Process
1. User clicks "Sign In" or presses Enter
2. Step transitions to "verifying"
3. Animated purple/pink gradient shield rotates
4. Progress bar shows 0-100%
5. API calls:
   - POST `/api/auth/login` with accountId and PIN
   - Server validates credentials
   - Returns user data and tokens

### 4. Success State
1. Green checkmark animation
2. "Welcome Back!" message
3. "Redirecting to your dashboard..." text
4. 1.5 second delay for visual feedback
5. Automatic redirect to `/dashboard`

### 5. Session Management
- Access token stored in httpOnly cookie (1 hour expiry)
- Refresh token stored in localStorage (7 days expiry)
- User data cached in localStorage as `current-user`
- Session verified on page load via `/api/auth/me`
- Auto-refresh every 14 minutes

## Error Handling

### Wrong PIN
- Error message: "Invalid PIN for [Name]'s account. Please check your PIN and try again."
- Attempts remaining indicator shown
- PIN field cleared
- Focus returns to PIN input
- User can retry

### Network Error
- Error message: "Network error. Please try again."
- Loading state cleared
- User returned to PIN entry
- Can retry immediately

### Account Lockout (if implemented)
- After 5 failed attempts
- Lockout for 5 minutes
- Timer shows countdown
- All inputs disabled during lockout

## Security Features

### Client-Side
- Device fingerprinting (canvas + user agent + screen)
- PIN input validation (numeric only, 4 digits max)
- Security score calculation for non-demo accounts
- Session timeout (24 hours local, 1 hour server)
- XSS protection via CSP headers
- CSRF protection via SameSite cookies

### Server-Side
- PIN verification with constant-time comparison
- Rate limiting per IP
- Secure token generation (Base64 encoded with expiry)
- HttpOnly cookies for access tokens
- Audit logging for all authentication events
- Zod schema validation for all inputs

## Testing Checklist

### Demo Account Login
- [ ] Account card displays correctly with demo badge
- [ ] Click account card transitions to PIN entry
- [ ] PIN is auto-filled with `0000`
- [ ] Green success indicator shows
- [ ] Sign In button is enabled
- [ ] Click Sign In shows verifying state
- [ ] Progress bar animates 0-100%
- [ ] Success checkmark appears
- [ ] Redirects to `/dashboard` after 1.5s
- [ ] User name shows as "Demo User" in dashboard
- [ ] Avatar shows 🎯 emoji
- [ ] Green theme is applied

### Nick's Account Login
- [ ] Account card displays correctly with premium ⚡ badge
- [ ] Click account card transitions to PIN entry
- [ ] PIN field is empty (no auto-fill)
- [ ] Enter wrong PIN shows error message
- [ ] Error clears PIN field
- [ ] Enter correct PIN `7347`
- [ ] Security score shows as "Strong"
- [ ] Sign In button enables
- [ ] Click Sign In shows verifying state
- [ ] Success state appears
- [ ] Redirects to `/dashboard`
- [ ] User name shows as "Nick" in dashboard
- [ ] Avatar shows 👨‍💼 emoji
- [ ] Premium features are accessible

### Session Persistence
- [ ] After login, refresh page stays logged in
- [ ] Dashboard shows correct user data
- [ ] Logout clears all session data
- [ ] After logout, redirect to `/login`
- [ ] Protected routes redirect to login when not authenticated
- [ ] Token refresh works automatically
- [ ] Session expires after 24 hours

### UI/UX
- [ ] Cosmic purple theme consistent throughout
- [ ] Animations are smooth (no jank)
- [ ] Loading states are clear
- [ ] Error messages are helpful
- [ ] Back button works correctly
- [ ] Keyboard navigation works (Tab, Enter)
- [ ] Mobile responsive design
- [ ] Accessibility features (ARIA labels, focus states)

## API Endpoints

### POST /api/auth/login
**Request:**
```json
{
  "accountId": "demo-user",
  "pin": "0000",
  "deviceInfo": {
    "fingerprint": "a1b2c3d4"
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "demo-user",
    "username": "demo",
    "firstName": "Demo",
    "lastName": "User",
    "email": "demo@astralplanner.com",
    "isDemo": true,
    "isPremium": false,
    "role": "user",
    "imageUrl": "🎯",
    "onboardingCompleted": true,
    "onboardingStep": 4,
    "settings": {
      "theme": "green",
      "notifications": true
    }
  },
  "tokens": {
    "accessToken": "base64_encoded_token",
    "refreshToken": "base64_encoded_token"
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "error": "Invalid PIN for Demo's account. Please check your PIN and try again.",
  "attemptsRemaining": 4
}
```

### GET /api/auth/me
**Success Response (200):**
```json
{
  "authenticated": true,
  "user": {
    "id": "demo-user",
    "username": "demo",
    "firstName": "Demo",
    "lastName": "User",
    "email": "demo@astralplanner.com",
    "isDemo": true,
    "isPremium": false,
    "role": "user",
    "imageUrl": "🎯",
    "onboardingCompleted": true,
    "settings": {
      "theme": "green",
      "notifications": true
    }
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "error": "Not authenticated"
}
```

### POST /api/auth/refresh
**Request:**
```json
{
  "refreshToken": "base64_encoded_refresh_token"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "accessToken": "new_base64_encoded_token"
}
```

### POST /api/auth/signout
**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## Local Storage Keys

- `current-user`: JSON object with user session data
- `refresh_token`: Base64 encoded refresh token
- `demo-auth`: "true" if demo account is logged in
- `preferences-{userId}`: User preferences (if any)

## Cookies

- `auth_token`: HttpOnly, Secure (production), SameSite=Lax, 1 hour expiry

## Known Issues & Future Improvements

### Current Limitations
- [ ] No actual rate limiting implementation (mocked)
- [ ] No database persistence (in-memory accounts)
- [ ] No email verification
- [ ] No password reset flow
- [ ] No 2FA support
- [ ] No OAuth integration

### Planned Features
- [ ] Implement Redis-based rate limiting
- [ ] Add database integration for user accounts
- [ ] Email verification workflow
- [ ] Password reset via email
- [ ] TOTP 2FA support
- [ ] Biometric authentication
- [ ] Social login (Google, GitHub)
- [ ] Session management dashboard
- [ ] Login history and security audit
- [ ] IP whitelist/blacklist

## Performance Metrics

Expected performance:
- Login API response: < 100ms
- PIN verification: < 50ms
- Token generation: < 20ms
- Session verification: < 80ms
- Total login flow: < 2 seconds
- Page load with session check: < 500ms

## Debugging

### Enable Debug Logs
In browser console:
```javascript
localStorage.setItem('debug', 'auth:*');
```

### Check Current Session
```javascript
console.log(JSON.parse(localStorage.getItem('current-user')));
```

### Clear Session
```javascript
localStorage.clear();
location.reload();
```

### Test API Directly
```javascript
// Test login
fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    accountId: 'demo-user',
    pin: '0000',
    deviceInfo: { fingerprint: 'test' }
  })
}).then(r => r.json()).then(console.log);

// Test session
fetch('/api/auth/me', {
  credentials: 'include'
}).then(r => r.json()).then(console.log);
```
