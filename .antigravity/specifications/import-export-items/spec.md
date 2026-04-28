# Feature Specification: Bulk Import / Export Items

---

## 1. Objective

Add bulk data entry to the wardrobe app's `ItemListPage`:

- "Export Template" button downloads a pre-filled `.xlsx` file users can fill in offline.
- "Import from Excel" button opens a drag-and-drop modal; the uploaded file is parsed server-side and items are bulk-inserted.

Both backend endpoints (`GET /items/export-template`, `POST /items/import`) are already implemented. This spec closes two Swagger/DTO gaps that block Orval generation and delivers the complete frontend integration.

---

## 2. Technical Specs

### 2.1 Backend

#### File: `back-end/src/items/dto/items.dto.ts`

**Action**: Append `ImportResultDto` class (if not already present from item-management spec).

```typescript
export class ImportResultDto {
  @ApiProperty({ example: 10 })
  imported: number;

  @ApiProperty({ example: 2 })
  failed: number;

  @ApiProperty({ type: [String], example: ['Row 3: Name is required'] })
  errors: string[];
}
```

> If `ImportResultDto` was already added by the item-management spec, skip this step.

---

#### File: `back-end/src/items/items.controller.ts`

**Gap 1**: `GET /items/export-template` is missing `@ApiResponse`.

Add to `exportTemplate()`:
```typescript
@ApiResponse({ status: 200, description: 'Excel binary stream download' })
```

**Gap 2**: `POST /items/import` is missing `@ApiResponse` with typed DTO.

Add to `importItems()`:
```typescript
@ApiResponse({ status: 201, type: ImportResultDto })
```

Also add `ImportResultDto` to the import line at the top of the controller.

**No logic changes** to `ItemsService` — `exportTemplate()` and `importData()` are already correct.

---

#### Existing endpoint behaviour (reference only)

**`GET /items/export-template`**
- Auth: `JwtAuthGuard`
- Returns: `Buffer` → `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Columns: Name*, Description, Price, Brand, Category, Color
- Sample rows: 2 pre-filled rows

**`POST /items/import`**
- Auth: `JwtAuthGuard`
- Consumes: `multipart/form-data` field `file`
- Parses rows via ExcelJS; skips header row (row 1)
- For each row: validates `name` is non-empty; findOrCreate `Brand` + `Category` by name (case-insensitive)
- Bulk inserts items with `owner: userId`
- Returns: `ImportResultDto { imported, failed, errors[] }`

---

### 2.2 Frontend

#### New Files

```
front-end/src/
├── components/items/
│   └── ImportModal.tsx          drag-and-drop import modal
└── pages/
    └── ItemListPage.tsx         add toolbar buttons (modify existing or create)
```

---

#### `ImportModal.tsx`

Props:
```typescript
interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}
```

State (local):
```typescript
const [file, setFile] = useState<File | null>(null);
const [isDragging, setIsDragging] = useState(false);
const [errors, setErrors] = useState<string[]>([]);
const fileInputRef = useRef<HTMLInputElement>(null);
```

Orval hook:
```typescript
const { mutate: importItems, isPending } = usePostItemsImport();
```

Behaviour:
- Drag-and-drop zone: `onDragOver` / `onDrop` handlers; visual highlight when `isDragging`
- Click zone → `fileInputRef.current?.click()`
- `<input type="file" ref={fileInputRef} accept=".xlsx,.xls,.csv" className="hidden" />`
- On file selected: set `file` state; show filename preview
- Submit button calls `importItems({ data: { file } })`:
  - While pending: show spinner overlay on button (reuse existing `Button` component loading prop)
  - On success (`result.failed === 0`): close modal, call `onImportSuccess()`, show Toast "X items imported successfully"
  - On partial success (`result.failed > 0`): keep modal open, render `result.errors` as scrollable list
  - On network/server error: show Toast "Import failed. Please try again."
- After every attempt (success or error): reset file input → `if (fileInputRef.current) fileInputRef.current.value = ''`; set `file` to `null`

Layout (Tailwind):
```
Modal container: max-w-lg w-full p-6
Drop zone: border-2 border-dashed border-gray-300 rounded-lg p-8 text-center
  hover:border-primary-500 transition-colors
  isDragging: border-primary-500 bg-primary-50
Error list: mt-4 max-h-48 overflow-y-auto text-sm text-red-600 space-y-1
Footer: flex justify-end gap-3 mt-6
```

Mobile: modal is full-width on `sm` breakpoint; drop zone text hidden on `xs`, icon always visible.

---

#### `ItemListPage.tsx` — toolbar additions

Locate the existing toolbar / action area (right-aligned, next to "Add New Item" button).

Add two buttons:

**Export Template button**:
```typescript
const handleExportTemplate = async () => {
  const response = await fetch('/api/items/export-template', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'wardrobe-import-template.xlsx';
  a.click();
  URL.revokeObjectURL(url);
};
```

> Note: Orval generates `useGetItemsExportTemplate` but it returns JSON by default. Use a direct fetch with blob response type for the binary download, or configure Orval's custom axios instance to handle `responseType: 'blob'` for this endpoint.

**Import button**:
```typescript
const [isImportOpen, setIsImportOpen] = useState(false);

const handleImportSuccess = () => {
  refetchItems(); // call the useGetItems() refetch from Orval hook
};
```

Button markup (Tailwind, mobile-responsive):
```tsx
{/* Export Template */}
<button
  onClick={handleExportTemplate}
  className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
>
  <FiDownload className="w-4 h-4 flex-shrink-0" />
  <span className="hidden sm:inline">Export Template</span>
</button>

{/* Import from Excel */}
<button
  onClick={() => setIsImportOpen(true)}
  className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
>
  <FiUpload className="w-4 h-4 flex-shrink-0" />
  <span className="hidden sm:inline">Import from Excel</span>
</button>

<ImportModal
  isOpen={isImportOpen}
  onClose={() => setIsImportOpen(false)}
  onImportSuccess={handleImportSuccess}
/>
```

---

#### Orval hooks used

| Hook | Endpoint | Used in |
|------|----------|---------|
| `usePostItemsImport` | `POST /items/import` | `ImportModal` |
| `useGetItems` (refetch) | `GET /items` | `ItemListPage` after import |

> `GET /items/export-template` uses a direct fetch blob call (see note above).

---

## 3. Execution Steps

### Task 1: Backend — Close Swagger Gaps

1. Open `back-end/src/items/dto/items.dto.ts`
   - Append `ImportResultDto` class if not already present

2. Open `back-end/src/items/items.controller.ts`
   - Add `@ApiResponse({ status: 200, description: 'Excel binary stream download' })` to `exportTemplate()`
   - Add `@ApiResponse({ status: 201, type: ImportResultDto })` to `importItems()`
   - Add `ImportResultDto` to the DTO import at the top of the file

3. Run backend: `cd back-end && npm run start:dev`
   - Verify Swagger at `http://localhost:3000/api/docs`
   - Confirm `GET /items/export-template` shows `200` response
   - Confirm `POST /items/import` shows `201 ImportResultDto` schema with `imported`, `failed`, `errors` fields

### Task 2: Orval Generation

4. Run Orval: `npm run gen:api` (from `front-end/` directory)
   - Confirm `usePostItemsImport` hook is generated
   - Confirm `ImportResultDto` type is generated with correct field types

### Task 3: Frontend — ImportModal

5. Create `front-end/src/components/items/ImportModal.tsx`
   - Drag-and-drop zone with `isDragging` visual state
   - Hidden `<input type="file" accept=".xlsx,.xls,.csv" />`
   - Loading spinner on submit button while `isPending`
   - Success path: close modal + toast
   - Error path: render `errors[]` list inside modal
   - Always reset file input after attempt

### Task 4: Frontend — ItemListPage Toolbar

6. Update `front-end/src/pages/ItemListPage.tsx`
   - Add `isImportOpen` state
   - Add Export Template button with `handleExportTemplate` (blob fetch)
   - Add Import button that sets `isImportOpen = true`
   - Render `<ImportModal>` with `onImportSuccess` → `refetchItems()`
   - Both buttons: icon always visible, label hidden on mobile (`hidden sm:inline`)

---

## 4. Validation

### Backend

| Test | Expected Result |
|------|----------------|
| `GET /items/export-template` with valid JWT | `200`, `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, non-empty body |
| `GET /items/export-template` without JWT | `401 Unauthorized` |
| `POST /items/import` with valid 2-row template | `{ imported: 2, failed: 0, errors: [] }` |
| `POST /items/import` with a row missing Name | `{ imported: N-1, failed: 1, errors: ['Row N: Name is required'] }` |
| `POST /items/import` without file | `404 No file provided` |
| `POST /items/import` without JWT | `401 Unauthorized` |
| Swagger `/api/docs` | `GET /items/export-template` shows `200` response; `POST /items/import` shows `201 ImportResultDto` |

### Frontend

| Scenario | Expected Behaviour |
|----------|--------------------|
| Click "Export Template" | Browser downloads `wardrobe-import-template.xlsx` |
| Click "Import from Excel" | `ImportModal` opens |
| Drag `.xlsx` file onto drop zone | Zone highlights; filename preview shown |
| Click drop zone | File picker opens filtered to `.xlsx/.xls/.csv` |
| Submit valid file | Spinner shown; on success modal closes + toast "X items imported successfully" |
| Submit file with row errors | Modal stays open; per-row error list rendered |
| Submit then re-submit same filename | File input reset; `onChange` fires correctly |
| After successful import | `useGetItems` refetch called; new items appear in grid |
| Mobile viewport (`< sm`) | Button labels hidden; icons only visible |
| TypeScript compilation | Zero `any` types; all props typed; no TS errors |
