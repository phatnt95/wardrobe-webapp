# Feature Specification: View Outfit Detail

## 1. Task Overview

The **Wardrobe App** project requires a detail page to view previously saved outfits. 
This feature allows users to see exactly how an outfit was styled on the mannequin (Canvas) and view a detailed breakdown of all the items included in that specific outfit (metadata, total price, etc.).

**Tech Stack:** NestJS, ReactTSX, MongoDB.

---

## 2. Phase 1: Backend Update (NestJS) - Outfit Retrieval

- **Objective:** Create an API endpoint to retrieve a specific outfit by its ID, ensuring all associated clothing items are fully populated with their details (especially the `transparentImageUrl`).
- **Technical Requirements:**
    - **Endpoint:** `GET /outfits/:id`
    - **Database Query:** Use Mongoose's `.populate()` method on the `items.itemId` field. This is crucial because the `Outfit` schema only stores the reference ID and canvas coordinates. The frontend needs the item's name, brand, and images to display the detail list.
    - **Security:** Ensure the endpoint checks if the `ownerId` of the outfit matches the currently authenticated user (from the JWT payload) to prevent unauthorized access.

## 3. Phase 2: Frontend Development (ReactTSX) - Outfit Detail Screen
- **Objective:**  Build a read-only detail screen (/outfits/:id) that reconstructs the 2D Fitting Room view and lists the item details.

Interface Structure (Split View):

Left/Top Area (Canvas Reconstruction):

Display the base Model image (z-index: 10).

Read-Only Rendering: Instead of using the heavy react-rnd library (which is for editing), map through the outfit's items and render them using standard <img /> tags with inline CSS position: absolute.

Apply the saved x, y, width, height, and zIndex properties to reconstruct the exact styling.

Right/Bottom Area (Outfit Metadata & Item List):

Header: Display the Outfit Name and Creation Date.

Action Buttons: "Edit Outfit" (Navigate back to the Fitting Room with this outfit loaded) and "Delete Outfit".

Item Breakdown: A styled list or grid showing every item in the outfit. Each list item should display:

Item Thumbnail (Original image).

Item Name & Category.

Brand (if available).

Bonus calculation: Total Outfit Value (sum of the price of all items).

## 4. Output Requirements for Antigravity
Act as a Full-stack Engineer and generate the following code snippets:

NestJS (OutfitController & OutfitService):

The findOne method that retrieves the outfit, enforces user ownership, and populates the item data.

ReactTSX (OutfitDetail Component):

The split-screen UI structure using Tailwind CSS.

Data fetching logic using a custom hook (e.g., useOutfitDetail(id)).

The Canvas Reconstruction logic mapping the populated items to absolutely positioned images.

The Item List mapping to display the metadata of the clothes used.

## 5. Development Rules & Constraints (from RULES.md)
Functional Components & Hooks ONLY: Do not use Class components.

Strict Types: Props must have an interface or type. No any allowed.

Performance Optimization: Use standard HTML <img> with absolute positioning for the Canvas in this view. Do NOT use react-rnd here unless building an "Edit Mode" toggle, to save memory and rendering cycles.

API Logic Separation: API fetching must reside in a custom hook or API service file.

Tailwind CSS ONLY: Use Tailwind classes exclusively.