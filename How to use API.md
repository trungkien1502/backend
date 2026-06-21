# Cinema Booking API

## Base URL



## 2. Auth

### Roles

User có 2 role:

- `CUSTOMER`: user thường, dùng app/mobile để xem phim, giữ ghế, đặt vé, thanh toán
- `ADMIN`: được đăng nhập admin web và gọi các API quản trị

Các API quản trị yêu cầu JWT token của user có `role = ADMIN`. Nếu user thường gọi các API này, backend trả `403 Admin only`.

Tài khoản admin mặc định khi chạy `node scripts/seedTestData.js`:

```txt
admin@example.com / 123456
```

### POST `/api/auth/register`

Tạo tài khoản user mới.

**Body**

```json
{
  "email": "user1@example.com",
  "password": "123456",
  "name": "Nguyen Van A",
  "phone": "0912345678"
}
```

**Success Response**

```json
{
  "message": "User created",
  "user": {
    "id": 1,
    "name": "Nguyen Van A",
    "email": "user1@example.com",
    "phone": "0912345678",
    "password": "$2b$10$exampleHashedPassword",
    "role": "CUSTOMER",
    "createdAt": "2026-04-21T10:00:00.000Z"
  }
}
```

**Error Response**

```json
{
  "message": "\"email\" is required"
}
```

### POST `/api/auth/login`

Đăng nhập và lấy JWT token.

**Body**

```json
{
  "email": "user1@example.com",
  "password": "123456"
}
```

**Success Response**

```json
{
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "name": "Nguyen Van A",
    "email": "user1@example.com",
    "role": "CUSTOMER"
  }
}
```

### GET `/api/auth/me`

Lấy thông tin user hiện tại.

**Auth:** `Bearer token`

**Success Response**

```json
{
  "id": 1,
  "name": "Nguyen Van A",
  "email": "user1@example.com",
  "phone": "0912345678",
  "gender": null,
  "birthDate": null,
  "role": "CUSTOMER"
}
```

### POST `/api/auth/changepassword`

Đổi mật khẩu.

**Auth:** `Bearer token`

**Body**

```json
{
  "oldPassword": "123456",
  "newPassword": "12345678"
}
```

**Response theo ý định code**

```json
{
  "message": "Password changed successfully"
}
```

**Lưu ý**

API này đã được sửa để lấy user theo `req.userId`.

### POST `/api/auth/forgotpassword`

Tạo OTP reset password.

**Body**

```json
{
  "email": "user1@example.com"
}
```

**Success Response**

```json
{
  "sent": true,
  "message": "If the email exists, a reset code has been sent"
}
```

**Lưu ý**

OTP được gửi qua email bằng tài khoản SMTP hệ thống, không trả ra response.

**Cấu hình cần có**

- `SMTP_HOST` = `smtp.gmail.com`
- `SMTP_PORT` = `587` hoặc `465`
- `SMTP_SECURE` = `true` nếu dùng port `465`
- `SMTP_USER` = email Gmail hệ thống
- `SMTP_PASS` = mật khẩu ứng dụng của Gmail đó
- `MAIL_FROM` = địa chỉ gửi mail, thường để trùng `SMTP_USER`

### POST `/api/auth/resetpassword`

Reset password bằng OTP.

**Body**

```json
{
  "email": "user1@example.com",
  "code": "123456",
  "newPassword": "newStrongPassword"
}
```

**Success Response**

```json
{
  "reset": true,
  "message": "Password has been reset"
}
```

---

## 3. Cinemas

### GET `/api/cinemas`

Lấy danh sách rạp.

**Response**

```json
[
  {
    "id": 1,
    "name": "CGV Landmark",
    "location": "Binh Thanh",
    "createdAt": "2026-04-21T10:00:00.000Z"
  }
]
```

### GET `/api/cinemas/:id`

Lấy chi tiết 1 rạp.

**Response**

```json
{
  "id": 1,
  "name": "CGV Landmark",
  "location": "Binh Thanh",
  "createdAt": "2026-04-21T10:00:00.000Z"
}
```

### POST `/api/cinemas`

Tạo rạp mới.

**Auth:** `Bearer ADMIN token`

**Body**

```json
{
  "name": "CGV Landmark",
  "location": "Binh Thanh"
}
```

**Response**

```json
{
  "id": 1,
  "name": "CGV Landmark",
  "location": "Binh Thanh",
  "createdAt": "2026-04-21T10:00:00.000Z"
}
```

### PUT `/api/cinemas/:id`

Sửa rạp.

**Auth:** `Bearer ADMIN token`

**Body**

```json
{
  "name": "CGV Vincom",
  "location": "District 1"
}
```

### DELETE `/api/cinemas/:id`

Xóa rạp.

**Auth:** `Bearer ADMIN token`

**Response**

```json
{
  "message": "Cinema deleted"
}
```

---

## 4. Movies

### GET `/api/movies`

Lấy danh sách phim.

**Query params**

- `search`: tìm theo title
- `status`: `COMING_SOON` | `NOW_SHOWING` | `ENDED`

**Example**

`GET /api/movies?search=avenger&status=NOW_SHOWING`

**Response**

```json
[
  {
    "id": 1,
    "tmdbId": 123,
    "title": "Avengers",
    "description": "Movie description",
    "duration": 120,
    "poster": "https://example.com/poster.jpg",
    "backdrop": "https://example.com/backdrop.jpg",
    "releaseDate": "2026-04-21T00:00:00.000Z",
    "rating": 8.5,
    "status": "NOW_SHOWING",
    "createdAt": "2026-04-21T10:00:00.000Z"
  }
]
```

### GET `/api/movies/:id`

Lấy chi tiết phim và cast.

**Response**

```json
{
  "id": 1,
  "tmdbId": 123,
  "title": "Avengers",
  "description": "Movie description",
  "duration": 120,
  "poster": "https://example.com/poster.jpg",
  "backdrop": "https://example.com/backdrop.jpg",
  "releaseDate": "2026-04-21T00:00:00.000Z",
  "rating": 8.5,
  "status": "NOW_SHOWING",
  "createdAt": "2026-04-21T10:00:00.000Z",
  "casts": [
    {
      "id": 1,
      "name": "Actor A",
      "character": "Hero",
      "profile": "https://example.com/profile.jpg",
      "movieId": 1
    }
  ]
}
```

### POST `/api/movies`

Tạo phim.

**Auth:** `Bearer ADMIN token`

**Body**

```json
{
  "title": "Avengers",
  "description": "Movie description",
  "duration": 120,
  "poster": "https://example.com/poster.jpg",
  "backdrop": "https://example.com/backdrop.jpg",
  "rating": 8.5,
  "tmdbId": 123,
  "releaseDate": "2026-04-21",
  "status": "NOW_SHOWING"
}
```

### PUT `/api/movies/:id`

Sửa phim.

**Auth:** `Bearer ADMIN token`

**Body**

```json
{
  "title": "Avengers Updated",
  "description": "New description",
  "rating": 9.0,
  "poster": "https://example.com/new-poster.jpg",
  "backdrop": "https://example.com/new-backdrop.jpg",
  "releaseDate": "2026-04-22",
  "status": "ENDED"
}
```

### DELETE `/api/movies/:id`

**Auth:** `Bearer ADMIN token`

**Response**

```json
{
  "message": "Movie deleted"
}
```

---

## 5. Rooms

### GET `/api/rooms`

Lấy danh sách phòng.

**Query params**

- `search`: tìm theo tên phòng

**Response**

```json
[
  {
    "id": 1,
    "cinemaId": 1,
    "name": "Room 1",
    "totalSeats": 40
  }
]
```

### GET `/api/rooms/:id`

Lấy chi tiết phòng.

**Response**

```json
{
  "id": 1,
  "cinemaId": 1,
  "name": "Room 1",
  "totalSeats": 40
}
```

### POST `/api/rooms`

Tạo phòng.

**Auth:** `Bearer ADMIN token`

**Body**

```json
{
  "name": "Room 1",
  "capacity": 40,
  "totalSeats": 40,
  "cinemaId": 1
}
```

**Lưu ý**

Schema hiện tại không có field `capacity`, nhưng service vẫn nhận field này khi create. Nên ưu tiên gửi `name`, `totalSeats`, `cinemaId`.

### PUT `/api/rooms/:id`

Sửa phòng.

**Auth:** `Bearer ADMIN token`

**Body**

```json
{
  "name": "Room VIP",
  "totalSeats": 50
}
```

**Response**

```json
{
  "message": "Room updated successfully",
  "data": {
    "id": 1,
    "cinemaId": 1,
    "name": "Room VIP",
    "totalSeats": 50
  }
}
```

### DELETE `/api/rooms/:id`

**Auth:** `Bearer ADMIN token`

**Response**

```json
{
  "message": "Room deleted"
}
```

---

## 6. Seats

### GET `/api/seats`

Lấy toàn bộ ghế.

**Response**

```json
[
  {
    "id": 1,
    "roomId": 1,
    "seatNumber": "A1"
  }
]
```

### GET `/api/seats/:id`

Lấy chi tiết 1 ghế.

### GET `/api/seats/room/:roomId`

Lấy toàn bộ ghế theo phòng.

**Query params**

- `search`: lọc theo seat number

**Example**

`GET /api/seats/room/1?search=A`

### POST `/api/seats`

Tạo hàng loạt ghế cho 1 phòng.

**Auth:** `Bearer ADMIN token`

**Body**

```json
{
  "roomId": 1,
  "rows": ["A", "B", "C", "D"],
  "columns": 10
}
```

Ghế được tạo sẽ là `A1..A10`, `B1..B10`, ...

**Response**

```json
{
  "message": "Seats created successfully",
  "data": [
    {
      "id": 1,
      "roomId": 1,
      "seatNumber": "A1"
    }
  ]
}
```

### PUT `/api/seats/:id`

Sửa tên ghế.

**Auth:** `Bearer ADMIN token`

**Body**

```json
{
  "seatNumber": "A99"
}
```

### DELETE `/api/seats/room/:roomId`

Xóa toàn bộ ghế của 1 phòng.

**Auth:** `Bearer ADMIN token`

**Response**

```json
{
  "message": "Seats deleted"
}
```

---

## 7. Showtimes

### GET `/api/showtimes`

Lấy danh sách suất chiếu.

**Query params**

- `movieId`
- `cinemaId`
- `date` theo format `YYYY-MM-DD`

**Example**

`GET /api/showtimes?movieId=1&cinemaId=2&date=2026-04-21`

**Response**

```json
[
  {
    "id": 1,
    "movieId": 1,
    "roomId": 2,
    "startTime": "2026-04-21T12:00:00.000Z",
    "endTime": "2026-04-21T14:00:00.000Z",
    "price": "90000",
    "movie": {
      "id": 1,
      "title": "Avengers"
    },
    "room": {
      "id": 2,
      "name": "Room 2",
      "cinema": {
        "id": 1,
        "name": "CGV Landmark",
        "location": "Binh Thanh"
      }
    }
  }
]
```

### GET `/api/showtimes/:id`

Lấy chi tiết 1 suất chiếu.

### POST `/api/showtimes`

Tạo suất chiếu và tự động tạo `showtimeSeat`.

**Auth:** `Bearer ADMIN token`

**Body**

```json
{
  "movieId": 1,
  "roomId": 2,
  "startTime": "2026-04-21T12:00:00.000Z",
  "endTime": "2026-04-21T14:00:00.000Z",
  "price": 90000
}
```

**Rules**

- `startTime` phải nhỏ hơn `endTime`
- Không được trùng lịch trong cùng `roomId`
- Room phải có seat trước khi tạo showtime

### PUT `/api/showtimes/:id`

Sửa suất chiếu.

**Auth:** `Bearer ADMIN token`

**Body**

```json
{
  "movieId": 1,
  "roomId": 2,
  "startTime": "2026-04-21T15:00:00.000Z",
  "endTime": "2026-04-21T17:00:00.000Z",
  "price": 100000
}
```

### DELETE `/api/showtimes/:id`

Xóa suất chiếu.

**Auth:** `Bearer ADMIN token`

**Response**

```json
{
  "message": "Showtime deleted"
}
```

**Lưu ý**

Không thể xóa showtime nếu đã có booking.

---

## 8. Showtime Seats

### GET `/api/showtimeseats/:showtimeId`

Lấy trạng thái ghế theo showtime.

API này sẽ tự động clear các ghế `HOLD` đã hết hạn trước khi trả dữ liệu.

**Response**

```json
{
  "message": "Success",
  "data": [
    {
      "id": 1,
      "showtimeId": 1,
      "seatId": 1,
      "status": "AVAILABLE",
      "holdUntil": null,
      "heldBy": null,
      "seat": {
        "id": 1,
        "roomId": 2,
        "seatNumber": "A1"
      }
    }
  ]
}
```

### POST `/api/showtimeseats/hold`

Giữ ghế 5 phút.

**Body**

```json
{
  "showtimeId": 1,
  "userId": 1,
  "seatIds": [1, 2, 3]
}
```

**Success Response**

```json
{
  "holdUntil": "2026-04-21T10:05:00.000Z"
}
```

**Rules**

- Chỉ giữ được ghế đang `AVAILABLE`
- Hoặc ghế `HOLD` nhưng đã hết hạn
- Nếu chỉ 1 ghế trong danh sách không hợp lệ, API sẽ fail toàn bộ

### POST `/api/showtimeseats/release`

Nhả ghế đang giữ.

**Body**

```json
{
  "showtimeId": 1,
  "userId": 1,
  "seatIds": [1, 2, 3]
}
```

**Response**

```json
{
  "message": "Seats released",
  "data": {
    "count": 3
  }
}
```

---

## 9. Bookings

### GET `/api/bookings`

Lấy danh sách tất cả booking cho admin web.

**Auth:** `Bearer ADMIN token`

**Query params**

- `status`: `PENDING` | `CONFIRMED` | `CANCELLED`
- `search`: tìm theo tên/email user hoặc tên phim

**Response**

```json
{
  "data": [
    {
      "id": 10,
      "totalPrice": 270000,
      "status": "CONFIRMED",
      "createdAt": "2026-04-21T10:00:00.000Z",
      "user": {
        "id": 1,
        "name": "Nguyen Van A",
        "email": "user1@example.com"
      },
      "movie": {
        "id": 1,
        "title": "Avengers",
        "poster": "https://example.com/poster.jpg"
      },
      "cinema": {
        "id": 1,
        "name": "CGV Landmark",
        "location": "Binh Thanh"
      },
      "room": {
        "id": 2,
        "name": "Room 2"
      },
      "showtime": {
        "startTime": "2026-04-21T12:00:00.000Z",
        "endTime": "2026-04-21T14:00:00.000Z"
      },
      "seats": ["A1", "A2"],
      "payment": null
    }
  ]
}
```

### POST `/api/bookings`

Tạo booking trực tiếp từ các ghế đang được `HOLD` bởi đúng user đó.

**Lưu ý**

API này xác nhận booking ngay, không đi qua MoMo. Nếu thanh toán bằng MoMo thì dùng `POST /api/payments/momo/create` thay cho API này.

**Body**

```json
{
  "userId": 1,
  "showtimeId": 1,
  "seatIds": [1, 2, 3]
}
```

**Success Response**

```json
{
  "message": "Booking success",
  "data": {
    "id": 10,
    "userId": 1,
    "showtimeId": 1,
    "totalPrice": "270000",
    "status": "CONFIRMED",
    "createdAt": "2026-04-21T10:00:00.000Z"
  }
}
```

**Rules**

- `seatIds` phải là ghế đang `HOLD`
- `heldBy` phải đúng `userId`
- `holdUntil` phải còn hiệu lực

### GET `/api/bookings/user/:userId`

Lấy toàn bộ booking của 1 user.

**Response**

```json
{
  "data": [
    {
      "id": 10,
      "totalPrice": 270000,
      "status": "CONFIRMED",
      "createdAt": "2026-04-21T10:00:00.000Z",
      "movie": {
        "title": "Avengers",
        "poster": "https://example.com/poster.jpg"
      },
      "cinema": {
        "name": "CGV Landmark",
        "location": "Binh Thanh"
      },
      "room": {
        "name": "Room 2"
      },
      "showtime": {
        "startTime": "2026-04-21T12:00:00.000Z",
        "endTime": "2026-04-21T14:00:00.000Z"
      },
      "seats": ["A1", "A2", "A3"]
    }
  ]
}
```

### GET `/api/bookings/:id`

Lấy chi tiết booking theo id.

**Response**

```json
{
  "data": [
    {
      "id": 10,
      "totalPrice": 270000,
      "status": "CONFIRMED",
      "createdAt": "2026-04-21T10:00:00.000Z",
      "movie": {
        "title": "Avengers",
        "poster": "https://example.com/poster.jpg"
      },
      "cinema": {
        "name": "CGV Landmark",
        "location": "Binh Thanh"
      },
      "room": {
        "name": "Room 2"
      },
      "showtime": {
        "startTime": "2026-04-21T12:00:00.000Z",
        "endTime": "2026-04-21T14:00:00.000Z"
      },
      "seats": ["A1", "A2", "A3"]
    }
  ]
}
```

**Lưu ý**

API này hiện trả `data` là array, dù tìm theo 1 `id`.

### POST `/api/bookings/:id/cancel`

Hủy booking.

**Auth:** `Bearer ADMIN token`

**Response**

```json
{
  "message": "Cancelled",
  "data": true
}
```

Khi hủy:

- Booking status đổi thành `CANCELLED`
- Các ghế đã `BOOKED` của booking đó sẽ được trả về `AVAILABLE`
- Nếu booking có payment `PENDING` thì payment cũng đổi thành `CANCELLED`

---

## 10. Reviews

### Tổng quan luồng review

User chỉ có thể review khi:

- booking thuộc chính user đó
- booking ở trạng thái `CONFIRMED`
- showtime đã kết thúc
- booking đó chưa từng có review

Review gắn với:

- `userId`
- `movieId`
- `bookingId`
- `rating`
- `content`
- `spoiler`

Backend sẽ tự lấy `userId` từ JWT token, không cần gửi `userId` trong body.

### GET `/api/reviews/movie/:movieId`

Lấy danh sách review của một phim.

**Response**

```json
{
  "data": [
    {
      "id": 1,
      "rating": 5,
      "content": "Phim rất hay, xem xong rất đáng tiền.",
      "spoiler": false,
      "status": "PUBLISHED",
      "createdAt": "2026-06-08T10:00:00.000Z",
      "updatedAt": "2026-06-08T10:00:00.000Z",
      "bookingId": 10,
      "user": {
        "id": 1,
        "name": "Nguyen Van A"
      },
      "movie": {
        "id": 3,
        "title": "Avengers",
        "poster": "https://example.com/poster.jpg"
      }
    }
  ]
}
```

### GET `/api/reviews/me`

Lấy toàn bộ review của user hiện tại.

**Auth:** `Bearer token`

### GET `/api/reviews/:id`

Lấy chi tiết review theo id.

**Auth:** `Bearer token`

### POST `/api/reviews`

Tạo review mới.

**Auth:** `Bearer token`

**Body**

```json
{
  "bookingId": 10,
  "rating": 5,
  "content": "Phim rất hay, hình ảnh đẹp và nội dung cuốn hút.",
  "spoiler": false
}
```

**Success Response**

```json
{
  "message": "Review created successfully",
  "data": {
    "id": 1,
    "rating": 5,
    "content": "Phim rất hay, hình ảnh đẹp và nội dung cuốn hút.",
    "spoiler": false,
    "status": "PUBLISHED",
    "bookingId": 10,
    "user": {
      "id": 1,
      "name": "Nguyen Van A"
    },
    "movie": {
      "id": 3,
      "title": "Avengers",
      "poster": "https://example.com/poster.jpg"
    }
  }
}
```

**Rules**

- `rating` phải từ 1 đến 5
- `content` không được trống
- booking phải là booking của chính user đang đăng nhập
- booking phải `CONFIRMED`
- showtime phải đã kết thúc
- không được tạo review trùng cho cùng một booking

### PUT `/api/reviews/:id`

Sửa review của chính mình.

**Auth:** `Bearer token`

**Body**

```json
{
  "rating": 4,
  "content": "Sau khi xem lại mình thấy phim vẫn ổn, nhịp giữa hơi chậm.",
  "spoiler": false
}
```

### DELETE `/api/reviews/:id`

Xóa review của chính mình.

**Auth:** `Bearer token`

### PATCH `/api/reviews/:id/status`

Admin ẩn / hiện review.

**Auth:** `Bearer ADMIN token`

**Body**

```json
{
  "status": "HIDDEN"
}
```

hoặc

```json
{
  "status": "PUBLISHED"
}
```

**Lưu ý**

- `Movie.rating` và `Movie.reviewCount` sẽ được cập nhật lại sau mỗi lần tạo / sửa / xóa / đổi trạng thái review
- `Movie.rating` là điểm trung bình từ các review `PUBLISHED`

---

## 11. Payments / MoMo

### Tổng quan luồng MoMo

Luồng chuẩn khi thanh toán bằng MoMo:

1. User đăng nhập hoặc app có `userId`
2. User chọn suất chiếu và ghế
3. App gọi `POST /api/showtimeseats/hold` để giữ ghế 5 phút
4. App gọi `POST /api/payments/momo/create`
5. Backend kiểm tra ghế còn `HOLD`, đúng `heldBy`, còn hạn `holdUntil`
6. Backend tạo `Booking.status = PENDING` và `Payment.status = PENDING`
7. Backend kéo dài thời gian giữ ghế theo `PAYMENT_HOLD_MINUTES`, mặc định 10 phút
8. Backend gọi MoMo và trả về `payUrl`, `qrCodeUrl`, `deeplink`
9. App mở `deeplink` để chuyển thẳng qua MoMo app, hoặc dùng `payUrl` làm fallback web
10. MoMo gọi `POST /api/payments/momo/ipn` để backend cập nhật trạng thái
11. MoMo redirect user về `MOMO_REDIRECT_URL`
12. App gọi `GET /api/payments/order/:orderId` để lấy trạng thái cuối

### Cấu hình môi trường

Backend cần các biến môi trường:

```env
MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create
MOMO_PARTNER_CODE=your_partner_code
MOMO_ACCESS_KEY=your_access_key
MOMO_SECRET_KEY=your_secret_key
MOMO_REDIRECT_URL=https://your-domain.com/api/payments/momo/return
MOMO_IPN_URL=https://your-domain.com/api/payments/momo/ipn
APP_PAYMENT_RETURN_URL=your_app_deeplink_or_app_link
PAYMENT_HOLD_MINUTES=10
MOMO_RETURN_WAIT_ATTEMPTS=6
MOMO_RETURN_WAIT_DELAY_MS=500
```

**Gợi ý cho mobile app**

- Muốn bấm thanh toán và mở thẳng MoMo app thì frontend/mobile phải mở `deeplink`
- `payUrl` là trang web thanh toán của MoMo, có thể dẫn đến trải nghiệm web/QR
- `MOMO_REDIRECT_URL` nên trỏ về backend `/api/payments/momo/return` để backend cập nhật trạng thái trước khi mở lại app
- `APP_PAYMENT_RETURN_URL` là deeplink/app link để backend redirect user về app sau khi cập nhật, ví dụ `uitcinema://payment/momo-return`
- Backend sẽ báo lỗi khi `MOMO_REDIRECT_URL` hoặc `MOMO_IPN_URL` không phải URL `http(s)`, để tránh lỡ cấu hình deeplink app vào callback của MoMo
- `MOMO_RETURN_WAIT_ATTEMPTS` và `MOMO_RETURN_WAIT_DELAY_MS` giúp `/momo/return` đợi IPN vài giây trước khi redirect về app, giảm trường hợp app đọc thấy `PENDING`
- Dù có redirect về app, trạng thái thanh toán chuẩn vẫn nên lấy từ IPN và `GET /api/payments/order/:orderId`

### POST `/api/payments/momo/create`

Tạo booking pending và tạo request thanh toán MoMo.

**Điều kiện trước khi gọi**

- Các ghế trong `seatIds` đã được hold bằng `POST /api/showtimeseats/hold`
- `ShowtimeSeat.status = HOLD`
- `ShowtimeSeat.heldBy = userId`
- `ShowtimeSeat.holdUntil` còn lớn hơn thời điểm hiện tại
- Ghế chưa nằm trong booking `PENDING` hoặc `CONFIRMED`

**Body**

```json
{
  "userId": 1,
  "showtimeId": 1,
  "seatIds": [1, 2, 3]
}
```

**Success Response**

```json
{
  "message": "MoMo payment created",
  "data": {
    "bookingId": 12,
    "paymentId": 8,
    "amount": 270000,
    "orderId": "BOOKING_12_1777716000000",
    "requestId": "BOOKING_12_1777716000000_123456",
    "payUrl": "https://test-payment.momo.vn/v2/gateway/pay?t=...",
    "qrCodeUrl": "000201010212...",
    "deeplink": "momo://app?action=payWithApp&isScanQR=false&..."
  }
}
```

**Ý nghĩa field trả về**

- `bookingId`: booking vừa được tạo, trạng thái ban đầu là `PENDING`
- `paymentId`: payment vừa được tạo, trạng thái ban đầu là `PENDING`
- `amount`: tổng tiền thanh toán
- `orderId`: mã đơn hàng dùng để tra cứu payment
- `requestId`: mã request gửi sang MoMo
- `deeplink`: link mở thẳng app MoMo vào màn hình thanh toán
- `payUrl`: link web thanh toán MoMo, dùng fallback nếu không mở được app
- `qrCodeUrl`: dữ liệu tạo QR, không phải URL ảnh QR

**Frontend/mobile nên xử lý**

```js
const res = await api.post("/payments/momo/create", {
  userId: 1,
  showtimeId: 1,
  seatIds: [1, 2, 3]
});

const { deeplink, payUrl } = res.data.data;

if (deeplink) {
  window.location.href = deeplink;
} else {
  window.location.href = payUrl;
}
```

Với React Native:

```js
const { deeplink, payUrl } = res.data.data;
await Linking.openURL(deeplink || payUrl);
```

**Error Response**

```json
{
  "message": "Some seats are invalid or expired"
}
```

Các lỗi thường gặp:

- `Invalid input`: thiếu `userId`, `showtimeId`, hoặc `seatIds`
- `Some seats are invalid or expired`: ghế chưa hold, hold hết hạn, hoặc hold bởi user khác
- `Some seats already have a pending or confirmed booking`: ghế đã có booking đang chờ thanh toán hoặc đã xác nhận
- `Showtime not found`: không tồn tại suất chiếu
- `MoMo 400: ...`: MoMo từ chối request, thường do sai config, chữ ký, URL callback, hoặc amount

### POST `/api/payments/momo/ipn`

Endpoint cho MoMo gọi server-to-server sau khi giao dịch có kết quả.

**Không gọi API này từ frontend.** URL này phải được cấu hình vào `MOMO_IPN_URL`.

**Body mẫu từ MoMo**

```json
{
  "partnerCode": "MOMO_PARTNER_CODE",
  "orderId": "BOOKING_12_1777716000000",
  "requestId": "BOOKING_12_1777716000000_123456",
  "amount": 270000,
  "orderInfo": "Thanh toan ve xem phim #12",
  "orderType": "momo_wallet",
  "transId": 4088878653,
  "resultCode": 0,
  "message": "Successful.",
  "payType": "app",
  "responseTime": 1777716000000,
  "extraData": "",
  "signature": "valid_momo_signature"
}
```

**Success Response**

```http
204 No Content
```

**Backend xử lý khi `resultCode = 0`**

- `Payment.status = PAID`
- `Payment.transId = transId`
- `Booking.status = CONFIRMED`
- Các ghế của booking đổi từ `HOLD` sang `BOOKED`
- `holdUntil = null`
- `heldBy = null`

**Backend xử lý khi `resultCode != 0`**

- `Payment.status = FAILED`
- `Booking.status = CANCELLED`
- Các ghế đang hold bởi user được trả về `AVAILABLE`
- `holdUntil = null`
- `heldBy = null`

**Validation trong backend**

- Kiểm tra chữ ký MoMo
- Kiểm tra `partnerCode`
- Tìm payment theo `orderId`
- Kiểm tra `requestId` khớp payment
- Kiểm tra `amount` khớp payment

### GET `/api/payments/momo/return`

Endpoint nhận redirect từ MoMo sau khi người dùng hoàn tất thanh toán.

**Ví dụ URL MoMo redirect về**

```http
GET /api/payments/momo/return?orderId=BOOKING_12_1777716000000&resultCode=0&message=Successful.
```

**Redirect về app**

Nếu có cấu hình `APP_PAYMENT_RETURN_URL`, backend xử lý cập nhật payment/booking trước rồi redirect về app:

```http
302 Found
Location: uitcinema://payment/momo-return?orderId=BOOKING_12_1777716000000&paymentStatus=PAID&bookingId=12&bookingStatus=CONFIRMED&resultCode=0&message=Successful.
```

App nên lấy `orderId` từ deeplink rồi gọi `GET /api/payments/order/:orderId` để lấy trạng thái cuối.

**JSON debug response**

Nếu muốn xem JSON trên browser/Postman, thêm `format=json`:

```http
GET /api/payments/momo/return?orderId=BOOKING_12_1777716000000&resultCode=0&message=Successful.&format=json
```

```json
{
  "message": "MoMo return received",
  "data": {
    "orderId": "BOOKING_12_1777716000000",
    "paymentStatus": "PAID",
    "booking": {
      "id": 12,
      "status": "CONFIRMED",
      "totalPrice": "270000"
    },
    "resultCode": "0",
    "message": "Successful."
  }
}
```

**Lưu ý**

- API này trả JSON khi chưa cấu hình `APP_PAYMENT_RETURN_URL` hoặc khi có `format=json`
- Không đặt `MOMO_REDIRECT_URL` trực tiếp thành deeplink app nếu backend cần xử lý return để cập nhật trạng thái
- Redirect có thể đến trước hoặc sau IPN trong một số tình huống, nên app vẫn nên gọi `GET /api/payments/order/:orderId` để xác nhận trạng thái

### GET `/api/payments/order/:orderId`

Lấy trạng thái payment theo `orderId`.

API này nên được frontend/mobile gọi sau khi user quay về app từ MoMo.

**Response**

```json
{
  "data": {
    "id": 8,
    "bookingId": 12,
    "provider": "MOMO",
    "amount": "270000",
    "currency": "VND",
    "status": "PAID",
    "orderId": "BOOKING_12_1777716000000",
    "requestId": "BOOKING_12_1777716000000_123456",
    "transId": "4088878653",
    "payUrl": "https://test-payment.momo.vn/v2/gateway/pay?t=...",
    "qrCodeUrl": "000201010212...",
    "deeplink": "momo://app?action=payWithApp&isScanQR=false&...",
    "rawResponse": {
      "resultCode": 0,
      "message": "Successful."
    },
    "createdAt": "2026-05-02T10:00:00.000Z",
    "updatedAt": "2026-05-02T10:02:00.000Z",
    "booking": {
      "id": 12,
      "status": "CONFIRMED",
      "totalPrice": "270000"
    }
  }
}
```

**Payment status**

- `PENDING`: đã tạo request MoMo, đang chờ user thanh toán
- `PAID`: MoMo báo thanh toán thành công
- `FAILED`: MoMo báo thất bại hoặc user hủy/thanh toán lỗi
- `CANCELLED`: booking/payment bị hủy phía hệ thống

### Test nhanh bằng curl

**1. Hold ghế**

```bash
curl -X POST http://localhost:8080/api/showtimeseats/hold \
  -H "Content-Type: application/json" \
  -d '{
    "showtimeId": 1,
    "userId": 1,
    "seatIds": [1, 2]
  }'
```

**2. Tạo thanh toán MoMo**

```bash
curl -X POST http://localhost:8080/api/payments/momo/create \
  -H "Content-Type: application/json" \
  -d '{
    "showtimeId": 1,
    "userId": 1,
    "seatIds": [1, 2]
  }'
```

**3. Mở `deeplink` hoặc `payUrl` từ response**

- Mobile app: ưu tiên mở `deeplink`
- Web browser: mở `payUrl`

**4. Kiểm tra trạng thái sau thanh toán**

```bash
curl http://localhost:8080/api/payments/order/BOOKING_12_1777716000000
```

---

## 12. Common Errors

### 400 Bad Request

```json
{
  "message": "Invalid input"
}
```

hoặc

```json
{
  "error": "Invalid time range"
}
```

### 401 Unauthorized

```json
{
  "message": "Token missing"
}
```

hoặc

```json
{
  "message": "Invalid token"
}
```

### 403 Forbidden

Khi user thường gọi API chỉ dành cho admin:

```json
{
  "message": "Admin only"
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "Route not found"
}
```

---

## 13. Suggested Client Flow

Luồng đăng nhập admin web:

1. `POST /api/auth/login`
2. Kiểm tra `user.role === "ADMIN"`
3. Gọi các API quản trị với header `Authorization: Bearer <token>`
4. Nếu backend trả `403 Admin only`, tài khoản không có quyền admin

Luồng đặt vé trực tiếp, không dùng MoMo:

1. `POST /api/auth/login`
2. `GET /api/movies`
3. `GET /api/showtimes?movieId=...&cinemaId=...&date=...`
4. `GET /api/showtimeseats/:showtimeId`
5. `POST /api/showtimeseats/hold`
6. `POST /api/bookings`
7. `GET /api/bookings/user/:userId`
8. Nếu showtime đã qua, gọi `POST /api/reviews`

Luồng đặt vé thanh toán bằng MoMo:

1. `POST /api/auth/login`
2. `GET /api/movies`
3. `GET /api/showtimes?movieId=...&cinemaId=...&date=...`
4. `GET /api/showtimeseats/:showtimeId`
5. `POST /api/showtimeseats/hold`
6. `POST /api/payments/momo/create`
7. Mở `deeplink` từ response để chuyển sang MoMo app
8. MoMo gọi `POST /api/payments/momo/ipn`
9. App nhận redirect từ `MOMO_REDIRECT_URL`
10. `GET /api/payments/order/:orderId`
11. Nếu payment `PAID`, hiển thị vé / booking thành công
12. Khi showtime đã qua, `POST /api/reviews`
