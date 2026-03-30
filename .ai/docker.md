# Prompt: Dockerize Monorepo Wardrobe App (NestJS & ReactTS)

## Context

- **Project Name:** Wardrobe Management App
- **Architecture:** Monorepo (BE & FE in the same repository)
- **Tech Stack:** - Backend: NestJS (Node.js)
    - Frontend: ReactTSX (Vite/CRA)
    - Database: MongoDB (Already running on host/external)
- **Goal:** Create Docker configuration to run both services locally for development and testing.

## Instructions for AI

Please generate the following Docker configuration files based on the requirements below:

### 1. Backend (NestJS) - `/backend/Dockerfile`

- Use `node:20-alpine` as the base image.
- Implement a **multi-stage build**:
    - **Stage 1 (Build):** Install dependencies, copy source code, and run `npm run build`.
    - **Stage 2 (Production):** Copy only `dist`, `node_modules`, and `package.json` to keep the image slim.
- Default port: `3000`.
- Ensure it can handle environment variables for MongoDB connection.

### 2. Frontend (ReactTSX) - `/frontend/Dockerfile` & `nginx.conf`

- Use a **multi-stage build**:
    - **Stage 1 (Build):** Use `node:20-alpine` to build the static assets.
    - **Stage 2 (Serve):** Use `nginx:stable-alpine` to serve the `dist` or `build` folder.
- Create a separate `nginx.conf` to handle **React Router** (fallback all 404s to `index.html`).
- Default container port: `80`.

### 3. Orchestration - `/docker-compose.yml` (Root Directory)

Define two services: `wardrobe-be` and `wardrobe-fe`.

- **wardrobe-be:**
    - Build context: `./backend`
    - Port mapping: `3000:3000`
    - Volume mapping for **Hot Reload** in development (`./backend:/app` and anonymous volume for `node_modules`).
    - Load environment variables from `./backend/.env`.
- **wardrobe-fe:**
    - Build context: `./frontend`
    - Port mapping: `8080:80`
    - Depends on `wardrobe-be`.

---

## Output Requirements

1. Provide the full content for `backend/Dockerfile`.
2. Provide the full content for `frontend/Dockerfile`.
3. Provide the full content for `frontend/nginx.conf`.
4. Provide the full content for `docker-compose.yml`.
5. List the CLI commands to build and run the containers.

---

## 5. Development Rules & Constraints (from RULES.md)
While working on configurations and scripts, follow the project rules:
- **TypeScript:** Strict mode enabled.
- **Microservices & Monorepo Structure:** Keep interfaces and types within `/shared/types/` accessible across both BE and FE services within the Docker environment.
- **Frontend Container:** Must serve a React (Functional Components + Hooks ONLY) applying Tailwind CSS strictly. Use appropriate multi-stage commands to bundle the frontend without including devDependencies.
- **Backend Container:** Runs NestJS with Controller/Service architecture and injected Swagger Documentation endpoints.
