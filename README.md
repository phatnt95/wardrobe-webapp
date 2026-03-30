# Wardrobe Web App

A modern, mobile-first wardrobe management application built with a Monorepo architecture containing a NestJS backend and a React (TSX) frontend. The project provides comprehensive clothing item management, a dynamic outfit builder, and a 2D virtual fitting room.

## 🚀 Features

- **Clothing Management:** Full CRUD operations for detailed wardrobe items categorized by types, colors, and hierarchical storage locations.
- **Outfit Builder:** An intuitive Drag-and-Drop (D&D) interface to combine multiple clothing items into complete outfits, layered logically (headwear -> tops -> bottoms -> shoes).
- **Virtual Fitting Room:** Advanced 2D Layering Try-On module leveraging Cloudinary AI for automatic background removal and a resizable canvas to composite clothing on a model.
- **Settings & Taxonomies:** Dynamic settings module with tabs for managing custom clothing attributes (Brands, Materials) and multi-level physical storage locations (Wardrobe -> Drawer -> Box).
- **User Profiles:** Support for user measurements, style definition, secure authentication (JWT), device management, and secure password changes.

## 🛠️ Tech Stack & Architecture

This project strictly adheres to a centralized Microservices/Monolithic monorepo structure where common interfaces are shared between Frontend and Backend in `/shared/types/`.

**Frontend (ReactTSX):**
- **Library:** React (Strictly Functional Components & Hooks)
- **Styling:** Tailwind CSS (Mobile-first, no external `.css` or inline styles)
- **Typing:** Strict TypeScript (no `any`)

**Backend (NestJS):**
- **Framework:** NestJS (Node.js)
- **Database:** MongoDB via Mongoose
- **Validation & Docs:** `class-validator`, Swagger API (`@ApiOperation`, `@ApiResponse`, `@ApiProperty`)
- **Third-party:** Cloudinary (Storage & AI Background Removal)

**Infrastructure:**
- **Containerization:** Docker & Docker Compose
- **Builds:** Multi-stage builds for lightweight images
- **Reverse Proxy:** NGINX for frontend static serving

## 📁 Project Structure

```text
wardrobe-webapp/
├── back-end/               # NestJS Backend Application
│   ├── src/
│   │   ├── auth/           # Authentication modules
│   │   ├── users/          # User APIs & schema
│   │   ├── items/          # Clothing items management
│   │   ├── locations/      # Storage location hierarchy
│   │   ├── cloudinary/     # Cloudinary image services
│   │   └── ...
│   └── Dockerfile          # Backend multi-stage build image
├── front-end/              # React TSX Frontend Application
│   ├── src/
│   │   ├── api/            # Extracted custom API hooks & calls
│   │   ├── components/     # Reusable UI elements
│   │   └── ...
│   ├── Dockerfile          # Frontend UI image
│   └── nginx.conf          # Nginx configurations for reverse-proxy & routing
├── shared/
│   └── types/              # Unified DTOs and Interfaces shared by BE & FE
├── .ai/                    # AI Blueprints & Feature specs
├── .antigravity.rules/     # Enforced project code rules (RULES.md)
└── docker-compose.yml      # Orchestration for running locally
```

## 🐳 How to Run Locally (Docker)

To simplify the setup process, the entire stack can be launched via Docker Compose.

1. **Clone the repository:**
   ```bash
   git clone <repository_url>
   cd wardrobe-webapp
   ```

2. **Configure Environment Variables:**
   Create a `.env` file in the `back-end` directory and provide necessary keys:
   ```env
   PORT=3000
   MONGO_URI=mongodb://mongodb-service-name:27017/wardrobe  # Adjust based on docker service name
   JWT_SECRET=your_jwt_secret_key
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_key
   CLOUDINARY_API_SECRET=your_cloudinary_secret
   ```

3. **Run the services:**
   ```bash
   docker-compose up --build
   ```

4. **Access the application:**
   - **Frontend UI:** `http://localhost:8080` (or as configured in `docker-compose.yml`)
   - **Backend API:** `http://localhost:3000`
   - **Swagger Docs:** `http://localhost:3000/api` (or custom swagger path like /docs)

## 📜 Development Rules & Guidelines

When contributing to this project, adhere to the principles outlined in our `RULES.md`:
- Always update types in `/shared/types/` before jumping into frontend development.
- The UI MUST be kept strictly isolated from API execution logic (`api/` or custom hooks).
- Ensure strict type safety and never bypass TS compiler issues with `any`.
- Adhere exclusively to constructor-injection on the Backend.
