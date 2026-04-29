# Feature Specification: Item Management

---

## 1. Objective

Deliver the complete item management feature for the wardrobe app:
- Full CRUD for clothing items with rich metadata (brand, category, style, season, neckline, occasion, sleeve length, shoulder, size), Cloudinary image upload (up to 2 images with background removal), and hierarchical location assignment
- Metadata attribute CRUD via `/items/attributes/:type` endpoints
- Async AI auto-detect via `POST /items/auto-detect` (BullMQ + Gemini) with real-time status updates via WebSocket
- Bulk import/export via Excel
- Frontend: `ItemGrid` + `ItemCard` (with processing skeleton), `AddItemForm` (item info + location selector), `FloatingAddButton`, `ComboBox` for all metadata fields, Zustand `useItemStore`

The backend `ItemsModule` is already implemented. This spec covers Swagger/DTO gaps that block Orval generation and the full frontend integration layer.

---

## 2. Technical Specs

### 2.1 Backend

#### Existing Module: `back-end/src/items/`

```
back-end/src/items/
├── dto/
│   └── items.dto.ts                  ✓ exists — needs ItemResponseDto + AttributesResponseDto added
├── item.schema.ts                    ✓ exists — no changes needed
├── metadata.schema.ts                ✓ exists — no changes needed
├── items.controller.ts               ✓ exists — needs @ApiOperation/@ApiResponse on all endpoints
├── items.service.ts                  ✓ exists — no changes needed
├── items.module.ts                   ✓ exists — no changes needed
├── image-processing.processor.ts    ✓ exists — no changes needed
└── item-description.helper.ts       ✓ exists — no changes needed
```

---

#### Gap 1: Add response DTOs to `items.dto.ts`

Orval requires explicit `@ApiResponse({ type: ... })` decorators pointing to typed DTOs. The controller currently returns raw Mongoose documents. Add the following DTOs:

```typescript
// back-end/src/items/dto/items.dto.ts — append these classes

export class MetadataRefDto {
  @ApiProperty({ example: '64a1b2c3d4e5f6a7b8c9d0e1' })
  _id: string;

  @ApiProperty({ example: 'Zara' })
  name: string;
}

export class ImageAssetDto {
  @ApiProperty({ example: 'wardrobe/abc123' })
  publicId: string;

  @ApiProperty({ example: 'https://res.cloudinary.com/...' })
  imageUrl: string;
}

export class LocationRefDto {
  @ApiProperty({ example: '64a1b2c3d4e5f6a7b8c9d0e1' })
  _id: string;

  @ApiProperty({ example: 'Bedroom Closet' })
  name: string;

  @ApiProperty({ example: 'CABINET' })
  type: string;

  @ApiPropertyOptional({ example: '64a1b2c3d4e5f6a7b8c9d0e0' })
  parent?: string;

  @ApiPropertyOptional({ example: 'root/bedroom' })
  path?: string;
}

export class ItemResponseDto {
  @ApiProperty({ example: '64a1b2c3d4e5f6a7b8c9d0e1' })
  _id: string;

  @ApiProperty({ example: 'Blue Denim Jacket' })
  name: string;

  @ApiPropertyOptional({ example: 'Casual jacket for everyday wear' })
  description?: string;

  @ApiPropertyOptional({ example: 49.99 })
  price?: number;

  @ApiPropertyOptional({ example: 'Blue' })
  color?: string;

  @ApiProperty({ type: [String], example: ['casual', 'summer'] })
  tags: string[];

  @ApiProperty({ type: [String], example: ['https://res.cloudinary.com/...'] })
  images: string[];

  @ApiProperty({ type: [ImageAssetDto] })
  imageAssets: ImageAssetDto[];

  @ApiProperty({ enum: ['processing', 'completed', 'failed'], example: 'completed' })
  status: string;

  @ApiProperty({ example: '64a1b2c3d4e5f6a7b8c9d0e0' })
  owner: string;

  @ApiPropertyOptional({ type: MetadataRefDto })
  brand?: MetadataRefDto;

  @ApiPropertyOptional({ type: MetadataRefDto })
  category?: MetadataRefDto;

  @ApiPropertyOptional({ type: MetadataRefDto })
  neckline?: MetadataRefDto;

  @ApiPropertyOptional({ type: MetadataRefDto })
  occasion?: MetadataRefDto;

  @ApiPropertyOptional({ type: MetadataRefDto })
  seasonCode?: MetadataRefDto;

  @ApiPropertyOptional({ type: MetadataRefDto })
  sleeveLength?: MetadataRefDto;

  @ApiPropertyOptional({ type: MetadataRefDto })
  style?: MetadataRefDto;

  @ApiPropertyOptional({ type: MetadataRefDto })
  shoulder?: MetadataRefDto;

  @ApiPropertyOptional({ type: MetadataRefDto })
  size?: MetadataRefDto;

  @ApiProperty({ type: LocationRefDto })
  location: LocationRefDto;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updatedAt: string;
}

export class AttributesResponseDto {
  @ApiProperty({ type: [MetadataRefDto] }) Brand: MetadataRefDto[];
  @ApiProperty({ type: [MetadataRefDto] }) Category: MetadataRefDto[];
  @ApiProperty({ type: [MetadataRefDto] }) Neckline: MetadataRefDto[];
  @ApiProperty({ type: [MetadataRefDto] }) Occasion: MetadataRefDto[];
  @ApiProperty({ type: [MetadataRefDto] }) SeasonCode: MetadataRefDto[];
  @ApiProperty({ type: [MetadataRefDto] }) SleeveLength: MetadataRefDto[];
  @ApiProperty({ type: [MetadataRefDto] }) Style: MetadataRefDto[];
  @ApiProperty({ type: [MetadataRefDto] }) Size: MetadataRefDto[];
  @ApiProperty({ type: [MetadataRefDto] }) Shoulder: MetadataRefDto[];
}

export class AutoDetectResponseDto {
  @ApiProperty({ example: 'Image queued for processing' })
  message: string;

  @ApiProperty({ example: '64a1b2c3d4e5f6a7b8c9d0e1' })
  itemId: string;
}

export class ImportResultDto {
  @ApiProperty({ example: 10 })
  imported: number;

  @ApiProperty({ example: 2 })
  failed: number;

  @ApiProperty({ type: [String], example: ['Row 3: Name is required'] })
  errors: string[];
}
```

---

#### Gap 2: Add `@ApiOperation` + `@ApiResponse` to all controller endpoints

Every endpoint in `items.controller.ts` must have both decorators for Orval to generate correctly typed hooks. Add the following (endpoints that already have them are noted):

**`POST /items`** — add:
```typescript
@ApiOperation({ summary: 'Create a new wardrobe item with optional image upload' })
@ApiResponse({ status: 201, type: ItemResponseDto })
@ApiResponse({ status: 400, description: 'Validation error' })
@ApiResponse({ status: 401, description: 'Unauthorized' })
```

**`GET /items`** — add:
```typescript
@ApiOperation({ summary: 'Get all items for the authenticated user' })
@ApiResponse({ status: 200, type: [ItemResponseDto] })
```

**`GET /items/:id`** — add:
```typescript
@ApiOperation({ summary: 'Get a single item by ID' })
@ApiResponse({ status: 200, type: ItemResponseDto })
@ApiResponse({ status: 404, description: 'Item not found' })
```

**`PATCH /items/:id`** — add:
```typescript
@ApiOperation({ summary: 'Update an item; appends new images if files provided' })
@ApiResponse({ status: 200, type: ItemResponseDto })
@ApiResponse({ status: 404, description: 'Item not found' })
```

**`DELETE /items/:id`** — add:
```typescript
@ApiOperation({ summary: 'Delete an item by ID' })
@ApiResponse({ status: 200, description: 'Item deleted successfully' })
@ApiResponse({ status: 404, description: 'Item not found' })
```

**`POST /items/auto-detect`** — already has `@ApiOperation` + `@ApiResponse`. Update response type:
```typescript
@ApiResponse({ status: 202, type: AutoDetectResponseDto })
```

**`GET /items/attributes`** — already has `@ApiOperation`. Add:
```typescript
@ApiResponse({ status: 200, type: AttributesResponseDto })
```

**`POST /items/attributes/:type`** — already has `@ApiOperation`. Add:
```typescript
@ApiResponse({ status: 201, type: MetadataRefDto })
```

**`PATCH /items/attributes/:type/:id`** — already has `@ApiOperation`. Add:
```typescript
@ApiResponse({ status: 200, type: MetadataRefDto })
```

**`DELETE /items/attributes/:type/:id`** — already has `@ApiOperation`. Add:
```typescript
@ApiResponse({ status: 200, type: MetadataRefDto })
```

**`GET /items/export-template`** — already has `@ApiOperation`. Add:
```typescript
@ApiResponse({ status: 200, description: 'Excel file download' })
```

**`POST /items/import`** — already has `@ApiOperation`. Add:
```typescript
@ApiResponse({ status: 201, type: ImportResultDto })
```

---

#### Existing Endpoints (no logic changes)

**`POST /items`** — `multipart/form-data`, up to 2 files via `FilesInterceptor('file', 2)`
- Uploads each file to Cloudinary, populates `images[]` + `imageAssets[]`
- Nullifies empty ObjectId fields to prevent CastError
- Generates Gemini embedding + upserts to ChromaDB (non-fatal on failure)
- Returns `201 ItemResponseDto`

**`GET /items`** — returns items filtered by `owner: userId`, populated `category` + `location`

**`GET /items/:id`** — owner-scoped; throws `404` if not found

**`PATCH /items/:id`** — appends new images to existing `images[]`; owner-scoped

**`DELETE /items/:id`** — owner-scoped; throws `404` if `deletedCount === 0`

**`POST /items/auto-detect`** — uploads image, creates item with `status: 'processing'`, enqueues BullMQ job, returns `202`

**`GET /items/attributes`** — returns all 9 metadata types in a single grouped response

**`POST/PATCH/DELETE /items/attributes/:type`** — CRUD on metadata; valid types: `Brand`, `Category`, `Neckline`, `Occasion`, `SeasonCode`, `SleeveLength`, `Style`, `Size`, `Shoulder`

---

### 2.2 Frontend

#### New Files

```
front-end/src/
├── store/
│   └── useItemStore.ts                  Zustand item store
├── pages/
│   ├── ItemListPage.tsx
│   ├── AddItemPage.tsx
│   ├── EditItemPage.tsx
│   └── ItemDetailPage.tsx
├── components/items/
│   ├── ItemGrid.tsx
│   ├── ItemCard.tsx
│   ├── ItemCardSkeleton.tsx
│   ├── FloatingAddButton.tsx
│   ├── AddItemForm.tsx
│   ├── ImageUploader.tsx
│   ├── LocationSelector.tsx
│   └── ComboBox.tsx
```

---

#### `useItemStore.ts` (Zustand)

```typescript
import { create } from 'zustand'
import { ItemResponseDto } from '@/api/generated'   // Orval-generated type

interface ItemState {
  items: ItemResponseDto[]
  selectedItem: ItemResponseDto | null
  isLoading: boolean
  setItems: (items: ItemResponseDto[]) => void
  addItem: (item: ItemResponseDto) => void
  updateItem: (item: ItemResponseDto) => void
  removeItem: (id: string) => void
  setSelectedItem: (item: ItemResponseDto | null) => void
  setLoading: (loading: boolean) => void
}

export const useItemStore = create<ItemState>((set) => ({
  items: [],
  selectedItem: null,
  isLoading: false,
  setItems: (items) => set({ items }),
  addItem: (item) => set((state) => ({ items: [item, ...state.items] })),
  updateItem: (item) => set((state) => ({
    items: state.items.map((i) => (i._id === item._id ? item : i)),
  })),
  removeItem: (id) => set((state) => ({
    items: state.items.filter((i) => i._id !== id),
  })),
  setSelectedItem: (item) => set({ selectedItem: item }),
  setLoading: (loading) => set({ isLoading: loading }),
}))
```

---

#### `ItemListPage.tsx`

State: uses `useItemStore` + Orval `useGetItems()` hook

Behaviour:
- On mount → call `useGetItems()` → `useItemStore.setItems(data)`
- While loading → render `ItemGrid` with `isLoading: true` (shows skeletons)
- Render `<ItemGrid items={items} isLoading={isLoading} />`
- Render `<FloatingAddButton onClick={() => navigate('/items/new')} />`
- Listen to WebSocket `item:updated` event → call `useItemStore.updateItem(item)`

---

#### `ItemGrid.tsx`

Props:
```typescript
interface ItemGridProps {
  items: ItemResponseDto[]
  isLoading: boolean
}
```

Behaviour:
- If `isLoading` → render 8 `<ItemCardSkeleton />` placeholders
- Else → render `items.map(item => <ItemCard key={item._id} item={item} />)`
- Layout: `grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4`

---

#### `ItemCard.tsx`

Props:
```typescript
interface ItemCardProps {
  item: ItemResponseDto
  onFavoriteToggle?: (id: string) => void
}
```

Behaviour:
- If `item.status === 'processing'` → render `<ItemCardSkeleton />` with animated pulse overlay
- If `item.status === 'failed'` → render error state with retry button
- Click card → `navigate('/items/:id')`
- Click heart icon → call `onFavoriteToggle(item._id)` (favorites feature)
- Image: first `imageAssets[0].imageUrl` or placeholder
- Shows: item name, `category?.name`, `location?.name`

---

#### `AddItemForm.tsx`

Props:
```typescript
interface AddItemFormProps {
  mode: 'create' | 'edit'
  initialData?: ItemResponseDto
  onSuccess: () => void
}
```

State (local):
- `formData`: all item fields
- `files: File[]` — selected images (max 2)
- `isSubmitting: boolean`
- `attributes: AttributesResponseDto` — loaded from `useGetItemsAttributes()`

Behaviour:
- On mount → call `useGetItemsAttributes()` to populate all ComboBox options
- Section 1 (Item Information):
  - `name` — text input
  - `description` — textarea
  - `price` — number input
  - `color` — free text input (not a metadata ref)
  - `brand`, `category`, `style`, `seasonCode`, `neckline`, `occasion`, `sleeveLength`, `shoulder`, `size` — each a `<ComboBox>` fed from `attributes`
  - `tags` — comma-separated text input
  - `<ImageUploader files={files} onChange={setFiles} maxFiles={2} />`
- Section 2 (Location):
  - `<LocationSelector value={formData.location} onChange={(id) => setFormData(...)} />`
- On submit (create mode) → build `FormData`, call Orval `usePostItems()` mutation → `useItemStore.addItem(result)` → `onSuccess()`
- On submit (edit mode) → call Orval `usePatchItemsId()` mutation → `useItemStore.updateItem(result)` → `onSuccess()`
- Auto-detect button → call Orval `usePostItemsAutoDetect()` → `useItemStore.addItem({ ...result, status: 'processing' })` → navigate to `/items`

---

#### `ComboBox.tsx`

Props:
```typescript
interface ComboBoxProps {
  label: string
  options: MetadataRefDto[]
  value: string | null
  onChange: (id: string | null) => void
  placeholder?: string
}
```

Behaviour:
- Searchable dropdown; filters options by typed text
- Displays `option.name`; passes `option._id` to `onChange`
- Clearable (null value allowed — all metadata fields are optional)
- Accessible: keyboard navigation, ARIA roles

---

#### `LocationSelector.tsx`

Props:
```typescript
interface LocationSelectorProps {
  value: string | null
  onChange: (locationId: string | null) => void
}
```

Behaviour:
- Calls Orval `useGetLocations()` to fetch full location tree
- Renders cascading dropdowns: top-level locations → children filtered by selected parent
- Each level shows only nodes whose `parent` matches the selected node at the previous level
- `onChange` fires with the deepest selected node's `_id`
- Supports the `NodeType` hierarchy: `LOCATION → HOUSE → ROOM → CABINET → SHELF → BOX`

---

#### `ImageUploader.tsx`

Props:
```typescript
interface ImageUploaderProps {
  files: File[]
  onChange: (files: File[]) => void
  maxFiles?: number   // default: 2
}
```

Behaviour:
- Drag-and-drop zone + click-to-browse
- Preview thumbnails with remove button per file
- Enforces `maxFiles` limit; shows warning if exceeded
- Accepts `image/*` MIME types only

---

#### Router additions

```typescript
// Add to protected routes in App.tsx / router config
<Route path="/items" element={<ProtectedRoute><ItemListPage /></ProtectedRoute>} />
<Route path="/items/new" element={<ProtectedRoute><AddItemPage /></ProtectedRoute>} />
<Route path="/items/:id" element={<ProtectedRoute><ItemDetailPage /></ProtectedRoute>} />
<Route path="/items/:id/edit" element={<ProtectedRoute><EditItemPage /></ProtectedRoute>} />
```

---

#### Orval-generated hooks used

| Hook | Endpoint | Used in |
|------|----------|---------|
| `useGetItems` | `GET /items` | `ItemListPage` |
| `useGetItemsId` | `GET /items/:id` | `ItemDetailPage` |
| `usePostItems` | `POST /items` | `AddItemForm` (create) |
| `usePatchItemsId` | `PATCH /items/:id` | `AddItemForm` (edit) |
| `useDeleteItemsId` | `DELETE /items/:id` | `ItemDetailPage` |
| `useGetItemsAttributes` | `GET /items/attributes` | `AddItemForm` |
| `usePostItemsAttributes` | `POST /items/attributes/:type` | Settings page |
| `usePatchItemsAttributesTypeId` | `PATCH /items/attributes/:type/:id` | Settings page |
| `useDeleteItemsAttributesTypeId` | `DELETE /items/attributes/:type/:id` | Settings page |
| `usePostItemsAutoDetect` | `POST /items/auto-detect` | `AddItemForm` |
| `useGetItemsExportTemplate` | `GET /items/export-template` | Settings page |
| `usePostItemsImport` | `POST /items/import` | Settings page |

---

## 3. Execution Steps

### Task 1: Backend — Add Response DTOs + Swagger Decorators

1. Open `back-end/src/items/dto/items.dto.ts`
   - Append `MetadataRefDto`, `ImageAssetDto`, `LocationRefDto`, `ItemResponseDto`, `AttributesResponseDto`, `AutoDetectResponseDto`, `ImportResultDto` classes (see Gap 1 above)

2. Open `back-end/src/items/items.controller.ts`
   - Add `@ApiOperation` + `@ApiResponse({ type: ItemResponseDto })` to `create()`, `findAll()`, `findOne()`, `update()`, `remove()`
   - Update `autoDetect()` response type to `AutoDetectResponseDto`
   - Update `findAllAttributes()` response type to `AttributesResponseDto`
   - Update `createAttribute()` / `updateAttribute()` / `removeAttribute()` response type to `MetadataRefDto`
   - Update `importItems()` response type to `ImportResultDto`
   - Import new DTOs at the top of the file

3. Run backend: `cd back-end && npm run start:dev`
   - Verify Swagger at `http://localhost:3000/api/docs`
   - Confirm `ItemResponseDto` schema appears with all nested types
   - Confirm all 12 item endpoints are documented with request + response schemas

### Task 2: Orval Generation

4. Run Orval: `npm run gen:api` (from `front-end/` directory)
   - Confirm generated hooks include all hooks listed in the table above
   - Confirm `ItemResponseDto`, `MetadataRefDto`, `AttributesResponseDto` types are generated
   - Confirm `status` field is typed as `'processing' | 'completed' | 'failed'` (not `string`)

### Task 3: Frontend — Store + Core Components

5. Create `front-end/src/store/useItemStore.ts` — Zustand store (see spec above)

6. Create `front-end/src/components/items/ComboBox.tsx`
   - Searchable dropdown with keyboard navigation
   - Props: `label`, `options: MetadataRefDto[]`, `value`, `onChange`, `placeholder`

7. Create `front-end/src/components/items/ImageUploader.tsx`
   - Drag-and-drop + click-to-browse; max 2 files; preview thumbnails

8. Create `front-end/src/components/items/LocationSelector.tsx`
   - Calls `useGetLocations()` Orval hook
   - Cascading dropdowns based on `parent` field

9. Create `front-end/src/components/items/ItemCardSkeleton.tsx`
   - Animated pulse placeholder matching `ItemCard` dimensions

10. Create `front-end/src/components/items/ItemCard.tsx`
    - Handles `status: 'processing'` → renders `ItemCardSkeleton`
    - Handles `status: 'failed'` → error state with retry
    - Click → navigate to `/items/:id`

11. Create `front-end/src/components/items/ItemGrid.tsx`
    - Responsive grid; shows 8 skeletons while `isLoading`

12. Create `front-end/src/components/items/FloatingAddButton.tsx`
    - Fixed bottom-right FAB; `onClick` prop

### Task 4: Frontend — Form + Pages

13. Create `front-end/src/components/items/AddItemForm.tsx`
    - Section 1: item info fields + `ComboBox` for each metadata field + `ImageUploader`
    - Section 2: `LocationSelector`
    - Auto-detect button triggers `usePostItemsAutoDetect()`
    - Submit builds `FormData` and calls `usePostItems()` or `usePatchItemsId()`

14. Create `front-end/src/pages/ItemListPage.tsx`
    - Calls `useGetItems()` on mount → `useItemStore.setItems()`
    - Renders `<ItemGrid>` + `<FloatingAddButton>`
    - WebSocket listener for `item:updated` events

15. Create `front-end/src/pages/AddItemPage.tsx`
    - Renders `<AddItemForm mode="create" onSuccess={() => navigate('/items')} />`

16. Create `front-end/src/pages/EditItemPage.tsx`
    - Calls `useGetItemsId(id)` → passes `initialData` to `<AddItemForm mode="edit" />`

17. Create `front-end/src/pages/ItemDetailPage.tsx`
    - Calls `useGetItemsId(id)` → displays full item details
    - Edit button → navigate to `/items/:id/edit`
    - Delete button → calls `useDeleteItemsId()` → `useItemStore.removeItem()` → navigate `/items`

18. Update `front-end/src/App.tsx` (or router config):
    - Add 4 item routes wrapped in `<ProtectedRoute>`

---

## 4. Validation

### Backend

| Test | Expected Result |
|------|----------------|
| `POST /items` with valid multipart form + 1 image | `201 ItemResponseDto` with `imageAssets[0].imageUrl` populated |
| `POST /items` with 2 images | `201` with `imageAssets` length 2 |
| `POST /items` without `location` field | `400` validation error |
| `GET /items` with valid token | `200 ItemResponseDto[]` — only items owned by authenticated user |
| `GET /items` with another user's token | `200 []` — empty array, not other user's items |
| `GET /items/:id` with valid owner token | `200 ItemResponseDto` with populated `category` + `location` |
| `GET /items/:id` with wrong user token | `404 Item not found` |
| `PATCH /items/:id` with new image | `200` with appended image in `imageAssets` |
| `DELETE /items/:id` | `200`; subsequent `GET /items/:id` returns `404` |
| `POST /items/auto-detect` with image | `202 { message, itemId }`; item in DB has `status: 'processing'` |
| `POST /items/auto-detect` without file | `404 No file provided` |
| `GET /items/attributes` | `200 AttributesResponseDto` with all 9 keys populated |
| `POST /items/attributes/Category` `{ name: 'Blazer' }` | `201 MetadataRefDto` |
| `POST /items/attributes/InvalidType` | `404 Invalid attribute type` |
| `PATCH /items/attributes/Brand/:id` `{ name: 'Updated' }` | `200 MetadataRefDto` with updated name |
| `DELETE /items/attributes/Style/:id` | `200`; attribute no longer in `GET /items/attributes` |
| `GET /items/export-template` | `200` Excel file download |
| `POST /items/import` with valid Excel | `201 { imported: N, failed: 0, errors: [] }` |
| Swagger at `/api/docs` | All 12 item endpoints visible with request + response schemas |

### Frontend

| Scenario | Expected Behaviour |
|----------|--------------------|
| Navigate to `/items` | `useGetItems()` called; items rendered in responsive grid |
| Navigate to `/items` while loading | 8 `ItemCardSkeleton` placeholders shown |
| Item with `status: 'processing'` in list | `ItemCard` renders skeleton/pulse animation |
| Item with `status: 'failed'` in list | `ItemCard` shows error state with retry button |
| Click `FloatingAddButton` | Navigate to `/items/new` |
| Submit `AddItemForm` (create) | `POST /items` called with `FormData`; new item appears at top of grid |
| Submit `AddItemForm` with 2 images | Both images previewed; `imageAssets` length 2 in response |
| Click Auto-Detect in `AddItemForm` | `POST /items/auto-detect` called; navigate to `/items`; processing card visible |
| WebSocket `item:updated` event received | `useItemStore.updateItem()` called; card updates without page reload |
| `ComboBox` for Category | Searchable; selecting option sets `category` field to `_id` |
| `LocationSelector` | Selecting top-level location populates next dropdown with children |
| Click `ItemCard` | Navigate to `/items/:id` |
| Click Delete on `ItemDetailPage` | `DELETE /items/:id` called; navigate to `/items`; item removed from grid |
| Navigate to `/items` without auth | `ProtectedRoute` redirects to `/login` |
| All item API requests | `Authorization: Bearer <token>` header present (via Axios interceptor) |
| TypeScript compilation | Zero `any` types; all props have explicit interfaces; no TS errors |
