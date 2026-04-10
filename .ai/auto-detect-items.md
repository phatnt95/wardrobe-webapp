# 📋 Feature Specification: AI-Powered Auto-Tagging, Async Workflow & UI Implementation

## 1. Overview
**Objective:** Automatically extract clothing information (Category, Color, Style, Occasions, SeasonCode, SleeveLength, Neckline, Brand, Shoulder, Size) from uploaded images using the Gemini Vision API.
**Problem Solved:** Optimize User Experience (UX). Users only need to upload an image without manually filling out forms, and absolutely do not have to wait at a loading screen while the AI analyzes the image.
**Core Technology:** NestJS (Backend), React (Frontend), Redis + BullMQ (Background Jobs), WebSockets (Real-time Notifications), Gemini API (Vision).

---

## 2. Sequence Flow
1. **Upload:** The user selects an image on the UI and submits the upload request.
2. **Acknowledge:** The backend temporarily saves the image, creates a new database record with a 'processing' status, and immediately returns a success response (HTTP 202 Accepted) to unblock the UI.
3. **Enqueue:** The backend pushes a job (containing the image path/URL and related info) into the Message Queue.
4. **Process:** A background worker picks up the job and calls the Gemini API to analyze the image. Upon receiving the result, it updates the record to a 'completed' status along with the extracted clothing attributes.
5. **Notify:** The backend emits a WebSocket event specifically routed to that user.
6. **Update UI:** The frontend receives the WebSocket signal, triggers a bell notification, and updates the display status of the item.

---

## 3. Data Architecture

### 3.1. Wardrobe Item Schema Update
- Add a status field to identify whether the item is processing, completed, or failed.
- Detailed attribute fields (name, category, color, occasions, style) are allowed to be empty initially and will be automatically populated by the AI upon completion.

### 3.2. Notification Schema Addition
- Design a table to store notification history including: user ID, notification type, title, message content, read/unread status, and a direct URL link to the details of the newly analyzed item.

---

## 4. Backend Implementation (NestJS)

### 4.1. Queue & Background Worker Setup
- Configure Redis and BullMQ to create an image processing queue.
- Inside the Worker, define strict Prompt Engineering requiring the Gemini AI to return a pure, standardized text structure, excluding redundant formatting characters, ensuring accurate extraction of the name, category, color, and usage occasions.

### 4.2. WebSocket Gateway Initialization
- Establish a real-time communication channel.
- Manage rooms based on individual user IDs to ensure notifications are strictly routed to the correct owner of the analyzed item.

---

## 5. Frontend UI/UX Implementation (React)
*Core Technical Requirements: Modular component architecture, clear TypeScript Interfaces for Props/State, Mobile-first design priority, use Tailwind CSS for styling, and lucide-react for icons.*

### 5.1. UploadZone Component
- **Role:** Handle drag-and-drop or image file selection.
- **Behavior:** Immediately disable the upload button upon click. Upon receiving the server's acknowledgment response, instantly close the upload modal and display a Toast notification indicating that the AI is processing in the background. Absolutely do not block other user interactions on the page.

### 5.2. NotificationBell Component
- **Role:** Alert bell located in the top navigation bar.
- **Behavior:** Listen to the WebSocket channel. When a new notification arrives, trigger a bounce animation and increment the red badge count. Clicking the bell reveals the history dropdown list. Allow users to click individual notifications to directly open the corresponding item's detail card to review the AI's results.

### 5.3. ItemCard Component (Skeleton Handling)
- **Role:** Display individual items in a grid layout.
- **State Behaviors:**
  - *Processing State:* Overlay the image with a blur and a Shimmering/Skeleton gradient effect. Display a 'Sparkles' icon indicating active AI scanning. Temporarily hide or disable edit/delete buttons to protect data integrity.
  - *Completed State:* Display the clear image, item name, and classification badges. Re-enable all action buttons.
  - *Real-time Update:* The component seamlessly transitions from the Skeleton UI to the Completed UI the instant it receives the WebSocket completion signal.