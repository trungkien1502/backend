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

## 10. Payments / MoMo

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
MOMO_REDIRECT_URL=your_app_or_web_return_url
MOMO_IPN_URL=https://your-domain.com/api/payments/momo/ipn
PAYMENT_HOLD_MINUTES=10
```

**Gợi ý cho mobile app**

- Muốn bấm thanh toán và mở thẳng MoMo app thì frontend/mobile phải mở `deeplink`
- `payUrl` là trang web thanh toán của MoMo, có thể dẫn đến trải nghiệm web/QR
- `MOMO_REDIRECT_URL` nên là App Link / Universal Link / custom scheme của app, ví dụ `uitcinema://payment/momo-return`
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

**Response**

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

- API này trả JSON, phù hợp để debug hoặc dùng làm WebLink
- Nếu muốn thanh toán xong quay về app đẹp hơn, đặt `MOMO_REDIRECT_URL` thành deeplink/app link của app thay vì endpoint này
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

## 11. Common Errors

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

## 12. Suggested Client Flow

Luồng đặt vé trực tiếp, không dùng MoMo:

1. `POST /api/auth/login`
2. `GET /api/movies`
3. `GET /api/showtimes?movieId=...&cinemaId=...&date=...`
4. `GET /api/showtimeseats/:showtimeId`
5. `POST /api/showtimeseats/hold`
6. `POST /api/bookings`
7. `GET /api/bookings/user/:userId`

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
