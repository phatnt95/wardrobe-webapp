# Feature Specification: License Management

---

## 1. Objective

Introduce a tiered subscription system (Free / Pro / Premium) to the wardrobe app. Enforce per-plan limits on items, outfits, and AI features via a NestJS guard. Provide an admin panel for plan management and a frontend subscription page with plan comparison and upgrade flow.

---

## 2. Technical Specs

### 2.1 Backend

#### New NestJS Module: `LicenseModule`

**File structure:**
```
back-end/src/license/
├── schemas/
│   ├── license-plan.schema.ts
│   └── user-license.schema.ts
├── dto/
│   ├── create-plan.dto.ts
│   ├── update-plan.dto.ts
│   ├── subscribe.dto.ts
│   └── license-response.dto.ts
├── guards/
│   └── feature-limit.guard.ts
├── decorators/
│   └── require-feature.decorator.ts
├── license.controller.ts
├── admin-license.controller.ts
├── license.service.ts
└── license.module.ts
```

---

#### Schemas

**`license-plan.schema.ts`**

```typescript
@Schema({ timestamps: true })
export class LicensePlan extends Document {
  @Prop({ required: true, enum: ['free', 'pro', 'premium'], unique: true })
  name: 'free' | 'pro' | 'premium';

  @Prop({ required: true })
  displayName: string;

  @Prop({ required: true, default: 0 })
  price: number;

  @Prop({
    type: {
      maxItems: Number,      // -1 = unlimited
      maxOutfits: Number,    // -1 = unlimited
      aiFeatures: Boolean,
      importExport: Boolean,
      analytics: Boolean,
    },
    required: true,
  })
  limits: {
    maxItems: number;
    maxOutfits: number;
    aiFeatures: boolean;
    importExport: boolean;
    analytics: boolean;
  };

  @Prop({ default: true })
  isActive: boolean;
}
```

**`user-license.schema.ts`**

```typescript
@Schema({ timestamps: true })
export class UserLicense extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ required: true, enum: ['free', 'pro', 'premium'], default: 'free' })
  plan: 'free' | 'pro' | 'premium';

  @Prop({ required: true, enum: ['active', 'expired', 'cancelled'], default: 'active' })
  status: 'active' | 'expired' | 'cancelled';

  @Prop({ required: true })
  startedAt: Date;

  @Prop({ default: null })
  expiresAt: Date | null;
}
```

---

#### DTOs

**`subscribe.dto.ts`**
```typescript
export class SubscribeDto {
  @ApiProperty({ enum: ['free', 'pro', 'premium'] })
  @IsEnum(['free', 'pro', 'premium'])
  plan: 'free' | 'pro' | 'premium';
}
```

**`license-response.dto.ts`**
```typescript
export class LicenseLimitsDto {
  @ApiProperty() maxItems: number;
  @ApiProperty() maxOutfits: number;
  @ApiProperty() aiFeatures: boolean;
  @ApiProperty() importExport: boolean;
  @ApiProperty() analytics: boolean;
}

export class LicenseResponseDto {
  @ApiProperty() plan: string;
  @ApiProperty() status: string;
  @ApiProperty() startedAt: Date;
  @ApiProperty({ nullable: true }) expiresAt: Date | null;
  @ApiProperty({ type: LicenseLimitsDto }) limits: LicenseLimitsDto;
}
```

**`create-plan.dto.ts`**
```typescript
export class CreatePlanDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsString() displayName: string;
  @ApiProperty() @IsNumber() price: number;
  @ApiProperty() @ValidateNested() @Type(() => LicenseLimitsDto) limits: LicenseLimitsDto;
}
```

---

#### Service: `LicenseService`

```typescript
// Key method signatures with preconditions / postconditions

/**
 * Get or auto-create a Free license for the user.
 * Precondition: userId is a valid ObjectId string
 * Postcondition: Returns UserLicense with resolved LicensePlan limits
 *   - If expiresAt < now → effective plan treated as 'free'
 */
async getUserLicense(userId: string): Promise<LicenseResponseDto>

/**
 * Subscribe user to a plan.
 * Precondition: plan ∈ { 'free', 'pro', 'premium' }, plan is active
 * Postcondition: UserLicense.plan = plan, status = 'active', startedAt = now
 *   - expiresAt = now + 30 days (for paid plans), null for free
 */
async subscribe(userId: string, dto: SubscribeDto): Promise<LicenseResponseDto>

/**
 * Check if user can perform a counted action (items / outfits).
 * Precondition: feature ∈ { 'items', 'outfits' }
 * Postcondition:
 *   - Returns true if limit === -1 (unlimited)
 *   - Returns true if currentCount < limit
 *   - Returns false if currentCount >= limit
 *   - Returns true if license is expired (graceful degradation to free limits)
 */
async checkLimit(userId: string, feature: 'items' | 'outfits'): Promise<boolean>

/**
 * Check if user can access a boolean-gated feature.
 * Precondition: feature ∈ { 'aiFeatures', 'importExport', 'analytics' }
 * Postcondition: Returns plan.limits[feature]
 */
async checkFeature(userId: string, feature: 'aiFeatures' | 'importExport' | 'analytics'): Promise<boolean>

/**
 * Admin: Get all user licenses with pagination.
 */
async adminGetAll(page: number, limit: number): Promise<{ data: UserLicense[]; total: number }>

/**
 * Admin: Override a user's plan directly.
 * Postcondition: UserLicense updated, expiresAt set to null (manual override)
 */
async adminSetPlan(userId: string, plan: string): Promise<LicenseResponseDto>
```

---

#### Guard: `FeatureLimitGuard`

```typescript
/**
 * Usage: @UseGuards(JwtAuthGuard, FeatureLimitGuard)
 *        @RequireFeature('items')          // counted limit
 *        @RequireFeature('aiFeatures')     // boolean gate
 *
 * Algorithm:
 *   1. Read feature key from @RequireFeature() metadata
 *   2. Extract userId from request.user
 *   3. If feature ∈ { 'items', 'outfits' } → call checkLimit()
 *   4. Else → call checkFeature()
 *   5. If false → throw ForbiddenException with upgrade message
 *   6. If true → return true (pass through)
 */
```

**`require-feature.decorator.ts`**
```typescript
export const FEATURE_KEY = 'requiredFeature';
export const RequireFeature = (feature: string) => SetMetadata(FEATURE_KEY, feature);
```

---

#### Controllers

**`license.controller.ts`** — `/licenses`

| Method | Endpoint | Guard | Description |
|--------|----------|-------|-------------|
| GET | `/licenses/me` | JwtAuthGuard | Get current user's license + limits |
| POST | `/licenses/subscribe` | JwtAuthGuard | Subscribe / change plan |
| GET | `/licenses/plans` | — | List all active plans (public) |

**`admin-license.controller.ts`** — `/admin/licenses`

| Method | Endpoint | Guard | Description |
|--------|----------|-------|-------------|
| GET | `/admin/licenses` | JwtAuthGuard + RolesGuard(admin) | List all user licenses |
| PATCH | `/admin/licenses/:userId` | JwtAuthGuard + RolesGuard(admin) | Override user plan |
| POST | `/admin/licenses/plans` | JwtAuthGuard + RolesGuard(admin) | Create a new plan |
| PATCH | `/admin/licenses/plans/:id` | JwtAuthGuard + RolesGuard(admin) | Update plan limits |

---

#### Integration: Apply Guard to Existing Controllers

```typescript
// items.controller.ts — POST /items
@Post()
@UseGuards(JwtAuthGuard, FeatureLimitGuard)
@RequireFeature('items')
@ApiOperation({ summary: 'Create item (enforces plan item limit)' })
create(@Body() dto: CreateItemDto, @CurrentUser() user: any) { ... }

// outfits.controller.ts — POST /outfits
@Post()
@UseGuards(JwtAuthGuard, FeatureLimitGuard)
@RequireFeature('outfits')
create(@Body() dto: CreateOutfitDto, @CurrentUser() user: any) { ... }

// recommendation.controller.ts — GET /recommendation/ootd
@Get('ootd')
@UseGuards(JwtAuthGuard, FeatureLimitGuard)
@RequireFeature('aiFeatures')
getOotd(@CurrentUser() user: any, ...) { ... }
```

---

#### User Schema Update

Add `role` field to `user.schema.ts` for admin guard:

```typescript
@Prop({ enum: ['user', 'admin'], default: 'user' })
role: 'user' | 'admin';
```

---

#### Seed Data

Seed the three default `LicensePlan` documents on app startup:

```typescript
const defaultPlans = [
  { name: 'free',    displayName: 'Free',    price: 0,  limits: { maxItems: 50,  maxOutfits: 10, aiFeatures: false, importExport: false, analytics: false } },
  { name: 'pro',     displayName: 'Pro',     price: 9,  limits: { maxItems: 200, maxOutfits: 50, aiFeatures: true,  importExport: true,  analytics: false } },
  { name: 'premium', displayName: 'Premium', price: 19, limits: { maxItems: -1,  maxOutfits: -1, aiFeatures: true,  importExport: true,  analytics: true  } },
];
```

---

### 2.2 Frontend

#### New Pages & Components

```
front-end/src/
├── pages/
│   └── SubscriptionPage.tsx
├── components/subscription/
│   ├── PlanCard.tsx
│   ├── PlanComparisonTable.tsx
│   └── UpgradeModal.tsx
└── store/
    └── useLicenseStore.ts        (Zustand slice)
```

---

#### `useLicenseStore.ts` (Zustand)

```typescript
interface LicenseStore {
  license: LicenseResponseDto | null
  isLoading: boolean
  fetchLicense: () => Promise<void>
  subscribe: (plan: 'free' | 'pro' | 'premium') => Promise<void>
}
```

- `fetchLicense` calls Orval hook `useGetLicensesMe()`
- `subscribe` calls Orval hook `usePostLicensesSubscribe()`
- Store is initialized in `App.tsx` after auth check

---

#### `SubscriptionPage.tsx`

Props: none (reads from `useLicenseStore`)

Sections:
1. Current plan banner — shows active plan, status, expiry
2. `PlanComparisonTable` — renders all plans from `useGetLicensesPlans()`
3. Upgrade CTA button per plan → opens `UpgradeModal`

---

#### `PlanCard.tsx`

```typescript
interface PlanCardProps {
  plan: LicensePlanDto
  isCurrentPlan: boolean
  onUpgrade: (planName: string) => void
}
```

Displays: plan name, price, feature list with ✓/✗ icons, CTA button.

---

#### `UpgradeModal.tsx`

```typescript
interface UpgradeModalProps {
  targetPlan: 'pro' | 'premium'
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}
```

Shows plan summary + confirm button. On confirm → calls `useLicenseStore.subscribe(targetPlan)`.

---

#### Limit Enforcement in UI

When a 403 response is received from `POST /items` or `POST /outfits`:
- Intercept in Orval's axios instance error handler
- If `error.response.status === 403` and message contains "limit" → dispatch `useLicenseStore` to show upgrade prompt
- Redirect user to `/subscription`

---

#### Sidebar Navigation Update

Add "Subscription" menu item to `SidebarMenu` component:
- Icon: `CreditCardIcon` (Heroicons)
- Route: `/subscription`
- Show current plan badge (e.g., "Free", "Pro") next to label

---

## 3. Execution Steps

### Task 1: Backend Implementation

1. Create `back-end/src/license/` module with all files listed above
2. Add `role` field to `user.schema.ts`
3. Create `RolesGuard` in `back-end/src/common/guards/roles.guard.ts`
4. Create `Roles` decorator in `back-end/src/common/decorators/roles.decorator.ts`
5. Register `LicenseModule` in `app.module.ts`
6. Add `FeatureLimitGuard` + `@RequireFeature()` to `ItemsController.create`, `OutfitsController.create`, and `RecommendationController.getOotd`
7. Add plan seed logic in `LicenseModule.onModuleInit` using `LicenseService`
8. Ensure all controllers have `@ApiOperation` and `@ApiResponse` decorators
9. Run backend: `npm run start:dev` → verify `swagger.json` is updated

### Task 2: Frontend Integration

1. Run Orval generation: `npm run gen:api` to pull new license endpoints
2. Create `useLicenseStore.ts` using generated hooks
3. Initialize store in `App.tsx` after auth check: `useLicenseStore.fetchLicense()`
4. Build `PlanCard`, `PlanComparisonTable`, `UpgradeModal` components
5. Build `SubscriptionPage` and register route `/subscription` in router
6. Update `SidebarMenu` to include Subscription link with plan badge
7. Add 403 limit-exceeded handler in axios interceptor → trigger upgrade modal

---

## 4. Validation

### Backend
- `GET /licenses/plans` → returns 3 plans (free, pro, premium) with correct limits
- `GET /licenses/me` (new user, no license) → auto-creates Free license, returns it
- `POST /licenses/subscribe { plan: 'pro' }` → returns updated license with pro limits
- `POST /items` as Free user with 50 existing items → returns `403` with limit message
- `GET /recommendation/ootd` as Free user → returns `403` with feature gate message
- `PATCH /admin/licenses/:userId` as admin → overrides plan successfully
- `PATCH /admin/licenses/:userId` as non-admin → returns `403`

### Frontend
- `/subscription` page loads and displays 3 plan cards with correct pricing
- Current plan is highlighted on the plan comparison table
- Clicking "Upgrade to Pro" opens `UpgradeModal`, confirming calls subscribe API
- After upgrade, plan badge in sidebar updates to "Pro"
- Creating an item as Free user at limit shows upgrade prompt (not a raw error)
- Navigating to OOTD recommendation as Free user redirects to `/subscription`
