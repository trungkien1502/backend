# Quick Start Guide - Admin Panel

## 🚀 Start trong 3 bước

### Bước 1: Cài đặt
```bash
cd admin-panel
npm install
```

### Bước 2: Cấu hình
Tạo file `.env`:
```env
VITE_API_URL=http://localhost:4000/api
```

### Bước 3: Chạy
```bash
npm run dev
```

Truy cập: **http://localhost:5173**

---

## 🔑 Login

**Yêu cầu:**
- Tài khoản có role `ADMIN`
- Backend đang chạy tại port 4000

**Tạo admin nếu chưa có:**
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

---

## 📱 Features

| Page | URL | Chức năng |
|------|-----|-----------|
| Dashboard | `/` | Thống kê tổng quan |
| Manage Users | `/users` | Quản lý users, search, delete |
| Add User | `/add-user` | Tạo user mới |
| Add Doctor | `/add-doctor` | Tạo bác sĩ mới |
| Add Care Profile | `/add-care-profile` | Tạo hồ sơ bệnh nhân |
| Add Doctor Slot | `/add-doctor-slot` | Tạo khung giờ khám |
| Add Appointment | `/add-appointment` | Tạo lịch hẹn |
| View Data | `/view-data` | Xem tất cả data |

---

## 🛠️ Tech Stack

- React 19
- React Router 6
- TailwindCSS
- Axios
- Vite 5

---

## 📝 Common Tasks

### Tạo User mới
1. Vào **Add User** (`/add-user`)
2. Điền form (email, password, fullName, role)
3. Click **Create User**

### Tạo Doctor
1. Vào **Add Doctor** (`/add-doctor`)
2. Điền thông tin (email, password, fullName, specialty)
3. Click **Create Doctor**

### Tạo Appointment
1. Vào **Add Appointment** (`/add-appointment`)
2. Nhập Care Profile ID
3. Nhập Doctor Slot ID
4. Nhập Service
5. Click **Create Appointment**

### Update Appointment Status
1. Vào **View Data** (`/view-data`)
2. Select "Appointments"
3. Click **Update Status** trên appointment muốn update
4. Nhập status mới: PENDING, CONFIRMED, COMPLETED, CANCELLED

### Search Users
1. Vào **Manage Users** (`/users`)
2. Dùng search box (tìm theo name, email, phone)
3. Hoặc filter theo Role

---

## 🐛 Troubleshooting

### Backend not responding
```bash
# Check backend health
curl http://localhost:4000/api/health
```

### Clear cache and restart
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Reset auth state
Trong browser console:
```javascript
localStorage.clear()
location.reload()
```

---

## 📦 Build for Production

```bash
npm run build
npm run preview  # Test production build
```

Output: `dist/` folder

---

## 🔗 Links

- Backend API: http://localhost:4000/api
- Admin Panel: http://localhost:5173
- API Health: http://localhost:4000/api/health

---

## ✅ Checklist

- [ ] Backend running on port 4000
- [ ] MySQL database setup
- [ ] Admin user created
- [ ] `.env` file configured
- [ ] `npm install` completed
- [ ] `npm run dev` running
- [ ] Can access http://localhost:5173
- [ ] Can login with admin credentials
- [ ] Dashboard shows statistics

---

That's it! Enjoy your admin panel! 🎉
