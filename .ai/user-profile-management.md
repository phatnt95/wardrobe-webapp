# Feature Specification: User Profile Management

> Requirements specification and technical design document for the User Profile Management module of the Wardrobe App project. The system is built on a Microservices architecture using NestJS, ReactTSX, MongoDB, and Docker.

---

## 1. UI/UX Requirements

The prerequisite for this entire feature is that **the UI of the new feature must be synchronized with the current UI** of the application.

- **Component Reusability:** It is mandatory to reuse the React components already built for the wardrobe management section (e.g., `TextInput`, `PrimaryButton`, `Modal`, `ImageUploader` components).
- **Consistency:** The color palette, typography, and loading/error states must strictly adhere to the Design System currently applied to the entire project.
- **Responsiveness:** Ensure proper display across both wide Web interfaces and various mobile device screen sizes.

---

## 2. Feature Specifications

Below is a detailed list of features to be developed, specifically categorized by purpose and priority level.

| Feature Group         | Feature Name      | Detailed Description                                                                                                       | Priority Level |
| :-------------------- | :---------------- | :------------------------------------------------------------------------------------------------------------------------- | :------------- |
| **Basic Information** | Identity Editing  | Update full name, phone number, date of birth, and a short bio.                                                            | High           |
| **Basic Information** | Avatar Management | Upload, crop, and change the profile picture. Image data is saved via a cloud storage service.                             | High           |
| **Personalization**   | Body Measurements | Store height, weight, and body measurements (chest, waist, hips) to support the logic for suggesting well-fitting outfits. | Medium         |
| **Personalization**   | Style Definition  | Select favorite styles (Casual, Streetwear, Office) and a personal color palette.                                          | Medium         |
| **Security**          | Change Password   | Require the old password before changing to a new one. Support the password recovery process.                              | High           |
| **System**            | Device Management | View the list of active login sessions across devices and allow remote logout.                                             | Low            |

---

## 3. Data Design (MongoDB Schema)

User data will be managed centrally in the `User Service`. Below is the proposed schema structure using Mongoose within the NestJS framework:

---

## 4. Development Rules & Constraints (from RULES.md)
- **React Architecture:** Use Functional Components & Hooks (NO Class Components). API logic must be decoupled strictly from UI, typically placed in custom hooks or an `api/` directory.
- **TypeScript & Props:** Props must be explicitly typed using `interface` or `type`. No `any` type is allowed. Enforce importing DTOs/types from the shared `/shared/types/` directory.
- **Tailwind CSS Styling:** Mandatory to use Tailwind classes ONLY. Avoid `.css` files and inline styles. If redundant styling classes appear, refactor them into reusable structural UI components. Mobile-first overrides (sm:, md:).
- **Backend Sync:** Ensure any modifications or new schema data reflect the interfaces in `/shared/types/` synchronously.
