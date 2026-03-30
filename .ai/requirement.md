# Wardrobe Web App – Frontend Specification

## Overview
Build a modern **mobile-first wardrobe management web application** that allows users to manage clothing items such as shirts, pants, accessories, shoes, hats, etc.

The application should be designed with a **clean modern UI** and support **responsive layouts from mobile to desktop up to 2K resolution (2560px)**.

The focus of this project is **frontend only**. Backend APIs can be mocked.

Recommended stack (strict adherence):
- React (TSX, Functional Components + Hooks ONLY)
- TailwindCSS ONLY (No `.css` files, no inline styles)
- Component-based architecture
- REST API ready (API Logic contained in Custom Hooks or `api/` folder)
- Types MUST use `interface` or `type`, import from `/shared/types/`, no `any`

---

# Design Principles

### Mobile First
- Design for **mobile screens first (360px width)**
- Responsive breakpoints:
  - Mobile: < 640px
  - Tablet: 640px – 1024px
  - Desktop: 1024px – 1440px
  - Large Desktop / 2K: up to 2560px

### Navigation
- **Desktop / Tablet**
  - Left sidebar menu always visible

- **Mobile**
  - Sidebar hidden
  - Display **hamburger menu on top**

### UI Style
- Clean modern UI
- Soft shadows
- Rounded cards
- Smooth hover / click animations
- Light theme preferred

---

# Application Pages

## 1. Login Page

### Fields
- Username
- Password

### Features
- Login button
- Social login buttons
  - Login with Google
  - Login with Facebook

### Layout
Centered card containing:
- App logo
- Login form
- Social login buttons
- Link to Register page

---

## 2. Register Page

### Fields
| Field | Required |
|-----|-----|
| First Name | No |
| Last Name | Yes |
| Email | Yes |
| Username | Yes |

### Features
- Register button
- Link back to Login

### Layout
Form card centered on screen.

---

# Main Application (After Login)

## Layout Structure

### Sidebar Menu

Displayed on the **left side**.

Menu items:
- Items
- Favorites
- Add Item
- Settings
- Logout

Mobile behavior:
- Hidden by default
- Toggle using **hamburger icon**

---

# 3. Item List Screen

Display all wardrobe items as **cards in a grid layout**.

### Card Layout

Each card displays:

- Item Image
- Item Name
- Category
- Location
- Favorite Heart Icon

Example:
| IMAGE              |
| ------------------ |
| Shirt Name         |
| Category: Shirt    |
| Location: Closet A |
| ♥                  |

### Card Behavior

- Click card → navigate to **Item Detail Page**
- Click **heart icon** → toggle favorite
- Hover effect on desktop

### Add Button

Floating Action Button at **bottom right corner**

Click → navigate to **Add Item Screen**

---

# 4. Add New Item Screen

Split screen into **two sections**.

---

## Section 1 – Item Information

Fields:

| Field | Type |
|-----|-----|
| Item Name | Text |
| Color | Combobox |
| Category | Combobox |
| Description | Textarea |

Rules:
- Only **Item Name** and **Description** are free text
- Other fields must be **combobox selections**

Example UI:
Item Name: [__________]

Color: [ dropdown ]

Category: [ dropdown ]

Description:
[ textarea ]

---

## Section 2 – Item Location

User selects location hierarchy with **4 levels**
Level 1: Location
Level 2: Cabinet
Level 3: Shelf
Level 4: Box

Example UI:
Location: [ Ha Noi ▼ ]

Cabinet: [ Cabinet 1 ▼ ]

Shelf: [ Shelf 3 ▼ ]

Box: [ Box 2 ▼ ]


Selections should update dynamically.

---

# 5. Settings Screen

Settings allow users to **configure metadata used in items**.

### CRUD Configuration

User can create/update/delete:

- Category
- Color
- Item Types
- Other attributes

Example UI sections:
Item Attributes

Category
Color
Type

Each section includes:

- List of values
- Add new value
- Edit
- Delete

---

### Location Configuration

User can manage the **location hierarchy**.

Structure:
Location
└ Cabinet
    └ Shelf
        └ Box

Allow CRUD operations for each level.

---

# Components Suggestion

Suggested reusable components:

- AppLayout
- SidebarMenu
- HamburgerMenu
- ItemCard
- ItemGrid
- FloatingAddButton
- FormInput
- ComboBox
- ImageUploader
- LocationSelector
- SettingsTable

---

# State Management

Possible options:

- React Context
- Redux / Zustand
- Vue Pinia

State examples:
authUser
items[]
favoriteItems[]
categories[]
colors[]
locations[]


---

# Mock Data Structure

Example Item

```json
{
  "id": "item1",
  "name": "Blue Denim Jacket",
  "category": "Jacket",
  "color": "Blue",
  "description": "Casual jacket",
  "favorite": true,
  "location": {
    "location": "Bedroom Closet",
    "cabinet": "Cabinet A",
    "shelf": "Shelf 2",
    "box": "Box 1"
  },
  "imageUrl": "/images/jacket.jpg"
}

UI Expectations

Smooth transitions

Card hover animation

Responsive grid

Clear typography

Modern spacing

Clean icons (Heroicons / Material Icons)

Bonus Features (Optional)

Dark mode

Drag & drop image upload

Search items

Filter by category

Filter favorites

Sort by location

# Goal

- Create a clean, modern, responsive wardrobe management UI that is easy to expand with backend APIs later.

---

# Development Rules & Constraints (from RULES.md)
- **Functional Components & Hooks ONLY:** Do not use Class components.
- **Strict Types:** Props must have an `interface` or `type`. No `any` allowed. Import existing types from `/shared/types/`.
- **API Logic Separation:** API logic must be in custom hooks or the `api/` directory. UI components should only receive data.
- **Tailwind CSS ONLY:** Use Tailwind classes exclusively. Mobile-first overrides (`sm:`, `md:`). NO(`.css` files or inline styles). Extract reusable Tailwind classes into smaller components.