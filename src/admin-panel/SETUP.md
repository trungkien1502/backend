# Admin Panel Setup Guide

## Quick Start

### 1. Cài đặt Dependencies

```bash
cd admin-panel
npm install
```

### 2. Cấu hình Environment

Tạo file `.env` trong thư mục `admin-panel/`:

```env
VITE_API_URL=http://localhost:4000/api
```

### 3. Chạy Development Server

```bash
npm run dev
```

Server sẽ chạy tại: **http://localhost:5173**

### 4. Đăng nhập

Sử dụng tài khoản admin để đăng nhập:
- Email: `admin@test.com` (hoặc admin account có trong DB)
- Password: Mật khẩu của admin account
- **Lưu ý:** Chỉ tài khoản có role `ADMIN` mới được phép đăng nhập

## Prerequisites

- Node.js >= 18.0.0
- Backend server đang chạy trên port 4000
- MySQL database đã được setup
- Có ít nhất 1 user với role ADMIN trong database

## Tạo Admin User (nếu chưa có)

### Option 1: Qua API

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Admin@123",
    "fullName": "Admin User",
    "role": "ADMIN"
  }'
```

### Option 2: Qua Database

```sql
-- Tìm user cần promote lên admin
UPDATE User SET role = 'ADMIN' WHERE email = 'your-email@example.com';
```

## Features Overview

### 📊 Dashboard
- Thống kê tổng quan hệ thống
- Số lượng users, doctors, patients
- Số lượng appointments theo trạng thái
- Care profiles statistics

### 👥 User Management
- Tạo user mới với các role: PATIENT, DOCTOR, ADMIN
- Tìm kiếm users theo name, email, phone
- Filter theo role
- Xóa users

### 🩺 Doctor Management
- Thêm bác sĩ mới
- Thông tin chuyên khoa
- Kinh nghiệm và phòng khám

### 📋 Care Profiles
- Tạo hồ sơ bệnh nhân
- Quản lý thông tin chi tiết
- Bảo hiểm và liên hệ

### 📅 Appointments
- Tạo lịch hẹn mới
- Cập nhật trạng thái (PENDING, CONFIRMED, COMPLETED, CANCELLED)
- Xem tất cả appointments

### ⏰ Doctor Slots
- Tạo khung giờ làm việc cho bác sĩ
- Quản lý slot availability

### 📊 View All Data
- Xem tất cả appointments với filter
- Danh sách doctors
- Danh sách care profiles
- Danh sách doctor slots

## Technology Stack

```json
{
  "framework": "React 19",
  "routing": "React Router v6",
  "styling": "TailwindCSS",
  "http": "Axios",
  "icons": "Lucide React",
  "dates": "date-fns",
  "build": "Vite 5"
}
```

## Project Structure

```
admin-panel/
├── public/              # Static files
├── src/
│   ├── components/
│   │   ├── common/     # Reusable components (Button, Input, Card, etc.)
│   │   └── layout/     # Layout components (Navbar, Sidebar, MainLayout)
│   ├── contexts/       # React contexts (AuthContext)
│   ├── pages/          # Page components
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── AddUser.jsx
│   │   ├── AddDoctor.jsx
│   │   ├── AddCareProfile.jsx
│   │   ├── AddDoctorSlot.jsx
│   │   ├── AddAppointment.jsx
│   │   ├── ManageUsers.jsx
│   │   └── ViewData.jsx
│   ├── services/       # API services
│   │   └── api.js      # Axios instance & API calls
│   ├── App.jsx         # Main app with routing
│   ├── main.jsx        # App entry point
│   └── index.css       # Global styles (TailwindCSS)
├── .env                # Environment variables
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## API Endpoints

Tất cả các endpoints đều yêu cầu JWT token (trừ login).

### Authentication
- `POST /api/auth/login` - Login và nhận token
- `GET /api/auth/me` - Lấy thông tin user hiện tại

### Admin Endpoints
- `GET /api/admin/statistics` - Dashboard statistics
- `GET /api/admin/users` - Danh sách users (có search & filter)
- `POST /api/admin/users` - Tạo user mới
- `DELETE /api/admin/users/:id` - Xóa user
- `GET /api/admin/doctors` - Danh sách doctors
- `POST /api/admin/doctors` - Tạo doctor mới
- `GET /api/admin/care-profiles` - Danh sách care profiles
- `POST /api/admin/care-profiles` - Tạo care profile
- `GET /api/admin/doctor-slots` - Danh sách slots
- `POST /api/admin/doctor-slots` - Tạo slot
- `GET /api/admin/appointments` - Danh sách appointments
- `POST /api/admin/appointments` - Tạo appointment
- `PATCH /api/admin/appointments/:id/status` - Update trạng thái

## Troubleshooting

### 1. Không kết nối được với backend

**Lỗi:** `Network Error` hoặc `CORS error`

**Giải pháp:**
- Kiểm tra backend đã chạy chưa: `http://localhost:4000/api/health`
- Kiểm tra CORS đã enable trong backend
- Kiểm tra `.env` có đúng API URL không

### 2. Không đăng nhập được

**Lỗi:** "Not authorized. Admin access required."

**Giải pháp:**
- Đảm bảo user có role = `ADMIN`
- Check database: `SELECT * FROM User WHERE email = 'your-email';`
- Thử tạo admin mới nếu cần

### 3. Token expired

**Giải pháp:**
- Logout và login lại
- Hoặc xóa localStorage: `localStorage.clear()` trong browser console

### 4. Vite không start được

**Lỗi:** `crypto.hash is not a function`

**Giải pháp:**
- Đã được fix bằng cách dùng Vite v5 thay vì v7
- Nếu vẫn lỗi, kiểm tra Node version: `node -v` (cần >= 18.0.0)

### 5. Build errors

```bash
# Clear cache và reinstall
rm -rf node_modules package-lock.json
npm install
```

## Development Tips

### Hot Reload
Vite hỗ trợ Hot Module Replacement (HMR). Mỗi khi save file, browser tự động reload.

### Debug API Calls
Mở DevTools (F12) > Network tab để xem tất cả API requests/responses.

### Check Auth State
```javascript
// Trong browser console
console.log(localStorage.getItem('token'))
console.log(JSON.parse(localStorage.getItem('user')))
```

### Clear All Data
```javascript
// Trong browser console
localStorage.clear()
location.reload()
```

## Production Build

```bash
# Build
npm run build

# Preview build locally
npm run preview
```

Build output sẽ ở trong folder `dist/`. Deploy folder này lên static hosting như:
- Vercel
- Netlify
- Cloudflare Pages
- GitHub Pages

## Environment Variables for Production

```env
VITE_API_URL=https://your-production-api.com/api
```

## Security Notes

- ✅ JWT tokens được lưu trong localStorage
- ✅ Auto redirect to login khi token hết hạn
- ✅ Role-based access control (chỉ ADMIN)
- ✅ All API calls require authentication
- ⚠️ Không commit `.env` vào Git
- ⚠️ Thay đổi admin password mặc định trong production

## Next Steps

1. ✅ Setup backend và database
2. ✅ Tạo admin user
3. ✅ Start admin panel
4. ✅ Login và test features
5. 🔄 Customize theo nhu cầu
6. 🚀 Deploy lên production

## Support

Nếu gặp vấn đề:
1. Check console logs (F12)
2. Check Network tab
3. Verify backend đang chạy
4. Check database connection
5. Review error messages

Happy coding! 🚀
