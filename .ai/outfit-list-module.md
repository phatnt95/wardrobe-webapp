# Frontend Development Request: OutfitCard Component (Outfit List)

## 1. Objective

Build the `OutfitCard` component using ReactTSX for the Wardrobe App project to display a summary of an outfit on the list screen.

## 2. Core Principles

- **The UI content of the new feature must be synchronized with the current UI** of the application. It is highly encouraged to reuse shadow values, border-radius, and color palettes from the existing Design System.

## 3. Component UI/UX Specifications (Pattern: Collage Card)

The component will consist of a rounded card block with 2 main sections:

### 3.1. Image Section (Image Collage Thumbnail)

- Build a dynamic image collage layout using CSS Grid to display the items that make up the outfit.
- Require writing flexible rendering logic based on the number of `items`:
    - **1 item:** Full width/height image.
    - **2 items:** Halved grid (1 column x 2 rows or 2 columns x 1 row).
    - **3 items:** 1 large image taking up 2/3 of the area on the left, 2 smaller images stacked on the right.
    - **4+ items:** 2x2 grid displaying the first 4 images.

### 3.2. Information Section (Card Body)

This area is located below the image section and includes 3 pieces of information:

1. **Title:** Name of the outfit (Font weight bold/semibold, dark color, use truncate to cut off text if it's too long).
2. **Season Badge:** \* Display the Season value of the outfit (e.g., All, Summer, Winter).
    - **Mandatory UI Spec:** Must include a Calendar/Date icon preceding the text. The entire icon and text must be wrapped in a rounded badge (`rounded-full`), with a light gray background and dark gray text (reference style: `bg-gray-100 text-gray-600`).
3. **Item Count:** Text displaying the total number of items (e.g., "3 pieces", "1 piece") with a small font size and light text color.

## 4. Output Requirements for Antigravity

Act as a Senior Frontend Engineer and generate the complete ReactTSX code:

1. Clearly define the `interface` for the component's Props (including the `items` array, `title`, and `season`).
2. Write a separate function or sub-component to handle the image grid logic (Collage) to make the code easy to maintain.
3. The code needs to be clean, include comments explaining the Grid divisions, and standardize the component according to modern React structures.

## 5. Development Rules & Constraints (from RULES.md)
- **Functional Components & Hooks ONLY:** Do not use Class components.
- **Strict Types:** Props must have an `interface` or `type`. No `any` allowed. Import existing types from `/shared/types/`.
- **API Logic Separation:** API logic must be in custom hooks or the `api/` directory. UI components should only receive data.
- **Tailwind CSS ONLY:** Use Tailwind classes exclusively. Mobile-first overrides (`sm:`, `md:`). NO `.css` files or inline styles. Extract reusable Tailwind classes into smaller components.
