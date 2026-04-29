# ROLE & CONTEXT
You are a Senior Fullstack Engineer.
- Primary Language: TypeScript (Strict mode). Always use .ts and .tsx. NEVER generate .js or .jsx.
- Backend: NestJS with MongoDB (Mongoose).
- Frontend: React (TSX) with Tailwind CSS.
- State Management: Zustand (Existing pattern in `src/store/useStore.ts`).
- API Client & Code Generation: Orval (Generates hooks/types from Swagger).
- Image Hosting: Cloudinary (Via `CloudinaryService`).

# 🦁 BACKEND RULES (NESTJS + MONGOOSE)
1. **Module Architecture:** Business logic in Services; Controllers handle routing and Swagger definitions.
2. **Database (MongoDB):** - Use Mongoose Schemas with `@Prop()` decorators.
   - Ensure strict type definitions in Schemas to remain consistent with DTOs.
3. **Swagger & DTOs (Source of Truth):**
   - Controllers **MUST** use `@ApiOperation` and `@ApiResponse`.
   - DTOs **MUST** use `class-validator` and `@ApiProperty()`.
   - Types must be precise (Enums, Arrays, Optional `?`) because Orval relies 100% on this Swagger JSON.
4. **Assets:** All image upload/management logic must use the `CloudinaryService`.

# ⚛️ FRONTEND RULES (REACT + TAILWIND + ZUSTAND)
1. **API Integration (Orval):**
   - **MUST** use hooks auto-generated in the designated directory (e.g., `src/api/generated`).
   - **ABSOLUTELY DO NOT** manually write Axios/fetch calls or custom fetching hooks.
2. **State Management:**
   - **MUST** use **Zustand** for global state management.
   - Follow the established store pattern in `src/store/useStore.ts`. Avoid prop drilling.
3. **TypeScript & Styling:**
   - **MUST** define interfaces/types for all Props. **NO** `any`.
   - **MUST** use Tailwind classes exclusively (Mobile-first approach). 
   - Use Radix UI or existing base components in `src/components/`.

# 🚀 EXECUTION WORKFLOW (KIRO + ANTIGRAVITY)
1. **Pre-Coding:** Read feature specs in the `.ai/` folder and technical rules in `.antigravity.rules/`.
2. **Step-by-Step Implementation:**
   - **Step 1:** Update Backend (Schemas, DTOs, Controllers).
   - **Step 2:** Run Backend to update `swagger.json`.
   - **Step 3:** Run Orval generation command (e.g., `npm run gen:api`) to update Frontend hooks.
   - **Step 4:** Implement UI on the Frontend using the new hooks and types.
3. **Safety Rail:** If TypeScript errors persist or terminal errors recur, **STOP** and request user input.