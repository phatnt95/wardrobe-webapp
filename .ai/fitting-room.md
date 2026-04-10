Feature Specification: Automatic Background Removal & 2D Fitting Room
Task Overview
The Wardrobe App project (Microservices Architecture: NestJS, ReactTSX) needs to develop a virtual try-on feature using a 2D Layering approach.
Prerequisite: The UI content of the new feature must be synchronized with the current UI of the application.

The development process is divided into 2 phases:

Phase 1: Update Backend (NestJS) - Background Removal & Storage Optimization
Objective: Update the current image upload service (using Cloudinary) to automatically remove the background and optimize the image size when a user uploads a new clothing item. Establish the database schema for saving outfits.

Technical Requirements:

Add the parameter background_removal: "cloudinary_ai" (or the corresponding registered addon on Cloudinary) to the upload function of the Cloudinary Node.js library.

Configure the parameter so the returned image must strictly be in a format that supports transparency (e.g., format: "png").

[NEW] Image Resizing: Add transformation parameters (e.g., transformation: [{ width: 800, height: 800, crop: "limit", quality: "auto" }]) to resize and compress the image during the upload process. This optimizes cloud storage and ensures smooth performance on the frontend Canvas.

Ensure the NestJS API returns the URL of the successfully background-removed image to be saved in MongoDB.

[NEW] Outfit Persistence Schema: Create a new endpoint and MongoDB schema (OutfitSchema) to save user-generated outfits. This schema must store the itemId along with its exact spatial properties on the canvas (x, y, width, height, and z-index) to serve the "View Outfit" functionality later.

Phase 2: Frontend Development (ReactTSX) - Fitting Room Screen
Objective: Build a screen that allows users to composite background-removed clothing items onto a fixed Model image (mannequin or human figure), and save these combinations as complete outfits.

Interface Structure (Split View):

Preview Area (Left/Center):

Display the Model image at the bottom layer.

This area acts as a "Canvas". Selected items will be overlaid on the Model using CSS position: absolute and controlled by z-index (e.g., Model z-index: 10, Pants z-index: 20, Shirt z-index: 30, Jacket z-index: 40).

Mandatory integration of a drag-and-drop and resizable library (such as react-rnd - React Resize and Drag) for each item so users can adjust the scale and position of the clothing to fit the Model perfectly.

Item Selection Area (Right Sidebar or Bottom Sheet):

Allow filter by category.

Inside each Tab is a Grid list of the user's items belonging to that category.

When an item is clicked, it will be "mounted" onto the Preview area.

[NEW] Outfit Management (Save & View):

Save Mode: Implement a "Save Outfit" action that captures the current state of the Canvas. It must extract the x, y, width, height, and z-index of every active item and send this payload to the Backend.

View Mode: Ensure the Canvas can be initialized with pre-saved outfit data. When viewing an outfit, react-rnd components must be populated with their saved coordinates and dimensions to reconstruct the exact look.

Output Requirements for Antigravity
Act as a Full-stack Engineer and generate the following code snippets:

NestJS (CloudinaryService & OutfitService): - The logic code for the upload function that receives a file buffer, resizes it, and calls the Cloudinary API with the background removal parameter, returning a transparent PNG URL.

A brief MongoDB schema example demonstrating how to store the Outfit with its item positions (x, y, width, height, z-index).

ReactTSX (FittingRoom Component):

Split-screen Layout structure.

State Management logic (using useState or a custom hook) to manage the array/object of items currently selected to be worn on the Model, explicitly tracking their coordinates and sizes (e.g., onDragStop, onResizeStop).

The code rendering the "Canvas" part using react-rnd to wrap the item images.

A function handler simulating the "Save Outfit" payload generation.

Include clear comments explaining the z-index configuration, the drag-and-drop state tracking, and how the payload is structured for saving.

4. Development Rules & Constraints (from RULES.md)
Functional Components & Hooks ONLY: Do not use Class components.

Strict Types: Props must have an interface or type. No any allowed.

API Logic Separation: API logic must be in custom hooks or the api/ directory. UI components should only receive data.

Tailwind CSS ONLY: Use Tailwind classes exclusively. Mobile-first overrides (sm:, md:). NO(.css files or inline styles). Extract reusable Tailwind classes into smaller components.

Backend Sync: Ensure any modifications or new schema data reflect the interfaces in /shared/types/ synchronously.
