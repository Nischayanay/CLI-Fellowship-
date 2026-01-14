# Backend Authentication API Requirements

## Overview

The PBCLI now calls YOUR backend API instead of Supabase directly. This is more secure because:
- ✅ No Supabase credentials exposed in CLI
- ✅ You control rate limiting and validation
- ✅ You can add custom business logic
- ✅ Easier to switch auth providers later

## Required Backend Endpoints

### 1. POST `/auth/signup`

Create a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "full_name": "John Doe" // optional
}
```

**Success Response (201):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "v1.MRjcyk1da...",
  "expires_in": 3600,
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "email_confirmed_at": null // or timestamp if auto-confirmed
  }
}
```

**Error Responses:**

**409 Conflict** - Email already exists:
```json
{
  "error": "User already registered",
  "message": "An account with this email already exists"
}
```

**400 Bad Request** - Invalid input:
```json
{
  "error": "Invalid password",
  "message": "Password must be at least 8 characters"
}
```

**Backend Implementation (Example with Supabase):**
```typescript
// POST /auth/signup
export async function signup(req, res) {
  const { email, password, full_name } = req.body;
  
  // Validate input
  if (!email || !password) {
    return res.status(400).json({
      error: 'Missing required fields',
      message: 'Email and password are required'
    });
  }
  
  if (password.length < 8) {
    return res.status(400).json({
      error: 'Invalid password',
      message: 'Password must be at least 8 characters'
    });
  }
  
  try {
    // Call Supabase with YOUR server-side credentials
    const { data, error } = await supabaseAdmin.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: full_name || null
        }
      }
    });
    
    if (error) {
      if (error.message.includes('already registered')) {
        return res.status(409).json({
          error: 'User already registered',
          message: 'An account with this email already exists'
        });
      }
      throw error;
    }
    
    return res.status(201).json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in,
      user: {
        id: data.user.id,
        email: data.user.email,
        email_confirmed_at: data.user.email_confirmed_at
      }
    });
    
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create account'
    });
  }
}
```

---

### 2. POST `/auth/login`

Authenticate an existing user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Success Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "v1.MRjcyk1da...",
  "expires_in": 3600,
  "user": {
    "id": "uuid-here",
    "email": "user@example.com"
  }
}
```

**Error Responses:**

**401 Unauthorized** - Invalid credentials:
```json
{
  "error": "Invalid credentials",
  "message": "Email or password is incorrect"
}
```

**404 Not Found** - User doesn't exist:
```json
{
  "error": "User not found",
  "message": "No account found with this email"
}
```

**Backend Implementation (Example with Supabase):**
```typescript
// POST /auth/login
export async function login(req, res) {
  const { email, password } = req.body;
  
  // Validate input
  if (!email || !password) {
    return res.status(400).json({
      error: 'Missing required fields',
      message: 'Email and password are required'
    });
  }
  
  try {
    // Call Supabase with YOUR server-side credentials
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        return res.status(401).json({
          error: 'Invalid credentials',
          message: 'Email or password is incorrect'
        });
      }
      throw error;
    }
    
    return res.status(200).json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in,
      user: {
        id: data.user.id,
        email: data.user.email
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to authenticate'
    });
  }
}
```

---

## Security Best Practices

### 1. **Use Supabase Service Role Key (Server-Side Only)**
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, // Server-side only!
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
```

### 2. **Rate Limiting**
```typescript
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many authentication attempts, please try again later'
});

app.post('/auth/signup', authLimiter, signup);
app.post('/auth/login', authLimiter, login);
```

### 3. **Input Validation**
```typescript
import validator from 'validator';

function validateEmail(email: string): boolean {
  return validator.isEmail(email);
}

function validatePassword(password: string): boolean {
  return password.length >= 8;
}
```

### 4. **CORS Configuration**
```typescript
import cors from 'cors';

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));
```

---

## Environment Variables Needed

Add these to your backend `.env`:

```bash
# Supabase Configuration
SUPABASE_URL=https://ubgmotiourmwaudgeexx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here  # NEVER expose this!
SUPABASE_ANON_KEY=your-anon-key-here  # Optional, for client-side if needed

# API Configuration
PORT=3000
NODE_ENV=production
ALLOWED_ORIGINS=https://promptbrain.io,https://api.promptbrain.io
```

---

## Testing the Endpoints

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

### Test Login:
```bash
curl -X POST https://promptbrain-context-engine.vercel.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123"
  }'
```

---

## Next Steps

1. ✅ **CLI Updated** - Now calls `/auth/signup` and `/auth/login`
2. ⏳ **Backend Implementation** - You need to add these endpoints
3. ⏳ **Testing** - Test signup/login flow end-to-end
4. ⏳ **Deploy** - Deploy backend changes to Vercel

Once you implement these endpoints, the CLI will work perfectly!
