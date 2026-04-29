# Feature Specification: AI Auto-Detect Items

---

## 1. Objective

Deliver the complete frontend integration for the AI-powered auto-detect wardrobe feature:
- `UploadZone` component: drag-and-drop image upload → `POST /items/auto-detect` → immediate non-blocking UI acknowledgement
- `ItemCard` real-time state machine: `processing` (shimmer skeleton) → `completed` (clear image + badges) driven by WebSocket events
- `NotificationBell` component: Socket.io listener → bounce animation + unread badge → notification dropdown with navigation
- `useNotificationStore` (Zustand): WebSocket connection lifecycle, notification list, unread count
- `useItemStore` integration: real-time `updateItem` / `removeItem` on WebSocket events

The entire backend pipeline is already implemented and requires no changes. This spec covers only the frontend layer and the Swagger/DTO gaps needed for Orval to generate correct types.

---

## 2. Technical Specs

### 2.1 Backend

#### Existing Module: `back-end/src/items/` — no changes required

The following are already fully implemented:

```
back-end/src/items/
├── items.controller.ts              ✓ POST /items/auto-detect with @ApiOperation + @ApiResponse
├── items.service.ts                 ✓ autoDetect() — Cloudinary upload + item creation + BullMQ enqueue
├── image-processing.processor.ts   ✓ BullMQ worker — Gemini → update item → ChromaDB → notify
└── dto/items.dto.ts                 ✓ AutoDetectResponseDto exists (needs verification below)
```

#### Existing Module: `back-end/src/events/` — no changes required

```
back-end/src/events/
└── events.gateway.ts   ✓ JWT auth on connect, userId room join, notifyUser()
```

#### Existing Module: `back-end/src/notifications/` — no changes required

```
back-end/src/notifications/
├── notifications.controller.ts   ✓ GET /notifications + PATCH /notifications/:id/read
├── notifications.service.ts      ✓ create(), findByUser(), markAsRead()
├── notification.schema.ts        ✓ ITEM_PROCESSED | ITEM_FAILED | INFO types
└── dto/notifications.dto.ts      ✓ NotificationDto + MarkReadDto with @ApiProperty
```

---

#### Gap: Verify `AutoDetectResponseDto` is wired to `@ApiResponse` in controller

The `autoDetect()` controller method must return a typed response for Orval to generate the correct hook return type. Confirm (and fix if missing):

```typescript
// back-end/src/items/items.controller.ts
@Post('auto-detect')
@ApiOperation({ summary: 'Auto detect item from image and process in background' })
@ApiResponse({ status: 202, type: AutoDetectResponseDto })   // ← must reference the DTO class
async autoDetect(...) { ... }
```

If `AutoDetectResponseDto` is not yet in `items.dto.ts`, add it:

```typescript
// back-end/src/items/dto/items.dto.ts
export class AutoDetectResponseDto {
  @ApiProperty({ example: 'Image queued for processing' })
  message: string;

  @ApiProperty({ example: '64a1b2c3d4e5f6a7b8c9d0e1' })
  itemId: string;
}
```

---

#### Existing Endpoints (reference — no logic changes)

**`POST /items/auto-detect`** — `multipart/form-data`, single file field `file`
- Uploads to Cloudinary → creates `Item { status: 'processing', name: 'Analyzing...' }` → enqueues BullMQ job
- Returns `202 AutoDetectResponseDto { message, itemId }`
- BullMQ job config: 5 attempts, exponential backoff (10s base), `removeOnComplete: true`

**`GET /notifications`** — JWT required
- Returns last 50 notifications for authenticated user, sorted `createdAt` desc
- Response: `NotificationDto[]`

**`PATCH /notifications/:id/read`** — JWT required
- Body: `MarkReadDto { isRead: boolean }`
- Returns updated `NotificationDto`

**WebSocket Events** (Socket.io, emitted by `EventsGateway.notifyUser`):

| Event | Payload | Trigger |
|-------|---------|---------|
| `itemCompleted` | `{ itemId: string, item: ItemDocument }` | AI analysis succeeded |
| `itemFailed` | `{ itemId: string }` | AI analysis failed after 5 retries |

**WebSocket Connection**:
- URL: same host as REST API
- Auth: `{ headers: { authorization: 'Bearer <token>' } }` in Socket.io handshake
- Server joins client to room `userId` on successful JWT verification

---

### 2.2 Frontend

#### New Files

```
front-end/src/
├── store/
│   └── useNotificationStore.ts          Zustand — WebSocket + notifications
├── components/
│   ├── upload/
│   │   └── UploadZone.tsx               Drag-and-drop auto-detect upload
│   ├── notifications/
│   │   └── NotificationBell.tsx         Nav bar bell + dropdown
│   └── items/
│       └── ItemCard.tsx                 Update: add processing/completed state machine
```

#### Modified Files

```
front-end/src/
├── store/
│   └── useItemStore.ts                  Add: updateItem(), removeItem() actions (if not present)
└── components/layout/
    └── Navbar.tsx (or equivalent)       Add: <NotificationBell /> to nav bar
```

---

#### `useNotificationStore.ts` (Zustand)

```typescript
import { create } from 'zustand'
import { io, Socket } from 'socket.io-client'
import { NotificationDto, ItemResponseDto } from '@/api/generated'
import { useItemStore } from './useItemStore'

interface NotificationState {
  notifications: NotificationDto[]
  unreadCount: number
  socket: Socket | null
  isConnected: boolean
  initSocket: (token: string) => void
  disconnectSocket: () => void
  addNotification: (n: NotificationDto) => void
  setNotifications: (ns: NotificationDto[]) => void
  markRead: (id: string) => void
  clearUnread: () => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  socket: null,
  isConnected: false,

  initSocket: (token: string) => {
    if (get().socket) return  // already connected

    const socket = io(import.meta.env.VITE_API_URL ?? 'http://localhost:3000', {
      extraHeaders: { authorization: `Bearer ${token}` },
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    })

    socket.on('connect', () => set({ isConnected: true }))
    socket.on('disconnect', () => set({ isConnected: false }))

    socket.on('itemCompleted', (data: { itemId: string; item: ItemResponseDto }) => {
      useItemStore.getState().updateItem(data.item)
      // Notification is created server-side; re-fetch or construct locally
      set((state) => ({
        unreadCount: state.unreadCount + 1,
      }))
    })

    socket.on('itemFailed', (data: { itemId: string }) => {
      useItemStore.getState().removeItem(data.itemId)
      set((state) => ({
        unreadCount: state.unreadCount + 1,
      }))
    })

    set({ socket })
  },

  disconnectSocket: () => {
    get().socket?.disconnect()
    set({ socket: null, isConnected: false })
  },

  addNotification: (n) =>
    set((state) => ({
      notifications: [n, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),

  setNotifications: (ns) =>
    set({
      notifications: ns,
      unreadCount: ns.filter((n) => !n.isRead).length,
    }),

  markRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n._id === id ? { ...n, isRead: true } : n,
      ),
    })),

  clearUnread: () => set({ unreadCount: 0 }),
}))
```

**Integration point**: Call `initSocket(token)` after successful login / on `App.tsx` mount when `isAuthenticated === true`. Call `disconnectSocket()` on logout.

---

#### `UploadZone.tsx`

Props:
```typescript
interface UploadZoneProps {
  onClose: () => void
}
```

State (local):
- `file: File | null`
- `isDragging: boolean`
- `isUploading: boolean`

Behaviour:
- Drag-and-drop area: `onDragOver` sets `isDragging: true`; `onDrop` sets `file`
- Click-to-browse: hidden `<input type="file" accept="image/*" />`
- Preview: show thumbnail of selected file before upload
- Submit button: disabled when `!file || isUploading`
- On submit:
  1. Set `isUploading: true`
  2. Build `FormData` with `file` field
  3. Call Orval hook `usePostItemsAutoDetect()` mutation
  4. On success (202): call `onClose()` + `toast.success('AI is analyzing your item...')` + `useItemStore.getState().addItem({ _id: data.itemId, status: 'processing', name: 'Analyzing...' } as ItemResponseDto)`
  5. On error: `toast.error('Upload failed. Please try again.')` + set `isUploading: false`

Tailwind layout:
```
border-2 border-dashed border-gray-300 rounded-xl p-8 text-center
hover:border-purple-400 transition-colors cursor-pointer
isDragging → border-purple-500 bg-purple-50
```

---

#### `NotificationBell.tsx`

State (from `useNotificationStore`):
- `notifications`, `unreadCount`, `clearUnread`, `markRead`

Local state:
- `isOpen: boolean`

Behaviour:
- Bell icon (`Bell` from lucide-react) with red badge showing `unreadCount` when > 0
- Badge animation: CSS `animate-bounce` triggered when `unreadCount` increases (use `useEffect` comparing previous count)
- Click bell: toggle `isOpen`; when opening call `clearUnread()`; call `useGetNotifications()` Orval hook to re-sync from server → `setNotifications(data)`
- Dropdown: absolute positioned below bell, `z-50`, max-height with scroll
- Each notification row:
  - Title (bold), message (truncated), relative time (`createdAt`)
  - Unread: `bg-purple-50` background
  - Click: `navigate(notification.linkTarget)` + call `usePatchNotificationsIdRead()` Orval mutation with `{ isRead: true }` + `markRead(notification._id)`
- Empty state: "No notifications yet"
- Click outside: close dropdown (use `useRef` + `mousedown` listener)

Tailwind layout:
```
relative inline-flex items-center justify-center
// Badge: absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs
// Dropdown: absolute right-0 top-10 w-80 bg-white rounded-xl shadow-lg border
```

---

#### `ItemCard.tsx` — state machine update

Props:
```typescript
interface ItemCardProps {
  item: ItemResponseDto
}
```

Rendering logic:

```typescript
// Processing state
if (item.status === 'processing') {
  return (
    <div className="relative rounded-xl overflow-hidden aspect-square bg-gray-100">
      {/* Shimmer skeleton */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer" />
      {/* Blur overlay */}
      <div className="absolute inset-0 backdrop-blur-sm bg-white/30 flex flex-col items-center justify-center gap-2">
        <Sparkles className="w-8 h-8 text-purple-500 animate-pulse" />
        <span className="text-xs text-purple-600 font-medium">AI Analyzing...</span>
      </div>
    </div>
  )
}

// Completed state (default)
return (
  <div className="rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer"
       onClick={() => navigate(`/items/${item._id}`)}>
    <div className="aspect-square overflow-hidden">
      <img src={item.images[0] ?? '/placeholder.png'} alt={item.name}
           className="w-full h-full object-cover" />
    </div>
    <div className="p-3">
      <p className="font-medium text-sm truncate">{item.name}</p>
      <div className="flex gap-1 mt-1 flex-wrap">
        {item.category && (
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
            {(item.category as MetadataRefDto).name}
          </span>
        )}
        {item.color && (
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            {item.color}
          </span>
        )}
      </div>
    </div>
  </div>
)
```

**Real-time transition**: The component re-renders automatically when `useItemStore.updateItem(item)` is called by `useNotificationStore`'s `itemCompleted` handler — no additional subscription needed if `ItemCard` reads directly from the store or receives `item` as a prop from a parent that reads the store.

---

#### `useItemStore.ts` — required actions

Ensure these actions exist (add if missing):

```typescript
interface ItemState {
  items: ItemResponseDto[]
  addItem: (item: ItemResponseDto) => void
  updateItem: (item: ItemResponseDto) => void
  removeItem: (id: string) => void
  setItems: (items: ItemResponseDto[]) => void
}

// updateItem: replace item by _id
updateItem: (item) => set((state) => ({
  items: state.items.map((i) => i._id === item._id ? item : i),
})),

// removeItem: filter out by _id
removeItem: (id) => set((state) => ({
  items: state.items.filter((i) => i._id !== id),
})),
```

---

#### Orval-generated hooks used

| Hook | Endpoint | Used in |
|------|----------|---------|
| `usePostItemsAutoDetect` | `POST /items/auto-detect` | `UploadZone` |
| `useGetNotifications` | `GET /notifications` | `NotificationBell` (on open) |
| `usePatchNotificationsIdRead` | `PATCH /notifications/:id/read` | `NotificationBell` (on click) |

---

## 3. Execution Steps

### Task 1: Backend — Verify Swagger completeness

1. Open `back-end/src/items/dto/items.dto.ts`
   - Confirm `AutoDetectResponseDto` class exists with `@ApiProperty` on both `message` and `itemId`
   - If missing, add it (see Gap section above)

2. Open `back-end/src/items/items.controller.ts`
   - Confirm `autoDetect()` has `@ApiResponse({ status: 202, type: AutoDetectResponseDto })`
   - If the `type` is missing or points to a raw description string, update it to reference the DTO class

3. Run backend: `cd back-end && npm run start:dev`
   - Verify Swagger at `http://localhost:3000/api/docs`
   - Confirm `POST /items/auto-detect` shows `AutoDetectResponseDto` schema with `message` + `itemId`
   - Confirm `GET /notifications` shows `NotificationDto[]` response schema
   - Confirm `PATCH /notifications/:id/read` shows `NotificationDto` response schema

### Task 2: Orval Generation

4. Run Orval: `npm run gen:api` (from `front-end/` directory)
   - Confirm generated hooks include: `usePostItemsAutoDetect`, `useGetNotifications`, `usePatchNotificationsIdRead`
   - Confirm `AutoDetectResponseDto` type is generated with `message: string` and `itemId: string`
   - Confirm `NotificationDto` type is generated with all fields including `createdAt`

### Task 3: Frontend — Stores

5. Open `front-end/src/store/useItemStore.ts`
   - Verify `updateItem(item: ItemResponseDto)` and `removeItem(id: string)` actions exist
   - If missing, add them (see spec above)

6. Create `front-end/src/store/useNotificationStore.ts`
   - Implement Zustand store with Socket.io connection lifecycle (see spec above)
   - Import `useItemStore` for cross-store calls on WebSocket events

### Task 4: Frontend — Components

7. Create `front-end/src/components/upload/UploadZone.tsx`
   - Drag-and-drop + click-to-browse with image preview
   - Calls `usePostItemsAutoDetect()` on submit
   - On 202: `onClose()` + toast + `useItemStore.addItem({ status: 'processing' })`

8. Update `front-end/src/components/items/ItemCard.tsx`
   - Add `status === 'processing'` branch: shimmer skeleton + blur overlay + `Sparkles` icon
   - Ensure `status === 'completed'` branch shows image + name + category/color badges
   - No action buttons (edit/delete/favorite) when `status === 'processing'`

9. Create `front-end/src/components/notifications/NotificationBell.tsx`
   - Bell icon + red badge with `unreadCount`
   - Bounce animation on new notification
   - Dropdown with notification list; click → navigate + mark read
   - On open: call `useGetNotifications()` to re-sync from server

### Task 5: Frontend — Integration

10. Update `front-end/src/App.tsx` (or auth success handler):
    - After login success: call `useNotificationStore.getState().initSocket(token)`
    - On logout: call `useNotificationStore.getState().disconnectSocket()`

11. Update `front-end/src/components/layout/Navbar.tsx` (or equivalent nav component):
    - Import and render `<NotificationBell />` in the nav bar

12. Verify `UploadZone` is rendered inside the add-item modal or wherever the upload trigger exists
    - Pass `onClose` prop that closes the parent modal

---

## 4. Validation

### Backend

| Test | Expected Result |
|------|----------------|
| `POST /items/auto-detect` with valid image | `202 { message: 'Image queued for processing', itemId: '<ObjectId>' }` |
| `POST /items/auto-detect` without file | `404 { message: 'No file provided' }` |
| `POST /items/auto-detect` without auth | `401 Unauthorized` |
| Item in DB immediately after `POST /items/auto-detect` | `status: 'processing'`, `name: 'Analyzing...'`, `images[0]` is Cloudinary URL |
| After BullMQ job completes | Item in DB has `status: 'completed'`, `name` populated, all attribute refs set |
| After BullMQ job fails (all retries) | Item deleted from DB; notification with `type: 'ITEM_FAILED'` created |
| `GET /notifications` with valid token | `200 NotificationDto[]` sorted by `createdAt` desc |
| `GET /notifications` with another user's token | `200 []` — empty, not other user's notifications |
| `PATCH /notifications/:id/read` `{ isRead: true }` | `200 NotificationDto` with `isRead: true` |
| `PATCH /notifications/:id/read` wrong user | `404 Notification not found` |
| WebSocket connect with valid JWT | Client joins userId room; server logs connection |
| WebSocket connect with invalid JWT | Connection rejected; `connect_error` on client |
| Swagger `POST /items/auto-detect` | Shows `AutoDetectResponseDto` schema with `message` + `itemId` |

### Frontend

| Scenario | Expected Behaviour |
|----------|--------------------|
| Drop image onto `UploadZone` | File preview shown; submit button enabled |
| Click submit in `UploadZone` | Button disabled; `POST /items/auto-detect` called with `FormData` |
| `POST /items/auto-detect` returns 202 | Modal closes; toast "AI is analyzing your item..." shown; processing card appears in grid |
| Processing `ItemCard` in grid | Shimmer gradient + blur overlay + `Sparkles` icon; no edit/delete buttons |
| WebSocket `itemCompleted` received | `ItemCard` transitions to completed state (clear image + badges) without page reload |
| WebSocket `itemFailed` received | Processing card disappears from grid |
| `NotificationBell` on `itemCompleted` | Badge increments; bell bounces |
| `NotificationBell` on `itemFailed` | Badge increments; bell bounces |
| Click `NotificationBell` | Dropdown opens; `GET /notifications` called; unread count cleared |
| Click notification in dropdown | Navigate to `linkTarget`; notification marked as read |
| App reload after login | `initSocket(token)` called; WebSocket reconnects |
| Logout | `disconnectSocket()` called; socket closed |
| Upload without selecting file | Submit button remains disabled |
| Upload with non-image file | File rejected; error shown in `UploadZone` |
| TypeScript compilation | Zero `any` types; all props have explicit interfaces; no TS errors |
| All API requests | `Authorization: Bearer <token>` header present via Axios interceptor |
