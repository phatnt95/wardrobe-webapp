# 📋 Feature Specification: Advanced Authentication & Session Management

## 1. Mục tiêu (Objectives)
- **Session Persistence:** Đảm bảo người dùng không bị văng ra (logout) khi tải lại trang (F5).
- **Smart Registration:** Kiểm tra sự tồn tại của email trong hệ thống trước khi tạo tài khoản mới.
- **SSO Integration:** Cho phép đăng nhập nhanh qua Google và Facebook, tự động liên kết tài khoản nếu cùng email.

---

## 2. Luồng Nghiệp vụ (Business Logic)

### 2.1. Session Persistence (Xử lý F5)
- **Cơ chế:** Sử dụng JWT (JSON Web Token) kết hợp với LocalStorage và một Endpoint kiểm tra trạng thái.
- **Luồng hoạt động:**
  1. Khi Login thành công, Backend trả về `access_token`. Frontend lưu vào `localStorage`.
  2. Khi F5, React App khởi tạo -> Gọi API `/auth/me` kèm theo Token trong Header.
  3. Backend bóc tách Token, tìm User trong MongoDB và trả về thông tin Profile.
  4. Nếu Token hợp lệ: App tiếp tục trạng thái Đã đăng nhập.
  5. Nếu Token hết hạn/không hợp lệ: Xóa LocalStorage và chuyển hướng về `/login`.

### 2.2. Smart Registration (Kiểm tra Email)
- **Validation:** Trước khi thực hiện `User.create()`, Backend phải thực hiện query `User.findOne({ email })`.
- **Phản hồi:** - Nếu email đã tồn tại: Trả về lỗi `409 Conflict` với thông báo "Email đã được đăng ký".
  - Nếu chưa: Tiếp tục Hash mật khẩu và lưu vào DB.

### 2.3. SSO (Google & Facebook)
- **Cơ chế:** Sử dụng Passport.js với các Strategy tương ứng (`passport-google-oauth20`, `passport-facebook`).
- **Luồng Login Social:**
  1. Người dùng nhấn "Login with Google/FB".
  2. Redirect sang trang xác thực của Provider.
  3. Provider trả về `profile` (email, name, avatar) qua Callback URL.
  4. Backend kiểm tra:
     - Nếu email đã có trong DB: Cập nhật thông tin và trả về JWT.
     - Nếu email chưa có: Tạo User mới với `provider: 'google' | 'facebook'` và trả về JWT.

---

## 3. Backend API Specification (NestJS)

### 3.1. Auth Endpoints
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| POST | `/auth/register` | Đăng ký (Check trùng email) | No |
| POST | `/auth/login` | Đăng nhập truyền thống | No |
| GET | `/auth/me` | Lấy thông tin user hiện tại từ Token | **Yes (JWT)** |
| GET | `/auth/google` | Chuyển hướng tới Google Auth | No |
| GET | `/auth/google/callback` | Xử lý dữ liệu trả về từ Google | No |
| GET | `/auth/facebook` | Chuyển hướng tới Facebook Auth | No |

---

## 4. Frontend Requirements (React + TypeScript)

### 4.1. AuthContext & Provider
- Quản lý trạng thái `user`, `isAuthenticated`, và `loading`.
- Triển khai `Axios Interceptor` để tự động đính kèm `Authorization: Bearer <token>` vào mọi request.

### 4.2. Components & UI
- **Login Page:** Thêm 2 nút "Sign in with Google" và "Sign in with Facebook" sử dụng Brand Identity chuẩn.
- **Register Form:** Hiển thị thông báo lỗi Real-time nếu email đã tồn tại (có thể check qua `onBlur` gọi API check-email).
- **Protected Routes:** Component bọc các trang nhạy cảm (Dashboard, Wardrobe), ngăn chặn truy cập trái phép.

---

## 5. Cấu hình Môi trường (Environment Variables)

Cần bổ sung các biến sau vào file `.env`:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_id
GOOGLE_CLIENT_SECRET=your_google_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Facebook OAuth
FACEBOOK_APP_ID=your_fb_id
FACEBOOK_APP_SECRET=your_fb_secret
FACEBOOK_CALLBACK_URL=http://localhost:3000/auth/facebook/callback

# JWT
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d