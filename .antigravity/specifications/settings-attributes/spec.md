# Feature Specification: Settings — Attributes Management

---

## 1. Objective

Build the `/settings/attributes` sub-page of the wardrobe app's Settings module. Users can manage the dictionary values (Brand, Category, Style, Size, Neckline, Occasion, SeasonCode, SleeveLength, Shoulder) used to classify wardrobe items.

- Backend CRUD is **already implemented** under `/items/attributes/:type` — no new service/controller logic needed
- The only backend task is a **Swagger hardening pass**: ensure `@ApiResponse({ type: ... })` decorators on the attribute endpoints point to typed DTOs so Orval generates correctly-typed hooks
- Frontend delivers: `useAttributeStore` (Zustand), `AttributeManager` page component, and `AttributeCrudTable` shared component — replacing the inline implementation currently in `Settings.tsx` with a properly separated, store-backed architecture

---

## 2. Technical Specs

### 2.1 Backend

#### Module: `back-end/src/items/`

```
back-end/src/items/
├── dto/
│   └── items.dto.ts        ← Add MetadataRefDto + AttributesResponseDto if not present
├── items.controller.ts     ← Add @ApiResponse({ type }) to attribute endpoints
├── items.service.ts        ✓ No changes needed
└── metadata.schema.ts      ✓ No changes needed
```

---

#### Gap 1: Ensure response DTOs exist in `items.dto.ts`

The following DTOs must be present (add if missing — they may already exist from the item-management spec):

```typescript
// back-end/src/items/dto/items.dto.ts

import { ApiProperty } from '@nestjs/swagger';

export class MetadataRefDto {
  @ApiProperty({ example: '64a1b2c3d4e5f6a7b8c9d0e1' })
  _id: string;

  @ApiProperty({ example: 'Zara' })
  name: string;
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
```

---

#### Gap 2: Add `@ApiResponse` to attribute endpoints in `items.controller.ts`

```typescript
// GET /items/attributes
@ApiOperation({ summary: 'Get all item attributes/metadata grouped by type' })
@ApiResponse({ status: 200, type: AttributesResponseDto })

// POST /items/attributes/:type
@ApiOperation({ summary: 'Create a new metadata attribute' })
@ApiResponse({ status: 201, type: MetadataRefDto })
@ApiResponse({ status: 404, description: 'Invalid attribute type' })

// PATCH /items/attributes/:type/:id
@ApiOperation({ summary: 'Update an existing metadata attribute' })
@ApiResponse({ status: 200, type: MetadataRefDto })
@ApiResponse({ status: 404, description: 'Attribute not found' })

// DELETE /items/attributes/:type/:id
@ApiOperation({ summary: 'Delete a metadata attribute' })
@ApiResponse({ status: 200, type: MetadataRefDto })
@ApiResponse({ status: 404, description: 'Attribute not found' })
```

Import `MetadataRefDto` and `AttributesResponseDto` at the top of `items.controller.ts`.

---

#### Existing Endpoints (no logic changes)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/items/attributes` | Returns all 9 types grouped in a single response |
| `POST` | `/items/attributes/:type` | Creates a new entry; valid types: `Brand`, `Category`, `Neckline`, `Occasion`, `SeasonCode`, `SleeveLength`, `Style`, `Size`, `Shoulder` |
| `PATCH` | `/items/attributes/:type/:id` | Updates `name` field of an existing entry |
| `DELETE` | `/items/attributes/:type/:id` | Deletes an entry by ID |

All endpoints are protected by `JwtAuthGuard` via the class-level `@UseGuards` decorator.

---

### 2.2 Frontend

#### New Files

```
front-end/src/
├── store/
│   └── useAttributeStore.ts          ← NEW: Zustand store for attribute data
├── components/settings/
│   └── AttributeCrudTable.tsx        ← NEW: Reusable CRUD table per attribute type
└── pages/
    └── Settings.tsx                  ← MODIFY: Replace inline AttributeManager with store-backed version
```

> Note: `Settings.tsx` already contains working `AttributeManager` and `AttributeCrudTable` implementations. The refactor extracts state into `useAttributeStore` and moves `AttributeCrudTable` to its own file.

---

#### `useAttributeStore.ts`

```typescript
// front-end/src/store/useAttributeStore.ts
import { create } from 'zustand';

interface MetaItem {
  _id: string;
  name: string;
}

interface AttributeState {
  attributes: Record<string, MetaItem[]>;
  isLoading: boolean;
  setAttributes: (data: Record<string, MetaItem[]>) => void;
  setLoading: (loading: boolean) => void;
  addAttributeItem: (type: string, item: MetaItem) => void;
  updateAttributeItem: (type: string, item: MetaItem) => void;
  removeAttributeItem: (type: string, id: string) => void;
}

export const useAttributeStore = create<AttributeState>((set) => ({
  attributes: {},
  isLoading: false,
  setAttributes: (data) => set({ attributes: data }),
  setLoading: (loading) => set({ isLoading: loading }),
  addAttributeItem: (type, item) =>
    set((state) => ({
      attributes: {
        ...state.attributes,
        [type]: [...(state.attributes[type] ?? []), item],
      },
    })),
  updateAttributeItem: (type, item) =>
    set((state) => ({
      attributes: {
        ...state.attributes,
        [type]: (state.attributes[type] ?? []).map((i) =>
          i._id === item._id ? item : i
        ),
      },
    })),
  removeAttributeItem: (type, id) =>
    set((state) => ({
      attributes: {
        ...state.attributes,
        [type]: (state.attributes[type] ?? []).filter((i) => i._id !== id),
      },
    })),
}));
```

---

#### `AttributeCrudTable.tsx`

```typescript
// front-end/src/components/settings/AttributeCrudTable.tsx
import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Tag, Loader2 } from 'lucide-react';
import { getItems } from '../../api/endpoints/items/items';
import { useAttributeStore } from '../../store/useAttributeStore';

interface MetaItem {
  _id: string;
  name: string;
}

interface AttributeCrudTableProps {
  attributeType: string;
}

const { itemsControllerCreateAttribute, itemsControllerUpdateAttribute, itemsControllerRemoveAttribute } = getItems();

export const AttributeCrudTable: React.FC<AttributeCrudTableProps> = ({ attributeType }) => {
  const items = useAttributeStore((s) => s.attributes[attributeType] ?? []);
  const { addAttributeItem, updateAttributeItem, removeAttributeItem } = useAttributeStore();

  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; id?: string } | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openAdd = () => { setInputValue(''); setError(null); setModal({ mode: 'add' }); };
  const openEdit = (id: string, name: string) => { setInputValue(name); setError(null); setModal({ mode: 'edit', id }); };
  const closeModal = () => { setModal(null); setInputValue(''); setError(null); };

  const handleConfirm = async () => {
    if (!inputValue.trim()) return;
    setSaving(true);
    setError(null);
    try {
      if (modal?.mode === 'add') {
        const result = await itemsControllerCreateAttribute(attributeType, { name: inputValue.trim() }) as MetaItem;
        addAttributeItem(attributeType, result);
      } else if (modal?.mode === 'edit' && modal.id) {
        const result = await itemsControllerUpdateAttribute(attributeType, modal.id, { name: inputValue.trim() }) as MetaItem;
        updateAttributeItem(attributeType, result);
      }
      closeModal();
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await itemsControllerRemoveAttribute(attributeType, id);
      removeAttributeItem(attributeType, id);
    } catch {
      // show toast or inline error
    }
  };

  return (
    <div className="pt-4">
      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 flex flex-col gap-4">
            <h3 className="text-lg font-semibold text-gray-800">
              {modal.mode === 'add' ? `Add ${attributeType}` : `Edit ${attributeType}`}
            </h3>
            <input
              autoFocus
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm(); if (e.key === 'Escape') closeModal(); }}
              className="px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm text-gray-800 bg-gray-50"
              placeholder="Enter name..."
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="flex justify-end gap-2">
              <button onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-100 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={saving || !inputValue.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {modal.mode === 'add' ? 'Add' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">{items.length} item{items.length !== 1 ? 's' : ''}</span>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>

      {/* List */}
      <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden max-h-72 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-28 text-gray-400 gap-1">
            <Tag className="w-6 h-6 opacity-30" />
            <p className="text-xs">No {attributeType.toLowerCase()} entries yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {items.map((item) => (
              <li key={item._id} className="flex items-center justify-between px-4 py-2.5 bg-white hover:bg-gray-50 transition-colors group">
                <span className="text-sm text-gray-800">{item.name}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(item._id, item.name)}
                    className="p-1 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item._id, item.name)}
                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
```

---

#### `AttributeManager` update in `Settings.tsx`

Replace the existing inline `AttributeManager` export with the store-backed version:

```typescript
// In front-end/src/pages/Settings.tsx

import { useAttributeStore } from '../store/useAttributeStore';
import { AttributeCrudTable } from '../components/settings/AttributeCrudTable';

const ATTRIBUTE_TYPES = [
  'Category', 'Brand', 'Size', 'Style', 'SeasonCode',
  'Neckline', 'Occasion', 'SleeveLength', 'Shoulder',
] as const;

export const AttributeManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>(ATTRIBUTE_TYPES[0]);
  const { setAttributes, setLoading, isLoading } = useAttributeStore();

  useEffect(() => {
    setLoading(true);
    itemsControllerFindAllAttributes()
      .then((rawRes: unknown) => {
        const res = rawRes as Record<string, { _id: string; name: string }[]>;
        if (res && typeof res === 'object') setAttributes(res);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
        <div className="p-2 bg-primary-50 text-primary-600 rounded-xl">
          <Tag className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Item Attributes</h3>
          <p className="text-xs text-gray-400">Manage classification values per category</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex overflow-x-auto border-b border-gray-100 no-scrollbar px-4 pt-2">
        {ATTRIBUTE_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setActiveTab(type)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors mr-1 ${
              activeTab === type
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="px-6 pb-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <AttributeCrudTable key={activeTab} attributeType={activeTab} />
        )}
      </div>
    </div>
  );
};
```

---

#### Orval-generated hooks used

| Hook function | Endpoint | Used in |
|---|---|---|
| `itemsControllerFindAllAttributes` | `GET /items/attributes` | `AttributeManager` (on mount) |
| `itemsControllerCreateAttribute` | `POST /items/attributes/:type` | `AttributeCrudTable` (add) |
| `itemsControllerUpdateAttribute` | `PATCH /items/attributes/:type/:id` | `AttributeCrudTable` (edit) |
| `itemsControllerRemoveAttribute` | `DELETE /items/attributes/:type/:id` | `AttributeCrudTable` (delete) |

> All four functions are already generated in `front-end/src/api/endpoints/items/items.ts`. After the Swagger hardening pass (Task 1), re-running Orval will add proper return types (`MetadataRefDto`, `AttributesResponseDto`) instead of `void`.

---

#### Router (no changes needed)

The route is already configured in `App.tsx`:

```typescript
<Route path="settings" element={<Settings />}>
  <Route path="locations" element={<LocationManager />} />
  <Route path="attributes" element={<AttributeManager />} />
</Route>
```

---

## 3. Execution Steps

### Task 1: Backend — Swagger Hardening

1. Open `back-end/src/items/dto/items.dto.ts`
   - Verify `MetadataRefDto` and `AttributesResponseDto` classes exist (added by item-management spec)
   - If missing, append both classes as shown in section 2.1 Gap 1

2. Open `back-end/src/items/items.controller.ts`
   - Import `MetadataRefDto` and `AttributesResponseDto` from `./dto/items.dto`
   - Add `@ApiResponse({ status: 200, type: AttributesResponseDto })` to `findAllAttributes()`
   - Add `@ApiResponse({ status: 201, type: MetadataRefDto })` to `createAttribute()`
   - Add `@ApiResponse({ status: 200, type: MetadataRefDto })` to `updateAttribute()`
   - Add `@ApiResponse({ status: 200, type: MetadataRefDto })` to `removeAttribute()`

3. Run backend: `cd back-end && npm run start:dev`
   - Verify Swagger at `http://localhost:3000/api/docs`
   - Confirm `AttributesResponseDto` schema appears with all 9 keys
   - Confirm `MetadataRefDto` schema shows `_id` and `name` fields

### Task 2: Orval Generation

4. Run Orval: `cd front-end && npm run gen:api`
   - Confirm `itemsControllerFindAllAttributes` return type is now `AttributesResponseDto` (not `void`)
   - Confirm `itemsControllerCreateAttribute` / `updateAttribute` / `removeAttribute` return type is `MetadataRefDto`

### Task 3: Frontend — Store

5. Create `front-end/src/store/useAttributeStore.ts`
   - Implement `useAttributeStore` as specified in section 2.2
   - Verify TypeScript compiles with no errors

### Task 4: Frontend — AttributeCrudTable Component

6. Create `front-end/src/components/settings/AttributeCrudTable.tsx`
   - Implement component as specified in section 2.2
   - Reads from `useAttributeStore` — no data props
   - Uses Orval hooks for all mutations
   - Updates store optimistically after each mutation (no re-fetch needed)

### Task 5: Frontend — Update Settings.tsx

7. Open `front-end/src/pages/Settings.tsx`
   - Add import: `import { useAttributeStore } from '../store/useAttributeStore'`
   - Add import: `import { AttributeCrudTable } from '../components/settings/AttributeCrudTable'`
   - Replace the existing `AttributeManager` export with the store-backed version from section 2.2
   - Remove the old inline `AttributeCrudTable` component definition (now in its own file)
   - Keep `LocationManager`, `Settings` shell, and `InlineModal` unchanged

---

## 4. Validation

### Backend

| Test | Expected Result |
|---|---|
| `GET /items/attributes` with valid token | `200` with `AttributesResponseDto` — all 9 keys present, each an array |
| `GET /items/attributes` without token | `401 Unauthorized` |
| `POST /items/attributes/Brand` `{ name: "Zara" }` | `201 MetadataRefDto { _id, name: "Zara" }` |
| `POST /items/attributes/InvalidType` | `404 Invalid attribute type` |
| `POST /items/attributes/Category` `{ name: "" }` | `400` or empty name rejected |
| `PATCH /items/attributes/Brand/:id` `{ name: "Updated" }` | `200 MetadataRefDto` with updated name |
| `PATCH /items/attributes/Brand/nonexistent-id` | `404` or `null` response |
| `DELETE /items/attributes/Style/:id` | `200`; attribute no longer in `GET /items/attributes` |
| Swagger at `/api/docs` | `GET /items/attributes` shows `AttributesResponseDto` schema; `POST/PATCH/DELETE` show `MetadataRefDto` |

### Frontend

| Scenario | Expected Behaviour |
|---|---|
| Navigate to `/settings/attributes` | `itemsControllerFindAllAttributes()` called once; `useAttributeStore.attributes` populated |
| Initial load | Spinner shown while `isLoading: true`; disappears when data arrives |
| Default tab | "Category" tab active; `AttributeCrudTable` renders Category items |
| Switch tab to "Brand" | `AttributeCrudTable` re-renders with Brand items from store (no new API call) |
| Click "Add" button | Modal opens with empty input |
| Type name + press Save | `itemsControllerCreateAttribute("Brand", { name })` called; new row appears immediately via store update |
| Click edit icon on row | Modal opens pre-filled with current name |
| Edit name + press Save | `itemsControllerUpdateAttribute` called; row name updates in place |
| Click delete icon | `window.confirm` shown; on confirm → `itemsControllerRemoveAttribute` called; row removed |
| Cancel delete | No API call made; list unchanged |
| Empty tab | Empty state with Tag icon and "No entries yet" message; Add button still visible |
| Press Enter in modal input | Triggers save (same as clicking Save button) |
| Press Escape in modal | Closes modal without saving |
| TypeScript compilation | Zero `any` types; all props have explicit interfaces; no TS errors |
| Tailwind only | No inline styles, no `.css` imports in new files |
