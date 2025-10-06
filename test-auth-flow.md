# Auth Flow Testing

## Issue: Login loops back to sign-in page

### Test the auth flow manually:

1. **Test login API:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"accountId":"demo-user","pin":"0000"}' \
  -c cookies.txt
```

2. **Test /api/auth/me with cookie:**
```bash
curl http://localhost:3000/api/auth/me \
  -b cookies.txt
```

Expected response should have `authenticated: true` field.

### Recent fixes:
- ✅ Changed `/api/auth/me` response from `{success: true}` to `{authenticated: true}`
- ✅ Added theme initialization script to prevent background flash

### Debugging steps:
1. Check browser console for errors
2. Check Network tab for `/api/auth/me` response
3. Check if `auth_token` cookie is being set
4. Check if cookie is being sent with subsequent requests

### Potential issues:
1. Cookie not being set (check Set-Cookie header)
2. Cookie not persisting across page navigation
3. Cookie SameSite policy blocking it
4. Hydration issue causing auth state reset
5. useAuth hook checking auth before cookie loads
