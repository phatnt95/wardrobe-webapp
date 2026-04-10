# Feature Specification: Bulk Import Items & Export Template

## 1. Task Overview

The **Wardrobe App** requires a bulk data entry feature to help users quickly populate their virtual closet without manually creating each item one by one. 
This task focuses on updating the **Item List** screen to include two new actions: downloading a predefined Excel template and uploading the filled template to import multiple items at once.

**Tech Stack:** ReactTSX, Tailwind CSS, Axios.

---

## 2. UI/UX Design & Layout Update

- **Target Screen:** `ItemList` (or the Header/Toolbar section of the Inventory page).
- **Placement:** The new buttons should be placed in the primary action area, typically aligned to the right next to the "Add New Item" (Tạo mới) button.
- **Components Needed:**
    1. **Export Template Button:** - **Style:** Secondary or Outline button.
        - **Icon:** Download icon (`FiDownload` or similar).
        - **Label:** "Tải mẫu Excel" (Export Template).
        - **Action:** Triggers a direct download of the `.xlsx` template file from the backend or public folder.
    2. **Import Item Button:**
        - **Style:** Secondary or Outline button (to avoid competing with the primary "Add New Item" button).
        - **Icon:** Upload icon (`FiUpload` or similar).
        - **Label:** "Nhập từ Excel" (Import Items).
        - **Action:** Opens a hidden `<input type="file" />` or triggers a Modal containing a drag-and-drop file upload zone.

---

## 3. Frontend Implementation Details (ReactTSX)

### 3.1. File Upload Logic
- Must restrict accepted file types to Excel formats: `accept=".xlsx, .xls, .csv"`.
- Implement a loading state (spinner on the button or a full-screen overlay) because processing and validating an Excel file with hundreds of rows might take a few seconds.

## 4. Backend API Contract (Reminder)
- To support this UI, the NestJS Backend (Inventory Service) must expose the following endpoints:

- GET /items/export-template:

- Returns a binary stream of an Excel file containing headers (Name, Description, Price, Brand, Category, etc.) and a few instructional sample rows.

- POST /items/import:

- Consumes multipart/form-data.

- Parses the uploaded Excel file, maps text values to ObjectIds (for metadata like Brands/Categories), and performs a bulk insert.

## 5. Development Rules & UX Constraints
- Responsive Design: On mobile screens, the buttons should stack or use only icons to save space, utilizing Tailwind's responsive prefixes (e.g., sm:flex-row).

- Error Feedback: If the backend validation fails (e.g., missing mandatory fields in the Excel file), the frontend must display a clear toast notification or modal detailing which rows failed, rather than a generic error message.

- State Cleanup: Always reset the input[type="file"] value after an upload attempt. If a user uploads data.xlsx, gets an error, fixes it, and tries to upload data.xlsx again, the browser won't trigger the onChange event if the value isn't cleared.