# Feature Specification: Favorites

---

## 1. Objective

Allow authenticated users to favorite wardrobe items and view them in a dedicated page. The backend module (`FavoritesModule`) is already scaffolded with full service logic but is missing Swagger decorators and a `FavoriteResponseDto` — both required for Orval to generate typed frontend hooks. The frontend needs a `FavoritesPage`, a heart-toggle on `ItemCard`, a Zustand store (`useFavoriteStore`) for O(1) lookup, and a sidebar navigation link.

---

## 2. Technical Specs

### 2.1 Backend

#### Existing Module: `back-end/src/favorites/`

```
back-end/src/favorites/
├── dto/
│   └── favorites.dto.ts        ✓ exists — CreateFavoriteDto only; needs FavoriteResponseDto added
├── favorite.schema.ts          ✓ exists — no changes needed
├── favorites.controller.ts     ✓ exists — missing @ApiOperation + @ApiResponse on all endpoints
├── favorites.service.ts        ✓ exists — no changes needed
└── favorites.module.ts         ✓ exists — no changes needed
```

---

#### Gap 1: Add `FavoriteResponseDto` to `favorites.dto.ts`

Orval needs a typed response shape to generate correct frontend types. Add to `back-end/src/favorites/dto/favorites.dto.ts`:

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { ItemResponseDto } from '../../items/dto/items.dto';

export class FavoriteResponseDto {
  @ApiProperty({ example: '60d0fe4f5311236168a109ca' })
  _id: string;

  @ApiProperty({ type: () => ItemResponseDto })
  item: ItemResponseDto;

  @ApiProperty()
  createdAt: Date;
}
```

> Verify that `ItemResponseDto` is exported from `back-end/src/items/dto/items.dto.ts`. If the class name differs, use the correct export.

---

#### Gap 2: Add `@ApiOperation` + `@ApiResponse` to all controller endpoints

Update `back-end/src/favorites/favorites.controller.ts` — add Swagger decorators to every handler:

```typescript
import {
  Controller, Get, Post, Body, Param, Delete, UseGuards, HttpCode,
} from '@nestjs/common';
import {
  ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam,
} from '@nestjs/swagger';
import { FavoritesService } from './favorites.service';
import { CreateFavoriteDto, FavoriteResponseDto } from './dto/favorites.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('favorites')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post()
  @ApiOperation({ summary: 'Add an item to favorites' })
  @ApiResponse({ status: 201, type: FavoriteResponseDto })
  @ApiResponse({ status: 409, description: 'Item is already in favorites' })
  create(@Body() createFavoriteDto: CreateFavoriteDto, @CurrentUser() user: any) {
    return this.favoritesService.create(createFavoriteDto, user._id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all favorites for the current user (item populated)' })
  @ApiResponse({ status: 200, type: [FavoriteResponseDto] })
  findAll(@CurrentUser() user: any) {
    return this.favoritesService.findAll(user._id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single favorite by favorite document ID' })
  @ApiParam({ name: 'id', description: 'Favorite document _id' })
  @ApiResponse({ status: 200, type: FavoriteResponseDto })
  @ApiResponse({ status: 404, description: 'Favorite not found' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.favoritesService.findOne(id, user._id);
  }

  @Delete('item/:itemId')
  @HttpCode(200)
  @ApiOperation({ summary: 'Remove a favorite by item ID — use this for the heart toggle' })
  @ApiParam({ name: 'itemId', description: 'Item _id to un-favorite' })
  @ApiResponse({ status: 200, description: 'Favorite removed' })
  @ApiResponse({ status: 404, description: 'Favorite not found' })
  removeByItemId(@Param('itemId') itemId: string, @CurrentUser() user: any) {
    return this.favoritesService.removeByItemId(itemId, user._id);
  }

  @Delete(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Remove a favorite by favorite document ID' })
  @ApiParam({ name: 'id', description: 'Favorite document _id' })
  @ApiResponse({ status: 200, description: 'Favorite removed' })
  @ApiResponse({ status: 404, description: 'Favorite not found' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.favoritesService.remove(id, user._id);
  }
}
```

---

#### Endpoints Summary

| Method | Endpoint | Body / Param | Success | Error |
|--------|----------|--------------|---------|-------|
| POST | `/favorites` | `{ item: string }` | `201 FavoriteResponseDto` | 409 duplicate |
| GET | `/favorites` | — | `200 FavoriteResponseDto[]` | 401 |
| GET | `/favorites/:id` | `id` = favorite `_id` | `200 FavoriteResponseDto` | 404 |
| DELETE | `/favorites/item/:itemId` | `itemId` = item `_id` | `200` | 404 |
| DELETE | `/favorites/:id` | `id` = favorite `_id` | `200` | 404 |

All endpoints require `Authorization: Bearer <token>`.

---

### 2.2 Frontend

#### New Files

```
front-end/src/
├── store/
│   └── useFavoriteStore.ts              Zustand favorites store
├── pages/
│   └── FavoritesPage.tsx                Grid of favorited items
└── components/
    └── HeartButton.tsx                  Heart toggle icon button
```

#### Modified Files

```
front-end/src/
├── components/
│   └── ItemCard.tsx                     Add HeartButton overlay
└── components/layout/
    └── Sidebar.tsx (or equivalent)      Add "Favorites" nav link
```

---

#### `useFavoriteStore.ts` (Zustand)

```typescript
import { create } from 'zustand';
import { FavoriteResponseDto } from '@/api/generated';  // Orval-generated type

interface FavoriteState {
  favorites: FavoriteResponseDto[];
  favoriteItemIds: Set<string>;          // O(1) lookup — itemId → is favorited
  isLoading: boolean;
  fetchFavorites: () => Promise<void>;
  addFavorite: (itemId: string) => void; // optimistic
  removeFavorite: (itemId: string) => void; // optimistic
  isFavorited: (itemId: string) => boolean;
}

export const useFavoriteStore = create<FavoriteState>((set, get) => ({
  favorites: [],
  favoriteItemIds: new Set(),
  isLoading: false,

  fetchFavorites: async () => {
    // Called imperatively after Orval hook resolves in FavoritesPage
    // Store receives data via setFavorites called from the component
  },

  addFavorite: (itemId) =>
    set((state) => ({
      favoriteItemIds: new Set([...state.favoriteItemIds, itemId]),
    })),

  removeFavorite: (itemId) =>
    set((state) => {
      const next = new Set(state.favoriteItemIds);
      next.delete(itemId);
      return { favoriteItemIds: next };
    }),

  isFavorited: (itemId) => get().favoriteItemIds.has(itemId),
}));

// Separate setter called from FavoritesPage after GET /favorites resolves
export const setFavorites = (
  data: FavoriteResponseDto[],
  set: (partial: Partial<FavoriteState>) => void,
) => {
  const ids = new Set(data.map((f) => f.item._id));
  set({ favorites: data, favoriteItemIds: ids });
};
```

> Pattern: `fetchFavorites` is driven by the Orval hook in the component. The store only holds state and exposes optimistic mutators. The component calls `useFavoriteStore.setState({ favorites: data, favoriteItemIds: ... })` after the hook resolves.

---

#### `FavoritesPage.tsx`

```typescript
// Route: /favorites
// Uses Orval hook useGetFavorites() — auto-generated after Step 3
// On mount: fetches favorites, seeds useFavoriteStore

interface FavoritesPageProps {}  // no props — data from hook + store

export function FavoritesPage(_: FavoritesPageProps) {
  const { data, isLoading } = useGetFavorites();  // Orval hook
  const store = useFavoriteStore();

  useEffect(() => {
    if (data) {
      useFavoriteStore.setState({
        favorites: data,
        favoriteItemIds: new Set(data.map((f) => f.item._id)),
      });
    }
  }, [data]);

  if (isLoading) return <LoadingSpinner />;
  if (!data?.length) return <EmptyState message="No favorites yet" />;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {data.map((fav) => (
        <ItemCard key={fav._id} item={fav.item} showHeart />
      ))}
    </div>
  );
}
```

---

#### `HeartButton.tsx`

```typescript
interface HeartButtonProps {
  itemId: string;
  size?: 'sm' | 'md';
}

// Reads isFavorited from store; calls POST or DELETE on click with optimistic update
export function HeartButton({ itemId, size = 'md' }: HeartButtonProps) {
  const { isFavorited, addFavorite, removeFavorite } = useFavoriteStore();
  const favorited = isFavorited(itemId);

  const { mutate: addMutate } = usePostFavorites();          // Orval hook
  const { mutate: removeMutate } = useDeleteFavoritesItemItemId(); // Orval hook

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();  // prevent ItemCard click-through
    if (favorited) {
      removeFavorite(itemId);  // optimistic
      removeMutate({ itemId }, {
        onError: () => addFavorite(itemId),  // rollback
      });
    } else {
      addFavorite(itemId);  // optimistic
      addMutate({ data: { item: itemId } }, {
        onError: () => removeFavorite(itemId),  // rollback
      });
    }
  };

  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <button
      onClick={handleToggle}
      aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
      className="p-1.5 rounded-full bg-white/80 hover:bg-white transition-colors shadow-sm"
    >
      {favorited
        ? <HeartSolidIcon className={`${iconSize} text-red-500`} />
        : <HeartOutlineIcon className={`${iconSize} text-gray-400`} />
      }
    </button>
  );
}
```

---

#### `ItemCard.tsx` — modifications

Add an optional `showHeart` prop and overlay `HeartButton` in the top-right corner of the card image:

```typescript
interface ItemCardProps {
  item: ItemResponseDto;   // Orval-generated type
  showHeart?: boolean;     // default: true — show heart toggle
}

// Inside the card image container, add:
{showHeart !== false && (
  <div className="absolute top-2 right-2">
    <HeartButton itemId={item._id} size="sm" />
  </div>
)}
```

> Wrap the image container with `relative` positioning if not already present.

---

#### Sidebar — add Favorites link

In the existing sidebar component, add a nav item:

```typescript
{ label: 'Favorites', href: '/favorites', icon: HeartIcon }
```

---

#### Initialize store on app load

In `App.tsx` (or the root layout), after `initAuth()` resolves and the user is authenticated, seed the favorites store so heart icons render correctly across all pages:

```typescript
// After auth is confirmed:
const { data: favoritesData } = useGetFavorites({ query: { enabled: isAuthenticated } });

useEffect(() => {
  if (favoritesData) {
    useFavoriteStore.setState({
      favorites: favoritesData,
      favoriteItemIds: new Set(favoritesData.map((f) => f.item._id)),
    });
  }
}, [favoritesData]);
```

---

## 3. Execution Steps

### Task 1: Backend — Fix Swagger Gaps

1. Open `back-end/src/favorites/dto/favorites.dto.ts`
   - Add `FavoriteResponseDto` class with `@ApiProperty()` on `_id`, `item` (type `ItemResponseDto`), and `createdAt`
   - Import `ItemResponseDto` from `../../items/dto/items.dto`

2. Open `back-end/src/favorites/favorites.controller.ts`
   - Add `@ApiOperation` and `@ApiResponse` to all 5 endpoints (see Gap 2 above)
   - Add `@ApiParam` to the 3 endpoints that take path params
   - Add `@HttpCode(200)` to both DELETE handlers
   - Import `FavoriteResponseDto` from `./dto/favorites.dto`

3. Run backend: `cd back-end && npm run start:dev`
   - Open Swagger at `http://localhost:3000/api/docs`
   - Verify the `favorites` tag shows all 5 endpoints with correct request/response schemas
   - Confirm `FavoriteResponseDto` shows `item` as a nested object (not just `string`)

### Task 2: Orval Generation

4. Run Orval: `npm run gen:api` (from `front-end/` directory)
   - Confirm generated hooks include:
     - `usePostFavorites` — POST /favorites
     - `useGetFavorites` — GET /favorites
     - `useGetFavoritesId` — GET /favorites/:id
     - `useDeleteFavoritesItemItemId` — DELETE /favorites/item/:itemId
     - `useDeleteFavoritesId` — DELETE /favorites/:id
   - Confirm `FavoriteResponseDto` type is generated with `item: ItemResponseDto`

### Task 3: Frontend Implementation

5. Create `front-end/src/store/useFavoriteStore.ts` — Zustand store

6. Create `front-end/src/components/HeartButton.tsx`
   - Uses `usePostFavorites` and `useDeleteFavoritesItemItemId` Orval hooks
   - Reads/writes `useFavoriteStore` for optimistic updates

7. Update `front-end/src/components/ItemCard.tsx`
   - Add `showHeart?: boolean` prop
   - Overlay `<HeartButton>` in top-right of image container

8. Create `front-end/src/pages/FavoritesPage.tsx`
   - Uses `useGetFavorites()` Orval hook
   - Seeds `useFavoriteStore` on data load
   - Renders grid of `<ItemCard showHeart />`

9. Update `Sidebar` component — add Favorites nav link pointing to `/favorites`

10. Update `App.tsx` / root layout
    - Add `/favorites` route wrapped in `<ProtectedRoute>`
    - Seed `useFavoriteStore` after auth resolves using `useGetFavorites({ query: { enabled: isAuthenticated } })`

---

## 4. Validation

### Backend

| Test | Expected Result |
|------|----------------|
| `POST /favorites` with valid item | `201 FavoriteResponseDto` with populated `item` object |
| `POST /favorites` same item twice | `409 { message: 'Item is already in favorites' }` |
| `POST /favorites` with item not owned by user | `404 NotFoundException` |
| `GET /favorites` | `200 FavoriteResponseDto[]` — each `item` is a full object, not ObjectId |
| `GET /favorites/:id` with valid id | `200 FavoriteResponseDto` |
| `GET /favorites/:id` with wrong user's id | `404 Favorite not found` |
| `DELETE /favorites/item/:itemId` | `200` — subsequent GET no longer includes that item |
| `DELETE /favorites/item/:itemId` not in favorites | `404 Favorite not found` |
| Any endpoint without Bearer token | `401 Unauthorized` |
| Swagger at `/api/docs` | All 5 endpoints visible under `favorites` tag with full schemas |

### Frontend

| Scenario | Expected Behaviour |
|----------|--------------------|
| Navigate to `/favorites` | Grid of favorited items renders; empty state if none |
| Click heart on un-favorited item | Heart fills red immediately (optimistic); POST fires in background |
| Click heart on favorited item | Heart empties immediately (optimistic); DELETE fires in background |
| POST returns 409 | Heart reverts to un-filled; no duplicate in store |
| DELETE returns 404 | Heart reverts to filled; item stays in store |
| Refresh page on `/wardrobe` | Heart icons reflect correct state (store seeded from GET /favorites on mount) |
| Click "Favorites" in sidebar | Navigates to `/favorites` |
| `/favorites` without auth | Redirects to `/login` |
| Orval types | `FavoriteResponseDto.item` is typed as `ItemResponseDto`, not `string` or `any` |
