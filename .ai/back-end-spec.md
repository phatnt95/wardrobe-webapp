# Wardrobe App - Backend Specification

## 1. Overview

Backend service for the **Wardrobe App** built using **NestJS** with a **Monolithic Architecture**.

The system manages user wardrobes including clothing items, locations, and favorites.  
Images of items are uploaded and stored via **Cloudinary**.

### Tech Stack

- **Framework:** NestJS
- **Architecture:** Monolithic
- **Database:** MongoDB
- **ORM/ODM:** Mongoose
- **Authentication:** JWT
- **Image Storage:** Cloudinary
- **Config Management:** `.env` file

---

# 2. Project Architecture

src
├── auth
│ ├── auth.controller.ts
│ ├── auth.service.ts
│ ├── auth.module.ts
│
├── users
│ ├── user.schema.ts
│ ├── users.service.ts
│ ├── users.module.ts
│
├── items
│ ├── item.schema.ts
│ ├── items.controller.ts
│ ├── items.service.ts
│ ├── items.module.ts
│
├── locations
│ ├── location.schema.ts
│ ├── locations.controller.ts
│ ├── locations.service.ts
│ ├── locations.module.ts
│
├── favorites
│ ├── favorites.controller.ts
│ ├── favorites.service.ts
│ ├── favorites.module.ts
│
├── cloudinary
│ ├── cloudinary.service.ts
│ ├── cloudinary.module.ts
│
├── common
│ ├── guards
│ ├── decorators
│ ├── filters
│
└── main.ts

---

# 3. Environment Configuration

All configurations must be defined in `.env`.

Example:
PORT=3000

MONGO_URI=mongodb://localhost:27017/wardrobe

JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d

CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx

---

# 4. Database Design

folder back-end/schema contains all the schemas for the database.

# 5. Main Features

## 5.1 Authentication

### Login
### Register

---

# 6. Item Management

## Create Item
## Update Item
## Delete Item
## Get Item
## Get All Items

---

# 7. Location Management

## Create Location
## Update Location
## Delete Location
## Get Location
## Get All Locations

---

# 8. Favorite Items

Users can mark items as favorites.

## Add Favorite
## Remove Favorite
## Get Favorite
## Get All Favorites

---

# 9. Security

- Password must be hashed using **bcrypt**
- All protected APIs require **JWT Authentication**
- User can only access their own data

---

# 10. Future Improvements

Possible future features:

- Outfit suggestion
- AI clothing recognition
- Weather-based outfit recommendation
- Tagging system
- Share wardrobe

---

# 11. Development Notes

- Follow **RESTful API design**
- Use **DTO validation with class-validator**
- Use **NestJS modules** for clear separation
- Implement **global exception filter**
- Use **Swagger** for API documentation

---

# 12. API Documentation

Swagger endpoint:
 
---

# 13. Development Rules & Constraints (from RULES.md)
- **Module Architecture:** Business logic strictly in Services. Controllers are solely responsible for routing, receiving requests, and returning responses.
- **Swagger & DTOs:** Controllers MUST have `@ApiOperation` and `@ApiResponse`. DTOs MUST use `class-validator` and `@ApiProperty()`.
- **Dependency Injection:** Always utilize Constructor Injection. Usage of the `new` keyword for instantiating classes is strictly prohibited.
- **Frontend Sync:** Before implementing new API features on Frontend, MUST update corresponding interfaces in `/shared/types/`.
- **TypeScript:** Strict mode enabled. Terminate completely if terminal TS errors persist and cannot be resolved normally.