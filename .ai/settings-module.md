# Frontend Development Request: Building the Settings Module

## 1. Task Overview

- **Project:** Wardrobe App (Frontend: ReactTSX)
- **Objective:** Build the interface for the **Settings** module with 2 sub-menus: **CRUD Attribute** and **CRUD Location**.
- **System Status:** The entire Backend API for these CRUD functionalities has been fully developed. The current task is solely focused on modifying and integrating the Frontend logically and optimizing the UX.
- **Ultimate Design Principle:** The UI content of the new feature must be synchronized with the current UI. It is mandatory to reuse the shared component systems (such as Table, Button, Modal, Tabs, Input) and strictly adhere to the application's Design System.

## 2. Routing & Menu Structure

Add a **Settings** item to the Sidebar/Navigation menu, expanding into 2 sub-menus:

- `/settings/locations`: Manage storage locations.
- `/settings/attributes`: Manage clothing classification attributes.

## 3. Interface & Functional Specifications

### 3.1. Sub-menu: CRUD Location (Location Management)

- **Functionality:** Manage physical storage locations (e.g., Wardrobe 1, Secondary Drawer, Winter Storage Box...).
- **Required Interface:**
    - Render a list (Table or Grid/Card, depending on the app's current pattern) displaying the locations.
    - Fully integrate actions: Create, Read, Update, Delete.
    - Use the project's unified Modal form for Add/Edit operations to ensure a seamless experience.

### 3.2. Sub-menu: CRUD Attribute (Attribute Management)

- **Functionality:** Manage dictionary values for clothing attributes (e.g., Color, Material, Brand, Fit...).
- **Required Interface (Tabs Structure):**
    - Do not spread all attributes across a single page. It is necessary to use a **Tabs** component to separate the screen.
    - Each type of Attribute (Color, Material, Brand...) will act as a Tab.
    - **Internal Tab Logic:** When a user clicks on any Tab, the screen below that Tab will render a List/Table interface along with specific CRUD buttons (Add, Edit, Delete) for the values of that Attribute.
    - Switching Tabs will trigger a hook to call the corresponding API to fetch the new data list from the Backend.

## 4. Output Requirements for Antigravity

Act as a Senior Frontend Engineer and generate the following ReactTSX code snippets:

1. **Routing Configuration:** The code snippet setting up routes for `/settings`, `/settings/locations`, and `/settings/attributes`.
2. **Layout & Menu Component:** Update the menu UI to display the 2 new sub-menus.
3. **`LocationManager` Component:** Completely handle the API call logic and UI rendering for the Location section.
4. **`AttributeManager` Component:** Reasonably restructure, using Dynamic Rendering for the Tabs section. Create a shared `AttributeCrudTable` component and pass the `attributeType` (id or name of the tab) as props to reuse the CRUD UI for every Tab, making the code concise and easy to maintain.

## 5. Development Rules & Constraints (from RULES.md)
- **Functional Components & Hooks ONLY:** Do not use Class components.
- **Strict Types:** Props must have an `interface` or `type`. No `any` allowed. Import existing types from `/shared/types/`.
- **API Logic Separation:** API logic must be in custom hooks or the `api/` directory. UI components should only receive data.
- **Tailwind CSS ONLY:** Use Tailwind classes exclusively. Mobile-first overrides (`sm:`, `md:`). NO `.css` files or inline styles. Extract reusable Tailwind classes into smaller components.
