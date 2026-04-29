# Feature Specification: Outfit Builder

---

## 1. Objective

Build the Outfit Builder feature across three views: an Outfit List page, a Fitting Room builder (create/edit), and a read-only Outfit Detail page. The backend `OutfitsModule` is already fully implemented (schema, service, CRUD) but every controller endpoint is missing `@ApiOperation`, `@ApiResponse`, and an `OutfitResponseDto` — all required for Orval to generate typed frontend hooks. The frontend needs `useOutfitStore` (Zustand), three pages, and supporting components using `react-rnd` for the builder canvas and `@dnd-kit/core` for the item selector.

---

## 2. Technical Specs

### 2.1 Backend

#### Existing Module: `back-end/src/outfits/`

```
back-end/src/outfits/
├── dto/
│   ├── create-outfit.dto.ts    ✓ exists — OutfitItemDto + CreateOutfitDto complete
│   └── update-outfit.dto.ts    ✓ exists — PartialType(CreateOutfitDto)
├── outfit.schema.ts            ✓ exists — Outfit + OutfitItem + Season enum complete
├── outfits.controller.ts       ✓ exists — missing @ApiOperation + @ApiResponse on ALL endpoints
├── outfits.service.ts          ✓ exists — no changes needed
└── outfits.module.ts           ✓ exists — no changes needed
```

---

#### Gap 1: Add `OutfitItemResponseDto` + `OutfitResponseDto` to `create-outfit.dto.ts`

Add to `back-end/src/outfits/dto/create-outfit.dto.ts`:

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Season } from '../outfit.schema';

export class OutfitItemResponseDto {
  @ApiProperty({ description: 'Populated item object' })
  item: Record<string, unknown>;  // typed as ItemResponseDto after Orval gen

  @ApiProperty() x: number;
  @ApiProperty() y: number;
  @ApiProperty() width: number;
  @ApiProperty() height: number;
  @ApiProperty() zIndex: number;
}

export class OutfitResponseDto {
  @ApiProperty({ example: '60d0fe4f5311236168a109ca' })
  _id: string;

  @ApiProperty({ example: 'Summer Vacation Walk' })
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty({ type: [OutfitItemResponseDto] })
  items: OutfitItemResponseDto[];

  @ApiProperty({ type: [String], example: ['casual', 'summer'] })
  tags: string[];

  @ApiProperty({ enum: Season, example: Season.Summer })
  season: Season;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
```


---

#### Gap 2: Add `@ApiOperation` + `@ApiResponse` to all controller endpoints

Replace `back-end/src/outfits/outfits.controller.ts` with:

```typescript
import {
  Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpCode,
} from '@nestjs/common';
import {
  ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam,
} from '@nestjs/swagger';
import { OutfitsService } from './outfits.service';
import { CreateOutfitDto } from './dto/create-outfit.dto';
import { UpdateOutfitDto } from './dto/update-outfit.dto';
import { OutfitResponseDto } from './dto/create-outfit.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('outfits')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('outfits')
export class OutfitsController {
  constructor(private readonly outfitsService: OutfitsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new outfit' })
  @ApiResponse({ status: 201, type: OutfitResponseDto })
  create(@Body() createOutfitDto: CreateOutfitDto, @CurrentUser() user: any) {
    return this.outfitsService.create(createOutfitDto, user._id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all outfits for the current user (items populated)' })
  @ApiResponse({ status: 200, type: [OutfitResponseDto] })
  findAll(@CurrentUser() user: any) {
    return this.outfitsService.findAll(user._id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single outfit by ID (items populated)' })
  @ApiParam({ name: 'id', description: 'Outfit _id' })
  @ApiResponse({ status: 200, type: OutfitResponseDto })
  @ApiResponse({ status: 404, description: 'Outfit not found' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.outfitsService.findOne(id, user._id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an outfit' })
  @ApiParam({ name: 'id', description: 'Outfit _id' })
  @ApiResponse({ status: 200, type: OutfitResponseDto })
  @ApiResponse({ status: 404, description: 'Outfit not found' })
  update(
    @Param('id') id: string,
    @Body() updateOutfitDto: UpdateOutfitDto,
    @CurrentUser() user: any,
  ) {
    return this.outfitsService.update(id, updateOutfitDto, user._id);
  }

  @Delete(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Delete an outfit' })
  @ApiParam({ name: 'id', description: 'Outfit _id' })
  @ApiResponse({ status: 200, description: 'Outfit deleted' })
  @ApiResponse({ status: 404, description: 'Outfit not found' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.outfitsService.remove(id, user._id);
  }
}
```

---

#### Endpoints Summary

| Method | Endpoint | Body / Param | Success | Error |
|--------|----------|--------------|---------|-------|
| POST | `/outfits` | `CreateOutfitDto` | `201 OutfitResponseDto` | 401 |
| GET | `/outfits` | — | `200 OutfitResponseDto[]` | 401 |
| GET | `/outfits/:id` | `id` = outfit `_id` | `200 OutfitResponseDto` | 404, 401 |
| PATCH | `/outfits/:id` | `UpdateOutfitDto` | `200 OutfitResponseDto` | 404, 401 |
| DELETE | `/outfits/:id` | `id` = outfit `_id` | `200` | 404, 401 |

All endpoints require `Authorization: Bearer <token>`. All are owner-scoped via `owner: userId`.


---

### 2.2 Frontend

#### New Files

```
front-end/src/
├── store/
│   └── useOutfitStore.ts                  Zustand outfit + canvas state
├── pages/
│   ├── OutfitListPage.tsx                 /outfits — grid of OutfitCard
│   ├── FittingRoomPage.tsx                /outfits/new + /outfits/:id/edit
│   └── OutfitDetailPage.tsx               /outfits/:id — read-only view
└── components/outfits/
    ├── OutfitCard.tsx                     Collage thumbnail card
    ├── CollageGrid.tsx                    Dynamic 1/2/3/4+ image grid
    ├── FittingRoomCanvas.tsx              react-rnd draggable/resizable canvas
    ├── ItemSelectorPanel.tsx              dnd-kit item source + category filter
    ├── ReadOnlyCanvas.tsx                 Absolute-positioned img reconstruction
    ├── ItemBreakdownList.tsx              Item list with thumbnail + metadata
    └── OutfitMetaForm.tsx                 Name / season / tags form fields
```

---

#### `useOutfitStore.ts` (Zustand)

```typescript
import { create } from 'zustand';
import { OutfitResponseDto } from '@/api/generated';  // Orval-generated type

interface CanvasItemPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}

// item is the full populated object from OutfitResponseDto.items[n].item
interface CanvasItem extends CanvasItemPosition {
  item: OutfitResponseDto['items'][number]['item'];
}

interface OutfitState {
  outfits: OutfitResponseDto[];
  selectedOutfit: OutfitResponseDto | null;
  canvasItems: CanvasItem[];
  isLoading: boolean;

  setOutfits: (outfits: OutfitResponseDto[]) => void;
  addOutfit: (outfit: OutfitResponseDto) => void;
  updateOutfit: (outfit: OutfitResponseDto) => void;
  removeOutfit: (id: string) => void;
  setSelectedOutfit: (outfit: OutfitResponseDto | null) => void;

  addCanvasItem: (item: CanvasItem) => void;
  updateCanvasItem: (itemId: string, patch: Partial<CanvasItemPosition>) => void;
  removeCanvasItem: (itemId: string) => void;
  setCanvasItems: (items: CanvasItem[]) => void;
  clearCanvas: () => void;
}

export const useOutfitStore = create<OutfitState>((set) => ({
  outfits: [],
  selectedOutfit: null,
  canvasItems: [],
  isLoading: false,

  setOutfits: (outfits) => set({ outfits }),
  addOutfit: (outfit) => set((s) => ({ outfits: [...s.outfits, outfit] })),
  updateOutfit: (outfit) =>
    set((s) => ({ outfits: s.outfits.map((o) => (o._id === outfit._id ? outfit : o)) })),
  removeOutfit: (id) =>
    set((s) => ({ outfits: s.outfits.filter((o) => o._id !== id) })),
  setSelectedOutfit: (outfit) => set({ selectedOutfit: outfit }),

  addCanvasItem: (item) =>
    set((s) => ({ canvasItems: [...s.canvasItems, item] })),
  updateCanvasItem: (itemId, patch) =>
    set((s) => ({
      canvasItems: s.canvasItems.map((c) =>
        c.item._id === itemId ? { ...c, ...patch } : c,
      ),
    })),
  removeCanvasItem: (itemId) =>
    set((s) => ({ canvasItems: s.canvasItems.filter((c) => c.item._id !== itemId) })),
  setCanvasItems: (items) => set({ canvasItems: items }),
  clearCanvas: () => set({ canvasItems: [] }),
}));
```


---

#### `OutfitListPage.tsx`

```typescript
// Route: /outfits
// Uses Orval hook useGetOutfits() — auto-generated after Step 3

export function OutfitListPage() {
  const { data, isLoading } = useGetOutfits();  // Orval hook
  const { setOutfits } = useOutfitStore();

  useEffect(() => {
    if (data) setOutfits(data);
  }, [data]);

  if (isLoading) return <LoadingSpinner />;
  if (!data?.length) return <EmptyState message="No outfits yet. Create your first one!" />;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">My Outfits</h1>
        <Link to="/outfits/new" className="btn-primary">+ New Outfit</Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {data.map((outfit) => (
          <OutfitCard key={outfit._id} outfit={outfit} />
        ))}
      </div>
    </div>
  );
}
```

---

#### `OutfitCard.tsx`

```typescript
interface OutfitCardProps {
  outfit: OutfitResponseDto;
}

export function OutfitCard({ outfit }: OutfitCardProps) {
  return (
    <Link to={`/outfits/${outfit._id}`} className="rounded-2xl overflow-hidden shadow-sm bg-white hover:shadow-md transition-shadow">
      {/* Image collage — dynamic grid based on item count */}
      <CollageGrid items={outfit.items} />

      {/* Card body */}
      <div className="p-3 space-y-1">
        <p className="font-semibold text-gray-900 truncate">{outfit.name}</p>

        {/* Season badge */}
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs">
          <CalendarIcon className="w-3 h-3" />
          {outfit.season}
        </span>

        {/* Item count */}
        <p className="text-xs text-gray-400">
          {outfit.items.length} {outfit.items.length === 1 ? 'piece' : 'pieces'}
        </p>
      </div>
    </Link>
  );
}
```

---

#### `CollageGrid.tsx`

```typescript
interface CollageGridProps {
  items: OutfitResponseDto['items'];
}

// Renders dynamic image grid based on item count:
// 1 item  → full width/height single image
// 2 items → 2-column grid
// 3 items → 1 large left (row-span-2) + 2 stacked right
// 4+ items → 2x2 grid (first 4 only)
export function CollageGrid({ items }: CollageGridProps) {
  const count = items.length;
  const display = items.slice(0, 4);

  const gridClass =
    count === 1 ? 'grid-cols-1' :
    count === 2 ? 'grid-cols-2' :
    'grid-cols-2';  // 3 and 4+ both use 2-col; row-span handled per item

  return (
    <div className={`grid ${gridClass} h-40 gap-0.5 bg-gray-100`}>
      {display.map((ci, i) => (
        <div
          key={i}
          className={count === 3 && i === 0 ? 'row-span-2' : ''}
        >
          <img
            src={ci.item.imageAssets?.[0]?.imageUrl ?? ''}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      ))}
    </div>
  );
}
```


---

#### `FittingRoomPage.tsx`

```typescript
// Routes: /outfits/new (create) and /outfits/:id/edit (edit)
// Split view: left = canvas, right = item selector

export function FittingRoomPage() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);

  const { data: existingOutfit } = useGetOutfitsId(id!, {
    query: { enabled: isEdit },
  });  // Orval hook

  const { mutate: createOutfit } = usePostOutfits();   // Orval hook
  const { mutate: updateOutfit } = usePatchOutfitsId(); // Orval hook

  const { canvasItems, setCanvasItems, clearCanvas, addCanvasItem } = useOutfitStore();
  const [meta, setMeta] = useState({ name: '', season: 'All', tags: [] });

  // Load existing outfit into canvas on edit
  useEffect(() => {
    if (existingOutfit) {
      setCanvasItems(
        existingOutfit.items.map((ci) => ({
          item: ci.item,
          x: ci.x, y: ci.y, width: ci.width, height: ci.height, zIndex: ci.zIndex,
        })),
      );
      setMeta({ name: existingOutfit.name, season: existingOutfit.season, tags: existingOutfit.tags });
    }
    return () => clearCanvas();
  }, [existingOutfit]);

  const handleSave = () => {
    if (!meta.name || canvasItems.length === 0) return;
    const payload = {
      ...meta,
      items: canvasItems.map((c) => ({
        item: c.item._id,
        x: c.x, y: c.y, width: c.width, height: c.height, zIndex: c.zIndex,
      })),
    };
    if (isEdit) {
      updateOutfit({ id: id!, data: payload }, { onSuccess: () => navigate('/outfits') });
    } else {
      createOutfit({ data: payload }, { onSuccess: () => navigate('/outfits') });
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen">
      {/* Left: Canvas */}
      <div className="flex-1 relative bg-gray-50 overflow-hidden">
        <FittingRoomCanvas />
      </div>

      {/* Right: Item selector + meta form */}
      <div className="w-full md:w-80 flex flex-col border-l border-gray-200 bg-white">
        <OutfitMetaForm value={meta} onChange={setMeta} />
        <ItemSelectorPanel onAddItem={addCanvasItem} />
        <div className="p-4 border-t">
          <button onClick={handleSave} className="w-full btn-primary">
            {isEdit ? 'Update Outfit' : 'Save Outfit'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

#### `FittingRoomCanvas.tsx`

```typescript
// Uses react-rnd for each canvas item
// Model image is the fixed background layer (z-index: 10)
// Items are layered above model using their saved zIndex

const MODEL_IMAGE_URL = '/assets/model-placeholder.png'; // static asset

export function FittingRoomCanvas() {
  const { canvasItems, updateCanvasItem, removeCanvasItem } = useOutfitStore();

  return (
    <div className="relative w-full h-full">
      {/* Base model image */}
      <img
        src={MODEL_IMAGE_URL}
        alt="Model"
        className="absolute inset-0 w-full h-full object-contain"
        style={{ zIndex: 10 }}
      />

      {/* Draggable/resizable clothing items */}
      {canvasItems.map((ci) => (
        <Rnd
          key={ci.item._id}
          default={{ x: ci.x, y: ci.y, width: ci.width, height: ci.height }}
          style={{ zIndex: ci.zIndex }}
          onDragStop={(_e, d) =>
            updateCanvasItem(ci.item._id, { x: d.x, y: d.y })
          }
          onResizeStop={(_e, _dir, ref, _delta, pos) =>
            updateCanvasItem(ci.item._id, {
              width: parseInt(ref.style.width),
              height: parseInt(ref.style.height),
              x: pos.x,
              y: pos.y,
            })
          }
        >
          <div className="relative group w-full h-full">
            <img
              src={ci.item.imageAssets?.[0]?.imageUrl ?? ''}
              alt={ci.item.name}
              className="w-full h-full object-contain"
              draggable={false}
            />
            {/* Remove button on hover */}
            <button
              onClick={() => removeCanvasItem(ci.item._id)}
              className="absolute top-0 right-0 hidden group-hover:flex items-center justify-center w-5 h-5 bg-red-500 text-white rounded-full text-xs"
              aria-label="Remove item"
            >
              ×
            </button>
          </div>
        </Rnd>
      ))}
    </div>
  );
}
```


---

#### `ItemSelectorPanel.tsx`

```typescript
// Uses @dnd-kit/core with MouseSensor + TouchSensor for mobile support
// Category filter tabs + item grid; clicking an item adds it to canvas

interface ItemSelectorPanelProps {
  onAddItem: (item: CanvasItem) => void;
}

export function ItemSelectorPanel({ onAddItem }: ItemSelectorPanelProps) {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const { data: items } = useGetItems();  // Orval hook — existing items endpoint

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  );

  const filtered = activeCategory === 'All'
    ? items ?? []
    : (items ?? []).filter((item) => item.category?.name === activeCategory);

  const handleItemClick = (item: ItemResponseDto) => {
    onAddItem({
      item,
      x: 100, y: 100,
      width: 150, height: 200,
      zIndex: 20,  // default; user adjusts via drag
    });
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Category filter tabs */}
      <div className="flex gap-2 p-3 overflow-x-auto border-b">
        {['All', 'Top', 'Bottom', 'Shoes', 'Accessories'].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
              activeCategory === cat
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Item grid */}
      <DndContext sensors={sensors}>
        <div className="grid grid-cols-2 gap-2 p-3">
          {filtered.map((item) => (
            <button
              key={item._id}
              onClick={() => handleItemClick(item)}
              className="rounded-xl overflow-hidden bg-gray-50 aspect-square hover:ring-2 hover:ring-gray-900 transition-all"
            >
              <img
                src={item.imageAssets?.[0]?.imageUrl ?? ''}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      </DndContext>
    </div>
  );
}
```

---

#### `OutfitDetailPage.tsx`

```typescript
// Route: /outfits/:id
// Read-only canvas reconstruction + item breakdown + edit/delete actions

export function OutfitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: outfit, isLoading } = useGetOutfitsId(id!);  // Orval hook
  const { mutate: deleteOutfit } = useDeleteOutfitsId();      // Orval hook

  const handleDelete = () => {
    deleteOutfit({ id: id! }, { onSuccess: () => navigate('/outfits') });
  };

  if (isLoading) return <LoadingSpinner />;
  if (!outfit) return <EmptyState message="Outfit not found" />;

  const totalValue = outfit.items.reduce((sum, ci) => sum + (ci.item.price ?? 0), 0);

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Left: Read-only canvas */}
      <div className="flex-1 relative bg-gray-50 min-h-64">
        <ReadOnlyCanvas items={outfit.items} />
      </div>

      {/* Right: Metadata + item breakdown */}
      <div className="w-full md:w-80 p-4 space-y-4 border-l border-gray-200 bg-white overflow-y-auto">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{outfit.name}</h1>
          <p className="text-sm text-gray-400">{new Date(outfit.createdAt).toLocaleDateString()}</p>
        </div>

        <div className="flex gap-2">
          <Link to={`/outfits/${id}/edit`} className="flex-1 btn-secondary text-center">Edit</Link>
          <button onClick={handleDelete} className="flex-1 btn-danger">Delete</button>
        </div>

        <ItemBreakdownList items={outfit.items} totalValue={totalValue} />
      </div>
    </div>
  );
}
```

---

#### `ReadOnlyCanvas.tsx`

```typescript
// Reconstructs outfit using absolute-positioned <img> — no react-rnd overhead

interface ReadOnlyCanvasProps {
  items: OutfitResponseDto['items'];
}

const MODEL_IMAGE_URL = '/assets/model-placeholder.png';

export function ReadOnlyCanvas({ items }: ReadOnlyCanvasProps) {
  return (
    <div className="relative w-full h-full">
      <img
        src={MODEL_IMAGE_URL}
        alt="Model"
        className="absolute inset-0 w-full h-full object-contain"
        style={{ zIndex: 10 }}
      />
      {items.map((ci, i) => (
        <img
          key={i}
          src={ci.item.imageAssets?.[0]?.imageUrl ?? ''}
          alt={ci.item.name}
          style={{
            position: 'absolute',
            left: ci.x,
            top: ci.y,
            width: ci.width,
            height: ci.height,
            zIndex: ci.zIndex,
            objectFit: 'contain',
          }}
        />
      ))}
    </div>
  );
}
```

---

#### `ItemBreakdownList.tsx`

```typescript
interface ItemBreakdownListProps {
  items: OutfitResponseDto['items'];
  totalValue: number;
}

export function ItemBreakdownList({ items, totalValue }: ItemBreakdownListProps) {
  return (
    <div className="space-y-3">
      <h2 className="font-semibold text-gray-700">Items ({items.length})</h2>
      {items.map((ci, i) => (
        <div key={i} className="flex items-center gap-3">
          <img
            src={ci.item.imageAssets?.[0]?.imageUrl ?? ''}
            alt={ci.item.name}
            className="w-12 h-12 rounded-lg object-cover bg-gray-100"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{ci.item.name}</p>
            <p className="text-xs text-gray-400">{ci.item.category?.name}</p>
            {ci.item.brand && (
              <p className="text-xs text-gray-400">{ci.item.brand?.name}</p>
            )}
          </div>
          {ci.item.price != null && (
            <p className="text-sm text-gray-600">${ci.item.price}</p>
          )}
        </div>
      ))}
      <div className="pt-2 border-t flex justify-between">
        <span className="text-sm font-semibold text-gray-700">Total Value</span>
        <span className="text-sm font-semibold text-gray-900">${totalValue.toFixed(2)}</span>
      </div>
    </div>
  );
}
```


---

## 3. Execution Steps

### Task 1: Backend — Fix Swagger Gaps

1. Open `back-end/src/outfits/dto/create-outfit.dto.ts`
   - Add `OutfitItemResponseDto` class with `@ApiProperty()` on all fields
   - Add `OutfitResponseDto` class with `@ApiProperty()` on `_id`, `name`, `description`, `items`, `tags`, `season`, `createdAt`, `updatedAt`

2. Open `back-end/src/outfits/outfits.controller.ts`
   - Add `@ApiOperation` and `@ApiResponse` to all 5 endpoints (see Gap 2 above)
   - Add `@ApiParam` to the 3 endpoints that take `:id`
   - Add `@HttpCode(200)` to the DELETE handler
   - Import `OutfitResponseDto` from `./dto/create-outfit.dto`

3. Run backend: `cd back-end && npm run start:dev`
   - Open Swagger at `http://localhost:3000/api/docs`
   - Verify the `outfits` tag shows all 5 endpoints with correct request/response schemas
   - Confirm `OutfitResponseDto` shows `items` as an array of `OutfitItemResponseDto` with nested `item` object

### Task 2: Orval Generation

4. Run Orval: `npm run gen:api` (from `front-end/` directory)
   - Confirm generated hooks include:
     - `usePostOutfits` — POST /outfits
     - `useGetOutfits` — GET /outfits
     - `useGetOutfitsId` — GET /outfits/:id
     - `usePatchOutfitsId` — PATCH /outfits/:id
     - `useDeleteOutfitsId` — DELETE /outfits/:id
   - Confirm `OutfitResponseDto` type is generated with `items: OutfitItemResponseDto[]`

### Task 3: Frontend Implementation

5. Create `front-end/src/store/useOutfitStore.ts` — Zustand store with outfit list + canvas state

6. Create `front-end/src/components/outfits/CollageGrid.tsx`

7. Create `front-end/src/components/outfits/OutfitCard.tsx`

8. Create `front-end/src/pages/OutfitListPage.tsx`
   - Uses `useGetOutfits()` Orval hook
   - Seeds `useOutfitStore` on data load
   - Renders grid of `<OutfitCard>`

9. Create `front-end/src/components/outfits/FittingRoomCanvas.tsx`
   - Uses `react-rnd` `<Rnd>` for each canvas item
   - Calls `updateCanvasItem` on `onDragStop` and `onResizeStop`
   - Shows remove button on hover

10. Create `front-end/src/components/outfits/ItemSelectorPanel.tsx`
    - Configure `DndContext` with `MouseSensor` + `TouchSensor`
    - Category filter tabs
    - Item grid — clicking calls `onAddItem` with default position

11. Create `front-end/src/components/outfits/OutfitMetaForm.tsx`
    - Controlled inputs for `name` (text), `season` (select with Season enum values), `tags` (comma-separated or tag input)

12. Create `front-end/src/pages/FittingRoomPage.tsx`
    - Reads `:id` param — if present, fetches outfit and seeds canvas via `setCanvasItems`
    - Calls `createOutfit` or `updateOutfit` on save
    - Clears canvas on unmount

13. Create `front-end/src/components/outfits/ReadOnlyCanvas.tsx`

14. Create `front-end/src/components/outfits/ItemBreakdownList.tsx`

15. Create `front-end/src/pages/OutfitDetailPage.tsx`
    - Uses `useGetOutfitsId()` and `useDeleteOutfitsId()` Orval hooks
    - Renders `<ReadOnlyCanvas>` + `<ItemBreakdownList>` + edit/delete actions

16. Update router — add routes wrapped in `<ProtectedRoute>`:
    - `/outfits` → `<OutfitListPage>`
    - `/outfits/new` → `<FittingRoomPage>`
    - `/outfits/:id` → `<OutfitDetailPage>`
    - `/outfits/:id/edit` → `<FittingRoomPage>`

17. Update sidebar — add "Outfits" nav link pointing to `/outfits`

---

## 4. Validation

### Backend

| Test | Expected Result |
|------|----------------|
| `POST /outfits` with valid payload | `201 OutfitResponseDto` with `_id`, `name`, `items`, `season` |
| `GET /outfits` | `200 OutfitResponseDto[]` — each `items[n].item` is a full object, not ObjectId |
| `GET /outfits/:id` with valid id | `200 OutfitResponseDto` with populated items |
| `GET /outfits/:id` with another user's outfit | `404 Outfit not found` |
| `PATCH /outfits/:id` with updated items | `200 OutfitResponseDto` reflecting new items array |
| `DELETE /outfits/:id` | `200` — subsequent `GET /outfits/:id` returns 404 |
| Any endpoint without Bearer token | `401 Unauthorized` |
| Swagger at `/api/docs` | All 5 endpoints visible under `outfits` tag with full request/response schemas |
| `OutfitResponseDto` in Swagger | `items` shown as array of objects with nested `item` (not string) |

### Frontend

| Scenario | Expected Behaviour |
|----------|--------------------|
| Navigate to `/outfits` | Grid of `OutfitCard` renders; empty state if no outfits |
| `OutfitCard` with 1 item | Full-width single image collage |
| `OutfitCard` with 3 items | 1 large left + 2 stacked right collage |
| `OutfitCard` with 5 items | 2×2 grid showing first 4 items only |
| Navigate to `/outfits/new` | Empty canvas with model image; item selector on right |
| Click item in selector | Item appears on canvas at default position (100, 100) |
| Drag item on canvas | Item moves; `useOutfitStore.canvasItems` updated with new x/y |
| Resize item on canvas | Item resizes; store updated with new width/height |
| Hover item on canvas | Remove (×) button appears |
| Click remove button | Item removed from canvas and store |
| Click "Save Outfit" with empty name | No API call; inline validation error shown |
| Click "Save Outfit" with empty canvas | No API call; inline validation error shown |
| Click "Save Outfit" with valid data | `POST /outfits` fires; navigate to `/outfits` on success |
| Navigate to `/outfits/:id/edit` | Canvas pre-populated with saved item positions |
| Click "Update Outfit" | `PATCH /outfits/:id` fires; navigate to `/outfits` on success |
| Navigate to `/outfits/:id` | Read-only canvas reconstructs outfit; item list shows metadata |
| Total value calculation | Sum of all `item.price` values displayed correctly |
| Click "Edit Outfit" | Navigates to `/outfits/:id/edit` |
| Click "Delete Outfit" | `DELETE /outfits/:id` fires; navigate to `/outfits` on success |
| `/outfits/*` without auth | Redirects to `/login` |
| Orval types | `OutfitResponseDto.items[n].item` typed as object, not `string` or `any` |
| Mobile layout | Two-panel layout stacks vertically; canvas and selector usable on small screens |
