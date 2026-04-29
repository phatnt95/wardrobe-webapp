# Feature Specification: User Profile Management

---

## 1. Objective

Deliver the complete user profile management feature for the wardrobe app:
- View and update personal info (firstName, lastName, phone, dateOfBirth, bio)
- Upload and change profile avatar via Cloudinary
- Update body measurements (height, weight, chest, waist, hips)
- Manage style preferences (favoriteStyles multi-select, colorPalette hex inputs)
- Change password (local accounts only; requires old password verification)

The backend `UsersModule` is already implemented at `back-end/src/users/`. This spec covers the Swagger/DTO gaps that block Orval type generation and the full frontend integration layer.

---

## 2. Technical Specs

### 2.1 Backend

#### Existing Module: `back-end/src/users/`

```
back-end/src/users/
├── dto/
│   ├── update-profile.dto.ts     ✓ exists — no changes needed
│   └── change-password.dto.ts    ✓ exists — no changes needed
├── user.schema.ts                ✓ exists — no changes needed
├── users.controller.ts           ✓ exists — needs @ApiResponse with typed DTOs on all endpoints
├── users.service.ts              ✓ exists — no changes needed
└── users.module.ts               ✓ exists — no changes needed
```

---

#### Gap 1: Create `UserProfileResponseDto`

Orval requires a typed response DTO for all endpoints. Create a new file:

**`back-end/src/users/dto/user-profile-response.dto.ts`**

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BodyMeasurementsResponseDto {
  @ApiPropertyOptional({ example: 175 }) height?: number;
  @ApiPropertyOptional({ example: 68 }) weight?: number;
  @ApiPropertyOptional({ example: 92 }) chest?: number;
  @ApiPropertyOptional({ example: 76 }) waist?: number;
  @ApiPropertyOptional({ example: 98 }) hips?: number;
}

export class StylePreferencesResponseDto {
  @ApiProperty({ type: [String], example: ['Casual', 'Streetwear'] })
  favoriteStyles: string[];

  @ApiProperty({ type: [String], example: ['#FFFFFF', '#000000'] })
  colorPalette: string[];
}

export class UserProfileResponseDto {
  @ApiProperty({ example: '64a1b2c3d4e5f6a7b8c9d0e1' })
  _id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiPropertyOptional({ example: 'John' })
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  lastName?: string;

  @ApiPropertyOptional({ example: '+84901234567' })
  phone?: string;

  @ApiPropertyOptional({ example: '1995-06-15T00:00:00.000Z' })
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 'Fashion enthusiast 🌟' })
  bio?: string;

  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/...' })
  avatarUrl?: string;

  @ApiPropertyOptional({ type: () => BodyMeasurementsResponseDto })
  measurements?: BodyMeasurementsResponseDto;

  @ApiPropertyOptional({ type: () => StylePreferencesResponseDto })
  stylePreferences?: StylePreferencesResponseDto;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ enum: ['local', 'google', 'facebook'], example: 'local' })
  provider: 'local' | 'google' | 'facebook';

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2024-06-01T00:00:00.000Z' })
  updatedAt: string;
}
```

---

#### Gap 2: Create `AvatarUploadDto`

Required for Swagger `@ApiBody` on `POST /profile/avatar`:

**Append to `back-end/src/users/dto/user-profile-response.dto.ts`**

```typescript
export class AvatarUploadDto {
  @ApiProperty({ type: 'string', format: 'binary', description: 'Avatar image file' })
  file: Express.Multer.File;
}
```

---

#### Gap 3: Add `@ApiResponse` to `UsersController`

Update `back-end/src/users/users.controller.ts` to add `@ApiResponse` decorators on all four endpoints:

```typescript
import { ApiBody, ApiOperation, ApiResponse, ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { UserProfileResponseDto, AvatarUploadDto } from './dto/user-profile-response.dto';

// GET /profile
@ApiOperation({ summary: 'Get current user profile' })
@ApiResponse({ status: 200, type: UserProfileResponseDto })
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiResponse({ status: 404, description: 'User not found' })

// PATCH /profile
@ApiOperation({ summary: 'Update profile info (name, phone, bio, measurements, styles)' })
@ApiResponse({ status: 200, type: UserProfileResponseDto })
@ApiResponse({ status: 400, description: 'Validation error' })
@ApiResponse({ status: 401, description: 'Unauthorized' })

// POST /profile/avatar
@ApiOperation({ summary: 'Upload / change profile avatar' })
@ApiConsumes('multipart/form-data')
@ApiBody({ type: AvatarUploadDto })
@ApiResponse({ status: 200, type: UserProfileResponseDto })
@ApiResponse({ status: 401, description: 'Unauthorized' })

// POST /profile/change-password
@ApiOperation({ summary: 'Change password (requires old password)' })
@ApiResponse({ status: 200, description: 'Password changed successfully' })
@ApiResponse({ status: 401, description: 'Old password is incorrect' })
```

---

#### Existing Endpoints (no logic changes)

**`GET /profile`** — requires `Authorization: Bearer <token>`
- Success: `200 UserProfileResponseDto` (password field excluded)
- Error: `401` if token invalid; `404` if user not found

**`PATCH /profile`** — requires `Authorization: Bearer <token>`
- Body: `UpdateProfileDto` — all fields optional
- Success: `200 UserProfileResponseDto`
- Error: `400` on validation failure; `401` if token invalid

**`POST /profile/avatar`** — requires `Authorization: Bearer <token>`
- Body: `multipart/form-data`, field name: `file`
- Success: `200 UserProfileResponseDto` with updated `avatarUrl`
- Error: `401` if token invalid

**`POST /profile/change-password`** — requires `Authorization: Bearer <token>`
- Body: `ChangePasswordDto` — `{ oldPassword: string, newPassword: string (min 6) }`
- Success: `200 { message: 'Password changed successfully' }`
- Error: `401` if old password wrong

---

### 2.2 Frontend

#### New Files

```
front-end/src/
├── store/
│   └── useProfileStore.ts                  Zustand profile store
├── pages/
│   └── ProfilePage.tsx                     Tab container at /profile
└── components/profile/
    ├── BasicInfoTab.tsx                     Avatar + personal info form
    ├── BodyMeasurementsTab.tsx              Numeric measurement inputs
    ├── StylePreferencesTab.tsx              Tag selector + color inputs
    └── SecurityTab.tsx                     Change password form (local only)
```

---

#### `useProfileStore.ts` (Zustand)

```typescript
import { create } from 'zustand';
import { UserProfileResponseDto } from '@/api/generated';  // Orval-generated type
import { useAuthStore } from '@/store/useAuthStore';

interface ProfileState {
  profile: UserProfileResponseDto | null;
  isLoading: boolean;
  fetchProfile: () => Promise<void>;
  setProfile: (profile: UserProfileResponseDto) => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  isLoading: false,

  fetchProfile: async () => {
    set({ isLoading: true });
    try {
      // useGetProfile Orval hook is called inside components;
      // for imperative use, call the underlying apiClient directly
      const { data } = await apiClient.get<UserProfileResponseDto>('/profile');
      set({ profile: data, isLoading: false });
      useAuthStore.getState().setUser(data);  // keep auth store in sync
    } catch {
      set({ isLoading: false });
    }
  },

  setProfile: (profile) => {
    set({ profile });
    useAuthStore.getState().setUser(profile);  // keep auth store in sync
  },
}));
```

---

#### `ProfilePage.tsx`

State:
- `activeTab: 'basic' | 'measurements' | 'styles' | 'security'`

Behaviour:
- On mount → call `useProfileStore.fetchProfile()`
- Render tab navigation bar with four tabs
- Conditionally render `<SecurityTab>` only when `profile.provider === 'local'`
- Show loading skeleton while `isLoading === true`

```typescript
interface ProfilePageProps {}  // no external props; reads from store

const tabs = [
  { id: 'basic', label: 'Basic Info' },
  { id: 'measurements', label: 'Body Measurements' },
  { id: 'styles', label: 'Style Preferences' },
  // Security tab added conditionally based on provider
];
```

---

#### `BasicInfoTab.tsx`

Props:
```typescript
interface BasicInfoTabProps {
  profile: UserProfileResponseDto;
  onSaved: (updated: UserProfileResponseDto) => void;
}
```

State: `firstName`, `lastName`, `phone`, `dateOfBirth`, `bio` (initialised from `profile`)

Behaviour:
- Render `<ImageUploader>` at top — on file select, call Orval hook `usePostProfileAvatar()` mutation; on success call `onSaved(data)`
- Render `<TextInput>` for each text field (reuse existing design system component)
- On Save → call Orval hook `usePatchProfile()` mutation with `{ firstName, lastName, phone, dateOfBirth, bio }`
- On success → call `onSaved(data)`, show success toast
- On 400 → display field-level validation errors

---

#### `BodyMeasurementsTab.tsx`

Props:
```typescript
interface BodyMeasurementsTabProps {
  profile: UserProfileResponseDto;
  onSaved: (updated: UserProfileResponseDto) => void;
}
```

State: `height`, `weight`, `chest`, `waist`, `hips` (number | undefined, initialised from `profile.measurements`)

Behaviour:
- Render five `<input type="number">` fields with Tailwind styling
- On Save → call `usePatchProfile()` with `{ measurements: { height, weight, chest, waist, hips } }`
- On success → call `onSaved(data)`, show success toast

---

#### `StylePreferencesTab.tsx`

Props:
```typescript
interface StylePreferencesTabProps {
  profile: UserProfileResponseDto;
  onSaved: (updated: UserProfileResponseDto) => void;
}
```

State:
- `favoriteStyles: string[]` — initialised from `profile.stylePreferences.favoriteStyles`
- `colorPalette: string[]` — initialised from `profile.stylePreferences.colorPalette`

Behaviour:
- `favoriteStyles`: render tag-style multi-select with predefined options (`['Casual', 'Streetwear', 'Office', 'Formal', 'Sporty', 'Bohemian', 'Vintage', 'Minimalist']`); clicking a tag toggles it in/out of the array
- `colorPalette`: render a list of hex color inputs; allow add/remove; validate hex format (`/^#[0-9A-Fa-f]{6}$/`)
- On Save → call `usePatchProfile()` with `{ stylePreferences: { favoriteStyles, colorPalette } }`
- On success → call `onSaved(data)`, show success toast

---

#### `SecurityTab.tsx`

Props:
```typescript
interface SecurityTabProps {}  // reads nothing from parent; self-contained
```

State: `oldPassword`, `newPassword`, `confirmPassword`, `error: string | null`, `isSubmitting: boolean`

Behaviour:
- Client-side validation: `newPassword === confirmPassword` before submitting
- On Submit → call Orval hook `usePostProfileChangePassword()` mutation with `{ oldPassword, newPassword }`
- On success → clear all fields, show success toast
- On 401 → set `error = 'Old password is incorrect'`, show inline error under `oldPassword` field
- Never rendered for `provider !== 'local'` users (guard in `ProfilePage`)

---

#### Orval Hooks Used

| Hook | Endpoint | Used In |
|------|----------|---------|
| `useGetProfile` | `GET /profile` | `useProfileStore.fetchProfile` (via apiClient) |
| `usePatchProfile` | `PATCH /profile` | `BasicInfoTab`, `BodyMeasurementsTab`, `StylePreferencesTab` |
| `usePostProfileAvatar` | `POST /profile/avatar` | `BasicInfoTab` (ImageUploader) |
| `usePostProfileChangePassword` | `POST /profile/change-password` | `SecurityTab` |

---

## 3. Execution Steps

### Task 1: Backend — Add Response DTOs & Swagger Decorators

1. Create `back-end/src/users/dto/user-profile-response.dto.ts`
   - Add `BodyMeasurementsResponseDto`, `StylePreferencesResponseDto`, `UserProfileResponseDto`, `AvatarUploadDto` classes with full `@ApiProperty` decorators (see Gap 1 & 2 above)

2. Update `back-end/src/users/users.controller.ts`
   - Import `UserProfileResponseDto`, `AvatarUploadDto` from the new DTO file
   - Add `@ApiResponse({ status: 200, type: UserProfileResponseDto })` to `GET /profile`, `PATCH /profile`, `POST /profile/avatar`
   - Add `@ApiBody({ type: AvatarUploadDto })` to `POST /profile/avatar`
   - Add `@ApiResponse({ status: 200, description: 'Password changed successfully' })` and `@ApiResponse({ status: 401, ... })` to `POST /profile/change-password`
   - Add `@ApiResponse({ status: 401 })` and `@ApiResponse({ status: 404 })` to `GET /profile`

3. Run backend: `cd back-end && npm run start:dev`
   - Verify Swagger at `http://localhost:3000/api/docs` shows all four `/profile` endpoints with correct `200` response schemas referencing `UserProfileResponseDto`

### Task 2: Orval Generation

4. Run Orval: `npm run gen:api` (from front-end directory)
   - Confirm generated hooks include: `useGetProfile`, `usePatchProfile`, `usePostProfileAvatar`, `usePostProfileChangePassword`
   - Confirm `UserProfileResponseDto` type is generated with all fields including `measurements`, `stylePreferences`, `provider`
   - Confirm `BodyMeasurementsResponseDto` and `StylePreferencesResponseDto` nested types are generated

### Task 3: Frontend Implementation

5. Create `front-end/src/store/useProfileStore.ts`
   - Zustand store with `profile`, `isLoading`, `fetchProfile`, `setProfile`
   - `setProfile` must also call `useAuthStore.getState().setUser(profile)` to keep stores in sync

6. Create `front-end/src/components/profile/BasicInfoTab.tsx`
   - Reuse `<ImageUploader>` and `<TextInput>` from existing design system
   - Wire `usePostProfileAvatar` for avatar upload
   - Wire `usePatchProfile` for text field save

7. Create `front-end/src/components/profile/BodyMeasurementsTab.tsx`
   - Five number inputs with Tailwind styling
   - Wire `usePatchProfile` with `{ measurements: {...} }`

8. Create `front-end/src/components/profile/StylePreferencesTab.tsx`
   - Tag toggle UI for `favoriteStyles`
   - Hex color input list for `colorPalette`
   - Wire `usePatchProfile` with `{ stylePreferences: {...} }`

9. Create `front-end/src/components/profile/SecurityTab.tsx`
   - Three password inputs with show/hide toggle
   - Client-side `confirmPassword` match validation
   - Wire `usePostProfileChangePassword`

10. Create `front-end/src/pages/ProfilePage.tsx`
    - Tab navigation bar
    - Call `fetchProfile()` on mount
    - Conditionally include Security tab only when `profile?.provider === 'local'`
    - Pass `onSaved={useProfileStore.setProfile}` to each tab

11. Add `/profile` route to `front-end/src/App.tsx` wrapped in `<ProtectedRoute>`

---

## 4. Validation

### Backend

| Test | Expected Result |
|------|----------------|
| `GET /profile` with valid Bearer token | `200 UserProfileResponseDto` — no `password` field present |
| `GET /profile` without token | `401 Unauthorized` |
| `PATCH /profile` with `{ firstName: 'Jane' }` | `200` — only `firstName` updated, other fields unchanged |
| `PATCH /profile` with invalid `dateOfBirth: 'not-a-date'` | `400` with validation error message |
| `POST /profile/avatar` with valid image file | `200 UserProfileResponseDto` with new `avatarUrl` pointing to Cloudinary |
| `POST /profile/change-password` with correct `oldPassword` | `200 { message: 'Password changed successfully' }` |
| `POST /profile/change-password` with wrong `oldPassword` | `401 { message: 'Old password is incorrect' }` |
| `POST /profile/change-password` with `newPassword` length < 6 | `400` with validation error |
| Swagger at `/api/docs` | All four `/profile` endpoints show `200` response schema with `UserProfileResponseDto` |

### Frontend

| Scenario | Expected Behaviour |
|----------|--------------------|
| Navigate to `/profile` | Profile data loads; all tab fields populated from API response |
| Edit `firstName` + click Save on Basic Info tab | `PATCH /profile` called; success toast shown; store updated |
| Upload new avatar image | `POST /profile/avatar` called; avatar preview updates immediately |
| Update height/weight on Measurements tab | `PATCH /profile` called with `{ measurements: { height, weight } }` |
| Toggle "Casual" style tag | Added to / removed from `favoriteStyles` array |
| Add hex color `#FF5733` to palette | Appended to `colorPalette`; saved on Save click |
| Submit change password with correct old password | Success toast; form cleared |
| Submit change password with wrong old password | Inline error under `oldPassword` field |
| Submit change password with mismatched confirm | Client-side error before API call |
| `provider === 'google'` user on `/profile` | Security tab not visible in tab navigation |
| All profile API requests | `Authorization: Bearer <token>` header present (via Axios interceptor) |
