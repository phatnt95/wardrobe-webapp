# Feature Specification: Home Dashboard

---

## 1. Objective

Deliver the Home Dashboard page (`/dashboard`) for the wardrobe app. A single BFF endpoint `GET /dashboard/home` aggregates weather, AI-powered OOTD recommendation, recent wardrobe items, and wardrobe stats in one parallel call. The backend is fully implemented and Swagger-complete — no backend work is required. This spec covers the complete frontend integration: Orval hook wiring, `useDashboardStore` Zustand store, and all UI components.

---

## 2. Technical Specs

### 2.1 Backend

#### Existing Module: `back-end/src/dashboard/`

```
back-end/src/dashboard/
├── dto/
│   └── dashboard-response.dto.ts   ✓ complete — DashboardResponseDto, RecentItemDto, WardrobeStatsDto
├── dashboard.controller.ts         ✓ complete — @ApiOperation, @ApiResponse, @ApiQuery, @ApiBearerAuth
├── dashboard.service.ts            ✓ complete — Promise.all aggregation
└── dashboard.module.ts             ✓ complete
```

No backend changes needed. The Swagger spec is complete and Orval will generate the hook automatically.

---

#### Endpoint Reference

**`GET /dashboard/home`** — requires `Authorization: Bearer <token>`

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `lat` | float | No | 10.8231 | Latitude (Ho Chi Minh City fallback) |
| `lon` | float | No | 106.6297 | Longitude (Ho Chi Minh City fallback) |

**Response: `200 DashboardResponseDto`**

```typescript
interface DashboardResponseDto {
  weather: WeatherResponseDto       // temperature, feelsLike, humidity, iconCode, iconUrl, condition, description, cityName
  ootd: OotdResponseDto             // items: OotdItemDto[], source: 'ai'|'fallback', reason?: string
  recentItems: RecentItemDto[]      // last 5 items: _id, name, category, color, images[], createdAt
  stats: WardrobeStatsDto           // totalItems: number, totalValue: number
}
```

**Error responses:**
- `401 Unauthorized` — missing or invalid JWT

---

### 2.2 Frontend

#### New Files

```
front-end/src/
├── store/
│   └── useDashboardStore.ts              Zustand dashboard store
└── pages/
    └── HomeDashboard.tsx                 Main dashboard page + all sub-components
```

#### Modified Files

```
front-end/src/
└── App.tsx (or router config)            Add /dashboard route inside ProtectedRoute
```

---

#### `useDashboardStore.ts` (Zustand)

```typescript
import { create } from 'zustand'
import {
  DashboardResponseDto,
  WeatherResponseDto,
  OotdResponseDto,
  RecentItemDto,
  WardrobeStatsDto,
} from '@/api/generated'   // Orval-generated types

interface DashboardState {
  weather: WeatherResponseDto | null
  ootd: OotdResponseDto | null
  recentItems: RecentItemDto[]
  stats: WardrobeStatsDto | null
  isLoading: boolean
  error: string | null
  setData: (data: DashboardResponseDto) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

export const useDashboardStore = create<DashboardState>((set) => ({
  weather: null,
  ootd: null,
  recentItems: [],
  stats: null,
  isLoading: true,
  error: null,
  setData: (data) => set({ ...data, isLoading: false, error: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
  reset: () => set({
    weather: null, ootd: null, recentItems: [], stats: null,
    isLoading: true, error: null,
  }),
}))
```

---

#### `HomeDashboard.tsx` — page + sub-components

The file contains the page and all co-located sub-components. Split into separate files only if the file exceeds ~300 lines.

---

##### Geolocation Strategy

On mount, call `navigator.geolocation.getCurrentPosition()` with a 5-second timeout.
- On success: use `{ lat: position.coords.latitude, lon: position.coords.longitude }`
- On error or timeout: fall back to `{ lat: 10.8231, lon: 106.6297 }` (Ho Chi Minh City)

The Orval hook is enabled only after coordinates are resolved (`enabled: coords !== null`).

---

##### `HomeDashboard` — orchestration

```typescript
// Route: /dashboard (inside ProtectedRoute)
// Props: none — all data from Orval hook + useDashboardStore + useAuthStore

interface HomeDashboardProps {}

export function HomeDashboard(_: HomeDashboardProps) {
  const { user } = useAuthStore()
  const store = useDashboardStore()
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null)

  // Resolve geolocation on mount
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => setCoords({ lat: 10.8231, lon: 106.6297 }),
      { timeout: 5000 },
    )
  }, [])

  // Orval hook — fires once coords are resolved
  const { data, isLoading, isError } = useGetDashboardHome(
    { lat: coords?.lat ?? 10.8231, lon: coords?.lon ?? 106.6297 },
    { query: { enabled: coords !== null } },
  )

  // Sync to store
  useEffect(() => { if (data) store.setData(data) }, [data])
  useEffect(() => { if (isError) store.setError('Failed to load dashboard') }, [isError])

  return (
    <div className="min-h-screen bg-gray-50 p-4 space-y-6 max-w-2xl mx-auto">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">
          Good {getTimeOfDay()}, {user?.firstName ?? 'there'}
        </h1>
        {store.weather && <WeatherWidget weather={store.weather} />}
      </header>

      <AIStylistSection ootd={store.ootd} isLoading={isLoading || store.isLoading} />

      {store.recentItems.length > 0 && <RecentItemsRow items={store.recentItems} />}

      {store.stats && <WardrobeStatsWidget stats={store.stats} />}

      {store.error && (
        <div className="text-center text-red-500 text-sm py-4">
          {store.error}
          <button onClick={() => { store.reset(); setCoords(null) }}
            className="ml-2 underline">Retry</button>
        </div>
      )}
    </div>
  )
}
```

---

##### `WeatherWidget`

```typescript
interface WeatherWidgetProps {
  weather: WeatherResponseDto
}

// Renders: city name, temperature, feels-like, weather icon (lucide-react)
// Icon mapping by weather.condition:
//   'Clear'                    → Sun
//   'Clouds'                   → Cloud
//   'Rain' | 'Drizzle'         → CloudRain
//   'Thunderstorm'             → CloudLightning
//   'Snow'                     → Snowflake
//   'Mist' | 'Fog' | 'Haze'   → CloudFog
//   fallback                   → Thermometer

function WeatherWidget({ weather }: WeatherWidgetProps) {
  const Icon = getWeatherIcon(weather.condition)
  return (
    <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 shadow-sm">
      <Icon className="w-5 h-5 text-blue-500" />
      <div className="text-right">
        <p className="text-sm font-semibold text-gray-900">{Math.round(weather.temperature)}°C</p>
        <p className="text-xs text-gray-500">{weather.cityName}</p>
      </div>
    </div>
  )
}
```

---

##### `AIStylistSection`

```typescript
interface AIStylistSectionProps {
  ootd: OotdResponseDto | null
  isLoading: boolean
}

// Three render states:
// 1. isLoading=true          → 3× SkeletonCard in horizontal row
// 2. ootd.items.length > 0   → AI badge + reason quote box + horizontal OutfitCard grid
// 3. ootd.items.length === 0 → reason text + "Add new items" CTA button (navigates to /wardrobe/add)

function AIStylistSection({ ootd, isLoading }: AIStylistSectionProps) {
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" /> AI Stylist
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
        </div>
      </section>
    )
  }

  if (!ootd || ootd.items.length === 0) {
    return (
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" /> AI Stylist
        </h2>
        <div className="bg-purple-50 rounded-xl p-4 text-center space-y-3">
          <p className="text-sm text-gray-600 italic">{ootd?.reason ?? 'No outfit suggestion available.'}</p>
          <button
            onClick={() => navigate('/wardrobe/add')}
            className="bg-purple-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Add new items
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-purple-500" /> AI Stylist
        <span className="ml-auto text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
          {ootd.source === 'ai' ? 'AI Pick' : 'Suggested'}
        </span>
      </h2>
      {ootd.reason && (
        <blockquote className="border-l-4 border-purple-400 pl-3 text-sm text-gray-600 italic bg-purple-50 py-2 pr-3 rounded-r-lg">
          {ootd.reason}
        </blockquote>
      )}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {ootd.items.map((item) => <OutfitCard key={item._id} item={item} />)}
      </div>
    </section>
  )
}
```

---

##### `OutfitCard`

```typescript
interface OutfitCardProps {
  item: OotdItemDto
}

function OutfitCard({ item }: OutfitCardProps) {
  return (
    <div className="flex-shrink-0 w-36 bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="h-40 bg-gray-100">
        {item.images[0]
          ? <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center">
              <Shirt className="w-8 h-8 text-gray-300" />
            </div>
        }
      </div>
      <div className="p-2">
        <p className="text-xs font-medium text-gray-900 truncate">{item.name}</p>
        <p className="text-xs text-gray-500 truncate">{item.category}</p>
      </div>
    </div>
  )
}
```

---

##### `SkeletonCard`

```typescript
function SkeletonCard() {
  return (
    <div className="flex-shrink-0 w-36 bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
      <div className="h-40 bg-gray-200" />
      <div className="p-2 space-y-1.5">
        <div className="h-3 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  )
}
```

---

##### `RecentItemsRow`

```typescript
interface RecentItemsRowProps {
  items: RecentItemDto[]
}

function RecentItemsRow({ items }: RecentItemsRowProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-gray-800">Recently Added</h2>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {items.map((item) => (
          <div key={item._id} className="flex-shrink-0 w-28 bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="h-32 bg-gray-100">
              {item.images[0]
                ? <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center">
                    <Shirt className="w-6 h-6 text-gray-300" />
                  </div>
              }
            </div>
            <div className="p-2">
              <p className="text-xs font-medium text-gray-900 truncate">{item.name}</p>
              <p className="text-xs text-gray-500 truncate">{item.category}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
```

---

##### `WardrobeStatsWidget`

```typescript
interface WardrobeStatsWidgetProps {
  stats: WardrobeStatsDto
}

function WardrobeStatsWidget({ stats }: WardrobeStatsWidgetProps) {
  return (
    <section className="grid grid-cols-2 gap-3">
      <div className="bg-white rounded-xl shadow-sm p-4 text-center">
        <p className="text-2xl font-bold text-gray-900">{stats.totalItems}</p>
        <p className="text-xs text-gray-500 mt-1">Total Items</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-4 text-center">
        <p className="text-2xl font-bold text-gray-900">
          {stats.totalValue.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
        </p>
        <p className="text-xs text-gray-500 mt-1">Total Value</p>
      </div>
    </section>
  )
}
```

---

##### Helper: `getTimeOfDay`

```typescript
function getTimeOfDay(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 18) return 'afternoon'
  return 'evening'
}
```

---

##### Helper: `getWeatherIcon`

```typescript
import { Sun, Cloud, CloudRain, CloudLightning, Snowflake, CloudFog, Thermometer } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

function getWeatherIcon(condition: string): LucideIcon {
  const map: Record<string, LucideIcon> = {
    Clear: Sun,
    Clouds: Cloud,
    Rain: CloudRain,
    Drizzle: CloudRain,
    Thunderstorm: CloudLightning,
    Snow: Snowflake,
    Mist: CloudFog,
    Fog: CloudFog,
    Haze: CloudFog,
  }
  return map[condition] ?? Thermometer
}
```

---

## 3. Execution Steps

### Task 1: Backend — Verify Swagger (no code changes)

1. Run backend: `cd back-end && npm run start:dev`
2. Open Swagger at `http://localhost:3000/api/docs`
3. Verify the `Dashboard` tag shows `GET /dashboard/home` with:
   - `lat` and `lon` query params documented
   - `200 DashboardResponseDto` response schema with all nested types visible
   - `401` response documented
   - `ApiBearerAuth` lock icon present

> If any Swagger gaps are found, fix them in `dashboard.controller.ts` and `dashboard-response.dto.ts` before proceeding.

### Task 2: Orval Generation

4. Run Orval: `npm run gen:api` (from `front-end/` directory)
5. Confirm the following are generated in `src/api/generated/`:
   - Hook: `useGetDashboardHome` — `GET /dashboard/home`
   - Types: `DashboardResponseDto`, `WeatherResponseDto`, `OotdResponseDto`, `OotdItemDto`, `RecentItemDto`, `WardrobeStatsDto`
6. Verify `useGetDashboardHome` accepts `{ lat: number, lon: number }` as query params and supports `{ query: { enabled: boolean } }` option

### Task 3: Frontend Implementation

7. Create `front-end/src/store/useDashboardStore.ts`
   - Zustand store with `weather`, `ootd`, `recentItems`, `stats`, `isLoading`, `error`
   - Actions: `setData`, `setLoading`, `setError`, `reset`
   - Import all types from `@/api/generated`

8. Create `front-end/src/pages/HomeDashboard.tsx`
   - Implement geolocation logic with 5s timeout and HCMC fallback
   - Wire `useGetDashboardHome` Orval hook with `enabled: coords !== null`
   - Sync `data` and `isError` to `useDashboardStore` via `useEffect`
   - Render `WeatherWidget`, `AIStylistSection`, `RecentItemsRow`, `WardrobeStatsWidget`
   - Co-locate all sub-components in the same file:
     - `WeatherWidget` — with `getWeatherIcon` helper
     - `AIStylistSection` — 3 render states (loading / items / empty)
     - `OutfitCard`
     - `SkeletonCard` — `animate-pulse` shimmer
     - `RecentItemsRow`
     - `WardrobeStatsWidget`
   - Helper functions: `getTimeOfDay`, `getWeatherIcon`
   - All props typed with interfaces — no `any`
   - All styling via Tailwind classes only

9. Update `front-end/src/App.tsx` (or router config)
   - Add route: `<Route path="/dashboard" element={<ProtectedRoute><HomeDashboard /></ProtectedRoute>} />`
   - Import `HomeDashboard` from `@/pages/HomeDashboard`

---

## 4. Validation

### Backend

| Test | Expected Result |
|------|----------------|
| `GET /dashboard/home` with valid JWT, no params | `200 DashboardResponseDto` — all 4 fields populated; coords default to HCMC |
| `GET /dashboard/home` with valid JWT + `?lat=21.0285&lon=105.8542` | `200` — weather reflects Hanoi coordinates |
| `GET /dashboard/home` without JWT | `401 Unauthorized` |
| Swagger at `/api/docs` | `Dashboard` tag visible; `GET /dashboard/home` shows full response schema with nested DTOs |

### Frontend

| Scenario | Expected Behaviour |
|----------|--------------------|
| Navigate to `/dashboard` — geolocation granted | Skeleton cards shown briefly; real data renders after API resolves |
| Navigate to `/dashboard` — geolocation denied | Silently uses HCMC fallback; data loads normally |
| `ootd.items.length > 0` | AI badge visible; reason quote box shown; horizontal OutfitCard grid renders |
| `ootd.items.length === 0` | Reason text shown; "Add new items" button visible; clicking navigates to `/wardrobe/add` |
| `ootd.source === 'ai'` | Badge reads "AI Pick" |
| `ootd.source === 'fallback'` | Badge reads "Suggested" |
| Weather `condition === 'Clear'` | `Sun` icon from lucide-react renders in `WeatherWidget` |
| Weather `condition === 'Rain'` | `CloudRain` icon renders |
| `recentItems` has 5 items | Horizontal scroll row renders 5 cards |
| `stats.totalValue` | Formatted as Vietnamese Dong currency |
| API returns error | Error banner shown with Retry button; clicking Retry re-triggers geolocation + API call |
| Navigate to `/dashboard` without auth | `ProtectedRoute` redirects to `/login` |
| TypeScript compilation | Zero `any` types; all props have explicit interfaces; `tsc --noEmit` passes |
| Orval types | `useGetDashboardHome` return type matches `DashboardResponseDto`; no manual type casting needed |

