# TODO Before Publishing v0.1.5

## ⚠️ IMPORTANT: Backend Must Be Deployed First!

The CLI is ready, but it needs your backend endpoints to work.

---

## Step 1: Implement Backend Endpoints ⏳

### Required Files to Create/Update:

**File:** `backend/api/auth/signup.ts` (or similar)

```typescript
// See docs/BACKEND_AUTH_API.md for complete implementation
export async function POST(req: Request) {
  const { email, password, full_name } = await req.json();
  
  // Call Supabase with service role key
  const { data, error } = await supabaseAdmin.auth.signUp({
    email,
    password,
    options: { data: { full_name } }
  });
  
  // Return tokens
  return Response.json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_in: data.session.expires_in,
    user: { id: data.user.id, email: data.user.email }
  });
}
```

**File:** `backend/api/auth/login.ts` (or similar)

```typescript
// See docs/BACKEND_AUTH_API.md for complete implementation
export async function POST(req: Request) {
  const { email, password } = await req.json();
  
  // Call Supabase with service role key
  const { data, error } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password
  });
  
  // Return tokens
  return Response.json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_in: data.session.expires_in,
    user: { id: data.user.id, email: data.user.email }
  });
}
```

### Environment Variables Needed:

Add to your backend `.env`:
```bash
SUPABASE_URL=https://ubgmotiourmwaudgeexx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Where to find service role key:**
1. Go to Supabase Dashboard
2. Settings → API
3. Copy "service_role" key (NOT the anon key!)

---

## Step 2: Test Backend Endpoints ⏳

### Test Signup:
```bash
curl -X POST https://promptbrain-context-engine.vercel.app/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123",
    "full_name": "Test User"
  }'
```

**Expected Response:**
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "v1.MRj...",
  "expires_in": 3600,
  "user": {
    "id": "uuid-here",
    "email": "test@example.com"
  }
}
```

### Test Login:
```bash
curl -X POST https://promptbrain-context-engine.vercel.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123"
  }'
```

### Test Error Cases:

**Duplicate Email:**
```bash
# Run signup twice with same email
# Should return 409 Conflict
```

**Invalid Password:**
```bash
curl -X POST https://promptbrain-context-engine.vercel.app/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "test2@example.com", "password": "short"}'
# Should return 400 Bad Request
```

**Invalid Login:**
```bash
curl -X POST https://promptbrain-context-engine.vercel.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "wrongpass"}'
# Should return 401 Unauthorized
```

---

## Step 3: Test CLI End-to-End ⏳

Once backend is deployed:

### Test Signup:
```bash
./bin/pb signup
# Enter email, password, name
# Should succeed and auto-login
```

### Test Login:
```bash
./bin/pb logout
./bin/pb login
# Enter email, password
# Should succeed
```

### Test Whoami:
```bash
./bin/pb whoami
# Should show user info
```

### Test Error Cases:
```bash
# Duplicate signup
./bin/pb signup
# Use same email - should show friendly error

# Invalid login
./bin/pb login
# Use wrong password - should show helpful message
```

---

## Step 4: Publish to npm ⏳

Once everything works:

```bash
# Update CHANGELOG
# Change [Unreleased] to [0.1.5] - 2024-11-27

# Version bump
npm version patch  # 0.1.4 → 0.1.5

# Commit
git add CHANGELOG.md
git commit -m "Release v0.1.5 - Secure backend auth proxy"

# Push
git push origin main --follow-tags

# Publish
npm publish
```

---

## Step 5: Verify Published Package ⏳

```bash
# Check npm
npm view promptbrain-cli version
# Should show 0.1.5

# Test fresh install
npm install -g promptbrain-cli@latest

# Test signup
pb signup

# Test login
pb login
```

---

## Checklist

- [ ] Backend `/auth/signup` endpoint implemented
- [ ] Backend `/auth/login` endpoint implemented
- [ ] Environment variables configured
- [ ] Backend deployed to Vercel
- [ ] Tested signup with curl (success case)
- [ ] Tested signup with curl (duplicate email)
- [ ] Tested login with curl (success case)
- [ ] Tested login with curl (invalid credentials)
- [ ] Tested CLI signup (success)
- [ ] Tested CLI signup (duplicate email error)
- [ ] Tested CLI login (success)
- [ ] Tested CLI login (invalid credentials error)
- [ ] Tested `pb whoami` after login
- [ ] Updated CHANGELOG [Unreleased] → [0.1.5]
- [ ] Version bumped to 0.1.5
- [ ] Pushed to GitHub
- [ ] Published to npm
- [ ] Verified fresh install works

---

## Documentation Reference

- **Backend API Specs:** `docs/BACKEND_AUTH_API.md`
- **Security Audit:** `SECURITY_AUDIT_REPORT.md`
- **Changelog:** `CHANGELOG.md`

---

## Need Help?

If you encounter issues:

1. Check backend logs in Vercel dashboard
2. Test endpoints with curl first
3. Check CLI error messages
4. Verify environment variables are set
5. Ensure service role key is correct (not anon key!)

---

**Current Status:** ⏳ Waiting for backend implementation

**Next Action:** Implement `/auth/signup` and `/auth/login` endpoints
