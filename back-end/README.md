# 👕 Wardrobe Management System (Microservices)

**Hệ thống quản lý tủ đồ thông minh cho gia đình**, hỗ trợ **đa địa điểm** *(Hà Nội, Hồ Chí Minh, Đà Nẵng)* với cấu trúc lưu trữ phân cấp và **AI gợi ý trang phục** theo ngữ cảnh sử dụng.

---

## 🏗 System Architecture

Dự án được thiết kế theo **kiến trúc Microservices hướng sự kiện (Event-Driven)**, đảm bảo **khả năng mở rộng**, **tính độc lập** giữa các nghiệp vụ và dễ dàng tích hợp hệ thống mới.

### Core Components

- **API Gateway (NGINX)**  
  Cổng điều phối duy nhất, xử lý *SSL Termination* và *Reverse Proxy*.

- **Auth Service**  
  Quản lý định danh người dùng, hỗ trợ **JWT** và **Google OAuth 2.0**.

- **Inventory Service**  
  Quản lý kho đồ với cấu trúc vị trí dạng cây:  
  `House → Room → Cabinet → Box`

- **Media Service**  
  Upload, lưu trữ và tối ưu hóa hình ảnh qua **Cloudinary**.

- **AI Stylist Service**  
  Gợi ý phối đồ dựa trên **thời tiết & bối cảnh sử dụng** (OpenAI / Gemini).

---

## 🛠 Tech Stack

### Backend (Microservices)

- **Framework**: NestJS (Node.js)
- **Communication**
  - REST API (đồng bộ)
  - RabbitMQ (CloudAMQP) – giao tiếp bất đồng bộ
- **Database**: MongoDB Atlas (Multi-region Cluster)
- **Documentation**: Swagger / OpenAPI  
  *(Tự động đồng bộ type với Frontend)*

---

### Frontend

- **Library**: React.js (TypeScript)
- **API Client**: Swagger Typescript API (tự động generate)
- **Authentication**: `@react-oauth/google`

---

### Infrastructure & DevOps

- **Storage**: Cloudinary
- **Message Broker**: CloudAMQP (Managed RabbitMQ)
- **Hosting**: Alibaba Cloud / Hostinger (KVM VPS)
- **Containerization**: Docker & Docker Compose (Multi-stage builds)
- **CI/CD**: GitHub Actions

---

## 📂 Project Structure

```bash
wardrobe-app/
├── apps/
│   ├── auth-service/       # Cổng đăng nhập & Google OAuth
│   ├── inventory-service/  # Quản lý tủ đồ & master data vị trí
│   ├── media-service/      # Upload & xử lý ảnh (Cloudinary)
│   └── ai-service/         # AI Stylist – gợi ý outfit
├── libs/
│   └── shared/             # DTOs, Schemas, Guards dùng chung
├── react-frontend/         # Giao diện người dùng (React + TS)
└── docker-compose.yml      # Cấu hình triển khai toàn hệ thống
