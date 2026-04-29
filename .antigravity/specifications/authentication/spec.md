# Feature Specification: Authentication & Session Management

---

## 1. Objective

Deliver a complete authentication system for the wardrobe app:
- JWT email/password register (with 409 duplicate-email guard) and login
- Session persistence via `GET /auth/me` on every page reload
- Google and Facebook OAuth via Passport.js with automatic account linking by email
- Frontend Zustand auth store, Axios Bearer interceptor, protected routes, login/register pages with social buttons and real-time email validation

The backend `AuthModule` is already scaffolded. This spec covers the remaining gaps and the full frontend integration layer.

---

## 2. Technical Specs

### 2.1 Backend

#### Existing Module: `back-end/src/auth/`

No new module is needed. All files already exist. The tasks below address gaps and ensure Swagger completeness for Orval generation.

**File structure (existing):**
```
back-end/src/auth/
├── dto/
│   ├── register.dto.ts        ✓ exists
│   ├── login.dto.ts           ✓ exists
│   ├── auth-response.dto.ts   ✓ exists
│   └── user-profile.dto.ts    ✓ exists — needs provider field added
├── auth.controller.ts         ✓ exists — needs facebook/callback endpoint added
├── auth.service.ts            ✓ exists
├── auth.module.ts             ✓ exists
├── jwt.strategy.ts            ✓ exists
├── google.strategy.ts         ✓ exists
└── facebook.strategy.ts       ✓ exists
```

---

#### Gap 1: `UserProfileDto` — add `provider` field

`GET /auth/me` must expose the `provider` field so the frontend can conditionally show "change password" UI only for local accounts.

```typescript
// back-end/src/auth/dto/user-profile.dto.ts — add this field
@ApiProperty({ enum: ['local', 'google', 'facebook'], example: 'local' })
provider: 'local' | 'google' | 'facebook';
```

---

#### Gap 2: `AuthController` — add `GET /auth/facebook/callback`

The Facebook callback endpoint is missing from the controller (only `GET /auth/facebook` exists). Add:

```typescript
@Get('facebook/callback')
@UseGuards(AuthGuard('facebook'))
@ApiOperation({ summary: 'Facebook OAuth callback — issues JWT and redirects to frontend' })
@ApiResponse({ status: 302, description: 'Redirect to frontend with token' })
async facebookCallback(
  @Req() req: Request & { user: SocialCallbackUser },
  @Res() res: Response,
) {
  const result = await this.authService.validateSocialLogin(req.user);
  const frontendUrl = this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';
  return res.redirect(`${frontendUrl}/auth/callback?token=${result.access_token}`);
}
```

---

#### Existing Endpoints (no changes needed)

**`POST /auth/register`**
- Body: `RegisterDto` — `{ email, password, firstName, lastName }`
- Success: `201 AuthResponseDto` — `{ access_token: string }`
- Error: `409` if email already exists

**`POST /auth/login`**
- Body: `LoginDto` — `{ email, password }`
- Success: `200 AuthResponseDto` — `{ access_token: string }`
- Error: `401` if credentials invalid

**`GET /auth/me`** — requires `Authorization: Bearer <token>`
- Success: `200 UserProfileDto`
- Error: `401` if token expired or invalid

**`GET /auth/google`** — browser redirect to Google consent
**`GET /auth/google/callback`** — Google callback → `302` to `FRONTEND_URL/auth/callback?token=<jwt>`
**`GET /auth/facebook`** — browser redirect to Facebook consent
**`GET /auth/facebook/callback`** — Facebook callback → `302` to `FRONTEND_URL/auth/callback?token=<jwt>`

---

#### User Schema (no changes)

`user.schema.ts` already has all required fields including `provider: 'local' | 'google' | 'facebook'`. No schema migration needed.

---

### 2.2 Frontend

#### New Files

```
front-end/src/
├── store/
│   └── useAuthStore.ts              Zustand auth store
├── services/
│   └── api.ts                       Axios instance with Bearer interceptor
├── pages/
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   └── AuthCallbackPage.tsx         Handles /auth/callback?token=
├── components/auth/
│   ├── ProtectedRoute.tsx
│   ├── SocialLoginButtons.tsx
│   └── EmailField.tsx               Input with real-time 409 check on blur
└── App.tsx                          Add initAuth() on mount + route setup
```

---

#### `useAuthStore.ts` (Zustand)

```typescript
import { create } from 'zustand'
import { UserProfileDto } from '@/api/generated'   // Orval-generated type

interface AuthState {
  user: UserProfileDto | null
  isAuthenticated: boolean
  isLoading: boolean
  initAuth: () => Promise<void>
  setUser: (user: UserProfileDto) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  initAuth: async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      set({ isLoading: false, isAuthenticated: false })
      return
    }
    try {
      // useGetAuthMe Orval hook is called inside a component;
      // for imperative use, call the underlying axios instance directly
      const { data } = await apiClient.get<UserProfileDto>('/auth/me')
      set({ user: data, isAuthenticated: true, isLoading: false })
    } catch {
      localStorage.removeItem('token')
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },

  setUser: (user) => set({ user, isAuthenticated: true }),

  clearAuth: () => {
    localStorage.removeItem('token')
    set({ user: null, isAuthenticated: false })
  },
}))
```

---

#### `services/api.ts` — Axios instance with Bearer interceptor

```typescript
import axios from 'axios'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
})

// Attach token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// On 401 — clear auth and redirect to login
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)
```

> Orval must be configured to use this `apiClient` instance as its custom axios instance so all generated hooks share the interceptor.

---

#### `ProtectedRoute.tsx`

```typescript
interface ProtectedRouteProps {
  children: ReactNode
}

// Renders children if authenticated; redirects to /login otherwise.
// Shows a loading spinner while initAuth() is in progress.
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuthStore()
  if (isLoading) return <LoadingSpinner />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}
```

---

#### `LoginPage.tsx`

State:
- `email: string`, `password: string`, `error: string | null`, `isSubmitting: boolean`

Behaviour:
- On submit → call Orval hook `usePostAuthLogin()` mutation
- On success → `localStorage.setItem('token', data.access_token)` → call `useGetAuthMe()` → `useAuthStore.setUser()` → navigate `/dashboard`
- On 401 → set `error = 'Invalid email or password'`
- Render `<SocialLoginButtons>` below the form

---

#### `RegisterPage.tsx`

State:
- `email: string`, `password: string`, `firstName: string`, `lastName: string`
- `emailError: string | null`, `formError: string | null`, `isSubmitting: boolean`

Behaviour:
- `<EmailField onBlur>` — on blur, call `usePostAuthRegister()` with a dummy payload to check 409, OR use a dedicated `GET /auth/check-email?email=` endpoint if added (see Gap 3 below)
- On submit → call `usePostAuthRegister()` mutation
- On 409 → set `emailError = 'This email is already registered'`
- On success → same flow as LoginPage (store token → fetch me → redirect)

> **Gap 3 (optional enhancement):** Add `GET /auth/check-email?email=` endpoint returning `{ exists: boolean }` to enable non-destructive real-time email check without triggering a full register attempt. If not added, the real-time check is skipped and the 409 is only surfaced on form submit.

---

#### `AuthCallbackPage.tsx`

```typescript
// Mounted at route /auth/callback
// Reads ?token from URL, stores it, fetches /auth/me, redirects to /dashboard
export function AuthCallbackPage() {
  const navigate = useNavigate()
  const { setUser } = useAuthStore()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (!token) {
      navigate('/login?error=oauth_failed', { replace: true })
      return
    }
    localStorage.setItem('token', token)
    apiClient.get<UserProfileDto>('/auth/me').then(({ data }) => {
      setUser(data)
      navigate('/dashboard', { replace: true })
    }).catch(() => {
      localStorage.removeItem('token')
      navigate('/login?error=oauth_failed', { replace: true })
    })
  }, [])

  return <LoadingSpinner />
}
```

---

#### `SocialLoginButtons.tsx`

```typescript
interface SocialLoginButtonsProps {
  disabled?: boolean
}

// Renders two anchor buttons that trigger browser navigation to OAuth endpoints.
// Uses window.location.href (not React Router) because OAuth requires a full redirect.
export function SocialLoginButtons({ disabled }: SocialLoginButtonsProps) {
  const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
  return (
    <div className="flex flex-col gap-3">
      <a href={`${apiUrl}/auth/google`}
         className="flex items-center justify-center gap-2 w-full border rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors">
        {/* Google SVG icon */} Sign in with Google
      </a>
      <a href={`${apiUrl}/auth/facebook`}
         className="flex items-center justify-center gap-2 w-full bg-[#1877F2] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#166FE5] transition-colors">
        {/* Facebook SVG icon */} Sign in with Facebook
      </a>
    </div>
  )
}
```

---

#### `App.tsx` — init auth on mount

```typescript
// In App.tsx, call initAuth() once on mount before rendering routes
const { initAuth, isLoading } = useAuthStore()

useEffect(() => {
  initAuth()
}, [])

if (isLoading) return <FullPageSpinner />
```

---

#### Router Setup

```typescript
<Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route path="/register" element={<RegisterPage />} />
  <Route path="/auth/callback" element={<AuthCallbackPage />} />

  {/* Protected routes */}
  <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
  <Route path="/wardrobe" element={<ProtectedRoute><WardrobePage /></ProtectedRoute>} />
  {/* ... other protected routes */}
</Routes>
```

---

#### Frontend Environment Variables

```env
VITE_API_URL=http://localhost:3000
```

---

## 3. Execution Steps

### Task 1: Backend — Fix Gaps & Ensure Swagger Completeness

1. Open `back-end/src/auth/dto/user-profile.dto.ts`
   - Add `@ApiProperty({ enum: ['local', 'google', 'facebook'] }) provider: 'local' | 'google' | 'facebook'`

2. Open `back-end/src/auth/auth.controller.ts`
   - Add `GET /auth/facebook/callback` handler (see Gap 2 above)
   - Verify all 7 endpoints have `@ApiOperation` and `@ApiResponse` decorators

3. (Optional) Add `GET /auth/check-email` endpoint for real-time email validation:
   - Controller: `@Get('check-email') @ApiOperation(...) checkEmail(@Query('email') email: string): Promise<{ exists: boolean }>`
   - Service: `async checkEmail(email: string): Promise<{ exists: boolean }>` — calls `usersService.findByEmail(email)`

4. Run backend: `cd back-end && npm run start:dev`
   - Verify Swagger at `http://localhost:3000/api/docs` shows all auth endpoints with correct response schemas

### Task 2: Orval Generation

5. Run Orval: `npm run gen:api` (from front-end directory)
   - Confirm generated hooks include: `usePostAuthRegister`, `usePostAuthLogin`, `useGetAuthMe`
   - Confirm `UserProfileDto` type includes `provider` field
   - Confirm Orval is configured to use the custom `apiClient` from `src/services/api.ts`

### Task 3: Frontend Implementation

6. Create `front-end/src/services/api.ts` — Axios instance with request + response interceptors

7. Create `front-end/src/store/useAuthStore.ts` — Zustand store with `initAuth`, `setUser`, `clearAuth`

8. Create `front-end/src/components/auth/ProtectedRoute.tsx`

9. Create `front-end/src/components/auth/SocialLoginButtons.tsx`

10. Create `front-end/src/components/auth/EmailField.tsx` — input with onBlur 409 check

11. Create `front-end/src/pages/LoginPage.tsx` — form + social buttons + error handling

12. Create `front-end/src/pages/RegisterPage.tsx` — form with real-time email check

13. Create `front-end/src/pages/AuthCallbackPage.tsx` — OAuth token handler

14. Update `front-end/src/App.tsx`:
    - Call `initAuth()` on mount
    - Wrap protected routes with `<ProtectedRoute>`
    - Add `/auth/callback` route

15. Add `VITE_API_URL` to `front-end/.env`

---

## 4. Validation

### Backend

| Test | Expected Result |
|------|----------------|
| `POST /auth/register` with new email | `201 { access_token: "eyJ..." }` |
| `POST /auth/register` with duplicate email | `409 { message: "Email already in use" }` |
| `POST /auth/login` with correct credentials | `200 { access_token: "eyJ..." }` |
| `POST /auth/login` with wrong password | `401 { message: "Invalid credentials" }` |
| `GET /auth/me` with valid Bearer token | `200 UserProfileDto` including `provider` field |
| `GET /auth/me` with expired/invalid token | `401 Unauthorized` |
| `GET /auth/google` | `302` redirect to `accounts.google.com` |
| `GET /auth/facebook` | `302` redirect to `facebook.com` |
| `GET /auth/google/callback` (mocked) | `302` redirect to `FRONTEND_URL/auth/callback?token=...` |
| `GET /auth/facebook/callback` (mocked) | `302` redirect to `FRONTEND_URL/auth/callback?token=...` |

### Frontend

| Scenario | Expected Behaviour |
|----------|--------------------|
| F5 on `/dashboard` with valid token in localStorage | App calls `/auth/me`, restores session, stays on `/dashboard` |
| F5 on `/dashboard` with expired token | App calls `/auth/me`, gets 401, clears token, redirects to `/login` |
| F5 on `/dashboard` with no token | `ProtectedRoute` redirects to `/login` immediately |
| Register with new email | Success → token stored → redirect to `/dashboard` |
| Register with existing email | Inline error under email field: "This email is already registered" |
| Login with wrong password | Banner error: "Invalid email or password" |
| Click "Sign in with Google" | Browser navigates to `VITE_API_URL/auth/google` |
| Return to `/auth/callback?token=<jwt>` | Token stored, `/auth/me` called, redirect to `/dashboard` |
| Return to `/auth/callback` without token | Redirect to `/login?error=oauth_failed` |
| Navigate to `/wardrobe` without auth | Redirect to `/login` |
| All API requests after login | `Authorization: Bearer <token>` header present |
