# Feature Specification: AI Outfit Recommendation (OOTD)

---

## 1. Objective

Complete the RAG-based OOTD recommendation pipeline for the wardrobe app. The `RecommendationService`, `ChromaService`, and `GeminiService` are already implemented. This spec closes three remaining gaps:

1. **Vector cleanup on item deletion** — `ItemsService.remove()` deletes from MongoDB but does not call `ChromaService.deleteItemVector()`, leaving orphaned vectors that pollute future similarity searches.
2. **Swagger completeness for `OotdResponseDto`** — `OotdItemDto` and `OotdResponseDto` need `@ApiProperty` decorators on all fields so Orval generates correct TypeScript types for the frontend.
3. **Frontend OOTD display** — The `AIStylistSection` component and `useDashboardStore` are specced in the Dashboard spec. This spec confirms the recommendation module's contract with the dashboard and documents the end-to-end data flow for implementors.

No new endpoints are introduced. OOTD is consumed exclusively via `GET /dashboard/home` (BFF pattern).

---

## 2. Technical Specs

### 2.1 Backend

#### Existing Module: `back-end/src/recommendation/`

```
back-end/src/recommendation/
├── dto/
│   └── ootd-response.dto.ts    ✓ exists — needs @ApiProperty on all fields
├── recommendation.module.ts    ✓ complete — no changes needed
└── recommendation.service.ts   ✓ complete — no changes needed
```

---

#### Gap 1: Complete `@ApiProperty` decorators in `ootd-response.dto.ts`

`WardrobeItemContextDto` is internal (not in any `@ApiResponse`) — no decorators needed.
`OotdItemDto` and `OotdResponseDto` are referenced by `DashboardResponseDto` — all fields must have `@ApiProperty`.

```typescript
// back-end/src/recommendation/dto/ootd-response.dto.ts — full replacement

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Internal DTO — not exposed via Swagger
export class WardrobeItemContextDto {
  id: string;
  name: string;
  category: string;
  color: string;
  tags: string[];
}

export class OotdItemDto {
  @ApiProperty({
    example: '64f1a2b3c4e5f6a7b8c9d0e1',
    description: 'MongoDB _id of the recommended item',
  })
  _id: string;

  @ApiProperty({ example: 'Linen White Shirt', description: 'Item name' })
  name: string;

  @ApiProperty({ example: 'Top', description: 'Category name' })
  category: string;

  @ApiProperty({ example: 'White', description: 'Item color' })
  color: string;

  @ApiProperty({
    example: ['https://res.cloudinary.com/...'],
    description: 'Image URLs of the item',
    type: [String],
  })
  images: string[];
}

export class OotdResponseDto {
  @ApiProperty({
    type: [OotdItemDto],
    description: 'Array of recommended items forming the Outfit Of The Day',
  })
  items: OotdItemDto[];

  @ApiProperty({
    example: 'ai',
    enum: ['ai', 'fallback'],
    description: '"ai" = Gemini RAG pipeline succeeded; "fallback" = rule-based logic was used',
  })
  source: 'ai' | 'fallback';

  @ApiPropertyOptional({
    example: 'A light linen outfit suitable for 30°C and clear skies.',
    description: 'Human-readable explanation from Gemini, or fallback reason',
  })
  reason?: string;
}
```

> Note: `OotdItemDto.category` is a `string` (populated category name), not a `MetadataRefDto`. The `RecommendationService` hydrates items with `.populate('category', 'name')` and maps to the flat string shape.

---

#### Gap 2: Fix `ItemsService.remove()` — delete vector on item deletion

**File:** `back-end/src/items/items.service.ts`

**Current behaviour:** Deletes item from MongoDB; does not touch ChromaDB.

**Required change:** After successful MongoDB deletion, call `this.chromaService.deleteItemVector(id)` in a non-fatal try/catch.

```typescript
// items.service.ts — replace remove() method

async remove(id: string, userId: string): Promise<void> {
  const result = await this.itemModel
    .deleteOne({ _id: id, owner: userId })
    .exec();
  if (result.deletedCount === 0)
    throw new NotFoundException('Item not found');

  // Sync deletion to ChromaDB (non-fatal — must not block or throw)
  try {
    await this.chromaService.deleteItemVector(id);
    this.logger.log(`Deleted vector for item ${id} from ChromaDB`);
  } catch (error) {
    this.logger.error(`Failed to delete vector for item ${id} from ChromaDB`, error);
  }
}
```

> `ChromaService.deleteItemVector` already swallows its own errors internally, but the outer try/catch is kept for explicit logging at the `ItemsService` level.

---

#### Existing Implementations (no changes needed)

**`ItemsService.create()`** — already calls `GeminiService.generateEmbedding` + `ChromaService.upsertItemVector` after save. Non-fatal on failure.

**`ItemsService.update()`** — already re-generates embedding and upserts to ChromaDB on every update. Non-fatal on failure.

**`RecommendationService.getOotd(userId, weather)`** — fully implemented RAG pipeline:
1. Build `weatherContext` string from `WeatherResponseDto`
2. `GeminiService.generateEmbedding(weatherContext)` → `queryVector`
3. `ChromaService.querySimilarItems(userId, queryVector, 15)` → `topItemIds`
4. Fetch candidate metadata from MongoDB (text-only fields)
5. `GeminiService.generateOutfitFromCandidates(weatherContext, candidates)` with 5s timeout
6. Hydrate final items from MongoDB with `populate('category')`
7. Returns `OotdResponseDto { items, source: 'ai', reason }`
8. Any error → `getFallbackOotd()` → `{ items: [], source: 'fallback', reason: 'Rule-based logic' }`

**`ChromaService`** — single `wardrobe_items` collection; cosine similarity; `userId` metadata filter on all queries; `upsertItemVector`, `deleteItemVector`, `querySimilarItems` all implemented.

**`GeminiService`** — `generateEmbedding` uses `gemini-embedding-001`; `generateOutfitFromCandidates` uses `gemini-3.1-flash-lite-preview` with `temperature: 0.2`, JSON response mode, and 5s timeout race.

---

#### Endpoint Reference (consumed via Dashboard — no direct recommendation endpoint)

| Method | Endpoint | Module | Description |
|--------|----------|--------|-------------|
| GET | `/dashboard/home` | DashboardModule | BFF aggregator — includes `ootd: OotdResponseDto` in response |

The `RecommendationModule` has no controller by design. `RecommendationService` is exported and injected into `DashboardService`.

---

### 2.2 Frontend

The frontend for OOTD display is fully specced in the **Dashboard spec** (`AIStylistSection`, `OutfitCard`, `SkeletonCard`, `useDashboardStore`). No additional frontend work is required for this spec.

#### Orval Types Required from `OotdResponseDto`

After the `@ApiProperty` fix in Gap 1, Orval will generate:

```typescript
// src/api/generated — auto-generated by Orval

interface OotdItemDto {
  _id: string
  name: string
  category: string
  color: string
  images: string[]
}

interface OotdResponseDto {
  items: OotdItemDto[]
  source: 'ai' | 'fallback'
  reason?: string
}
```

These types are consumed by `useDashboardStore` and `AIStylistSection` in the Dashboard feature.

---

## 3. Execution Steps

### Task 1: Backend — Fix DTO + Vector Cleanup

1. Open `back-end/src/recommendation/dto/ootd-response.dto.ts`
   - Replace with the full version from Gap 1 above
   - Ensure `ApiPropertyOptional` is imported from `@nestjs/swagger`
   - Verify `OotdItemDto.category` is typed as `string` (not `MetadataRefDto`)

2. Open `back-end/src/items/items.service.ts`
   - Replace the `remove()` method with the version from Gap 2 above
   - Verify `this.chromaService` is already injected (it is — `ChromaService` is in the constructor)
   - Verify `this.logger` is already defined (it is)

3. Run backend: `cd back-end && npm run start:dev`
   - Verify no TypeScript errors
   - Open Swagger at `http://localhost:3000/api/docs`
   - Navigate to the `Dashboard` tag → `GET /dashboard/home` → expand `200` response schema
   - Confirm `ootd` field shows `OotdResponseDto` with `items: OotdItemDto[]`, `source` enum, and optional `reason`
   - Confirm `OotdItemDto` shows all 5 fields: `_id`, `name`, `category`, `color`, `images`

### Task 2: Orval Generation

4. Run Orval: `npm run gen:api` (from `front-end/` directory)
   - Confirm `OotdItemDto` and `OotdResponseDto` are generated in `src/api/generated/`
   - Confirm `source` is typed as `'ai' | 'fallback'` (not `string`)
   - Confirm `reason` is typed as `string | undefined` (optional)
   - Confirm `images` is typed as `string[]`

### Task 3: Verify End-to-End Pipeline

5. Ensure ChromaDB is running: `docker-compose up -d chroma` (or equivalent)

6. Create a test item via `POST /items` with valid metadata
   - Check backend logs for: `[RAG]` embedding generation log and ChromaDB upsert log
   - Verify no errors in the embedding pipeline

7. Call `GET /dashboard/home` with a valid JWT
   - If wardrobe has 1+ items with vectors: verify `ootd.source === 'ai'` and `ootd.items.length >= 1`
   - If wardrobe is empty or ChromaDB is unreachable: verify `ootd.source === 'fallback'`

8. Delete the test item via `DELETE /items/:id`
   - Check backend logs for: `Deleted vector for item {id} from ChromaDB`
   - Verify the item no longer appears in subsequent OOTD recommendations

---

## 4. Validation

### Backend

| Test | Expected Result |
|------|----------------|
| `POST /items` with valid metadata | Backend logs show embedding generated + ChromaDB upsert succeeded |
| `POST /items` when Gemini is unavailable | Item saved with `201`; error logged; no exception thrown to client |
| `PATCH /items/:id` with metadata change | Backend logs show new embedding generated + ChromaDB upsert (overwrite) |
| `DELETE /items/:id` | Backend logs show `Deleted vector for item {id} from ChromaDB` |
| `DELETE /items/:id` when ChromaDB is down | `200` returned; error logged; MongoDB deletion still succeeds |
| `GET /dashboard/home` — wardrobe has 5+ items | `ootd.source === 'ai'`; `ootd.items.length >= 1`; `ootd.reason` is non-empty string |
| `GET /dashboard/home` — empty wardrobe | `ootd.source === 'fallback'`; `ootd.items` may be `[]` |
| `GET /dashboard/home` — Gemini times out | `ootd.source === 'fallback'`; no 500 error |
| `GET /dashboard/home` — ChromaDB down | `ootd.source === 'fallback'`; no 500 error |
| Swagger `GET /dashboard/home` → `ootd` schema | `OotdResponseDto` visible with `items: OotdItemDto[]`, `source` enum `['ai','fallback']`, optional `reason` |
| Swagger `OotdItemDto` schema | All 5 fields visible: `_id`, `name`, `category` (string), `color`, `images` (string[]) |
| Cross-user isolation | User A's OOTD never contains items from User B's wardrobe |

### Frontend (Orval + Dashboard)

| Scenario | Expected Behaviour |
|----------|--------------------|
| Orval generation after DTO fix | `OotdItemDto` and `OotdResponseDto` generated with correct types |
| `source` field type | Typed as `'ai' \| 'fallback'` — not `string` |
| `reason` field type | Typed as `string \| undefined` — optional |
| `AIStylistSection` with `ootd.source === 'ai'` | Badge reads "AI Pick" |
| `AIStylistSection` with `ootd.source === 'fallback'` | Badge reads "Suggested" |
| `AIStylistSection` with `ootd.items.length === 0` | Empty state shown with `ootd.reason` text |
| TypeScript compilation | Zero `any` types; `tsc --noEmit` passes |
