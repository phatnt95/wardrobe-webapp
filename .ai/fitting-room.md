# Feature Specification: Automatic Background Removal & 2D Fitting Room

## Task Overview

The **Wardrobe App** project (Microservices Architecture: NestJS, ReactTSX) needs to develop a virtual try-on feature using a **2D Layering** approach.
Prerequisite: **The UI content of the new feature must be synchronized with the current UI** of the application.

The development process is divided into 2 phases:

---

## Phase 1: Update Backend (NestJS) - Background Removal with Cloudinary

- **Objective:** Update the current image upload service (using Cloudinary) to automatically remove the background when a user uploads a new clothing item.
- **Technical Requirements:**
    - Add the parameter `background_removal: "cloudinary_ai"` (or the corresponding registered addon on Cloudinary) to the upload function of the Cloudinary Node.js library.
    - Configure the parameter so the returned image must strictly be in a format that supports transparency (e.g., `format: "png"`).
    - Ensure the NestJS API returns the URL of the successfully background-removed image to be saved in MongoDB.

---

## Phase 2: Frontend Development (ReactTSX) - Fitting Room Screen

- **Objective:** Build a screen that allows users to composite background-removed clothing items onto a fixed Model image (mannequin or human figure).
- **Interface Structure (Split View):**
    1. **Preview Area (Left/Center):** \* Display the Model image at the bottom layer.
        - This area acts as a "Canvas". Selected items will be overlaid on the Model using CSS `position: absolute` and controlled by `z-index` (e.g., Model z-index: 10, Pants z-index: 20, Shirt z-index: 30, Jacket z-index: 40).
        - Mandatory integration of a drag-and-drop and resizable library (such as `react-rnd` - React Resize and Drag) for each item so users can adjust the scale and position of the clothing to fit the Model perfectly.
    2. **Item Selection Area (Right Sidebar or Bottom Sheet):**
        - Reuse the **Tabs** structure created in the Settings module. Each Tab represents a Category (Tops, Bottoms, Shoes, Accessories, etc.).
        - Inside each Tab is a Grid list of the user's items belonging to that category.
        - When an item is clicked, it will be "mounted" onto the Preview area.

## Output Requirements for Antigravity

Act as a Full-stack Engineer and generate the following code snippets:

1. **NestJS (`CloudinaryService`):** The logic code for the upload function that receives a file buffer and calls the Cloudinary API with the background removal parameter, returning a transparent PNG URL.
2. **ReactTSX (`FittingRoom` Component):** \* Split-screen Layout structure.
    - State Management logic (using `useState` or a custom hook) to manage the array/object of items currently selected to be worn on the Model.
    - The code rendering the "Canvas" part using `react-rnd` to wrap the item images, allowing them to be dragged, dropped, and resized over the Model background.
3. Include clear comments explaining the z-index configuration and how the drag-and-drop functionality works.

## 4. Development Rules & Constraints (from RULES.md)
- **Functional Components & Hooks ONLY:** Do not use Class components.
- **Strict Types:** Props must have an `interface` or `type`. No `any` allowed. Import existing types from `/shared/types/`.
- **API Logic Separation:** API logic must be in custom hooks or the `api/` directory. UI components should only receive data.
- **Tailwind CSS ONLY:** Use Tailwind classes exclusively. Mobile-first overrides (`sm:`, `md:`). NO(`.css` files or inline styles). Extract reusable Tailwind classes into smaller components.
- **Backend Sync:** Ensure any modifications or new schema data reflect the interfaces in `/shared/types/` synchronously.
