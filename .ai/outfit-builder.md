# Feature Analysis and Development: Outfit Builder with Drag-and-Drop UX & Categorized Layout

## 1. Project Context

The project is a Wardrobe Management Application structured as a Monorepo.

- **Frontend:** React (TSX), utilizing functional components and hooks.
- **Backend:** NestJS.
- **Database:** MongoDB.
- **Current Features:** The system already has CRUD functionality for `ClothingItem` (managing individual items like tops, bottoms, shoes, and accessories). Each item has fields such as `_id`, `name`, `category`, `imageUrl`, etc.

## 2. New Feature Description: Outfit Builder (D&D Interface)

I need to build an "Outfit Builder" feature that allows users to create a complete outfit by combining existing `ClothingItem`s from their wardrobe using a modern **Drag-and-Drop (D&D)** interface.

**User Flow:**

1. The user navigates to the "Create Outfit" page.
2. The screen is divided into two main sections: one side displays the list of available items (filterable by category: Top, Bottom, Shoes, etc.), and the other side is a "Canvas/Preview Board" acting as the drop zone.
3. The user **drags** items from the list and **drops** them onto the Canvas/Preview Board.
4. Dropped items are rendered on the canvas. The canvas must **automatically arrange** the dropped items vertically in a logical human-wearing order: Hat/Headwear at the top, Shirt/Top in the middle, and Pants/Bottom and Shoes at the bottom.
5. The user inputs a name for the Outfit (e.g., "Winter Workwear"), selects a Season, or adds Tags.
6. The user clicks "Save" to store the Outfit in the database.

## 3. Backend Requirements (NestJS)

Please execute the following steps and provide the code for each part:

- **Step 1: Database Schema & Entity**
    - Create a Mongoose Schema and Entity for `Outfit`.
    - Proposed structure: `name` (string), `description` (string, optional), `items` (array of ObjectIds referencing `ClothingItem`), `tags` (array of strings), `season` (enum: Spring, Summer, Autumn, Winter, All).
- **Step 2: DTOs**
    - Create `CreateOutfitDto` and `UpdateOutfitDto` with comprehensive `class-validator` decorators and `@ApiProperty()` for Swagger.
- **Step 3: Service & Controller**
    - Write `OutfitService` to handle business logic: create, findAll (with populated details of `ClothingItem`), findOne, update, delete.
    - Write `OutfitController` to expose the corresponding RESTful APIs. MANDATORY: All endpoints MUST include `@ApiOperation` and `@ApiResponse`.

## 4. Frontend Requirements (ReactTSX)

Please execute the following steps and provide the code. Use the `@dnd-kit/core` library (or similar modern D&D library) for the dragging logic.

- **Step 1: Types/Interfaces**
    - Define `IOutfit` and `CreateOutfitPayload` interfaces synchronized with the Backend. MANDATORY: These types MUST be defined in `/shared/types/` and imported into Frontend/Backend. No `any` types allowed.
- **Step 2: API Integration**
    - Update the API service file (using Axios) to add functions for creating and fetching Outfits. MANDATORY: API calling logic must be kept separate from UI components (use custom hooks or `api/` directory).
- **Step 3: UI Components & UX Rules**
    - Set up the D&D context provider. **Crucial:** Ensure you configure the appropriate sensors (MouseSensor, TouchSensor) so the drag-and-drop works seamlessly on both desktop and mobile devices.
    - Create a component for a **Draggable** item in the source list.
    - **Droppable Canvas (Categorized Layout):**
        - The Canvas/Preview Board must act as a droppable zone.
        - Internally, the Canvas must **sort and render** the items in `selectedItems` vertically based on their `category`. You must implement a rendering order:
            1. **Top Zone:** Headwear/Hats.
            2. **Middle Zone:** Tops/Shirts/Jackets.
            3. **Bottom Zone:** Bottoms/Pants/Skirts followed by Shoes.
    - **Responsive Design (CRITICAL):** The layout must be fully responsive. The two-column layout (item list and canvas) should elegantly stack into a single column on mobile screens. Ensure the canvas remains usable and visually appealing on smaller viewports.
    - **UI/UX Consistency:** Ensure the new UI seamlessly integrates with the application's existing design system. Reuse existing common components and strictly follow the current styling architecture using Tailwind CSS (MANDATORY: NO styled-components, `.css` files, or inline styles).
    - Include a mechanism (like a trash icon or a remove button on hover) for items in the current build board in case the user changes their mind.
    - Handle form submission to call the API to save the Outfit.

## 5. Output Requirements

- Provide the code file by file clearly, indicating the file path as a comment (e.g., `// backend/src/outfit/outfit.service.ts`).
- Adhere to Clean Code principles and strict TypeScript typing.
- No need to write Unit Tests for now. Start by generating the Backend code first. Once that is complete and I have reviewed it, we will proceed to the Frontend.
