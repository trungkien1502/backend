# Cinema Booking API

## Base URL



## 2. Auth

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
    "email": "user1@example.com"
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
  "birthDate": null
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

API này hiện có khả năng lỗi do `controller` truyền `req.userId` vào service trong khi service đang tìm user theo `email`.

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
  "otp": "123456"
}
```

**Lưu ý**

Hiện tại OTP được trả thẳng ra response để test, chưa gửi email thật.

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

**Body**

```json
{
  "name": "CGV Vincom",
  "location": "District 1"
}
```

### DELETE `/api/cinemas/:id`

Xóa rạp.

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

**Body**

```json
{
  "seatNumber": "A99"
}
```

### DELETE `/api/seats/room/:roomId`

Xóa toàn bộ ghế của 1 phòng.

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

### POST `/api/bookings`

Tạo booking từ các ghế đang được `HOLD` bởi đúng user đó.

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

---

## 10. Common Errors

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

### 404 Not Found

```json
{
  "success": false,
  "message": "Route not found"
}
```

---

## 11. Suggested Client Flow

Luồng đặt vé chuẩn ở frontend:

1. `POST /api/auth/login`
2. `GET /api/movies`
3. `GET /api/showtimes?movieId=...&cinemaId=...&date=...`
4. `GET /api/showtimeseats/:showtimeId`
5. `POST /api/showtimeseats/hold`
6. `POST /api/bookings`
7. `GET /api/bookings/user/:userId`

