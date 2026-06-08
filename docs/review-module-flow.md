# Luồng Review Phim

## Mục tiêu
Chỉ cho khách hàng viết đánh giá phim sau khi họ đã thực sự xem xong phim.

## Quy tắc cốt lõi

1. Một review thuộc về đúng một `User`, một `Movie`, và một `Booking`.
2. Mỗi booking chỉ tạo tối đa một review.
3. Booking phải ở trạng thái `CONFIRMED`.
4. Suất chiếu phải kết thúc rồi.
5. Phần nội dung review có thể là tùy chọn ở UI, nhưng nếu user gửi thì phải có:
   - `rating` từ 1 đến 5
   - `content` dạng text
6. `Movie.rating` không được admin sửa tay. Nó được tính lại từ các review đã publish.
7. `Movie.reviewCount` lưu số lượng review đã publish để hiển thị nhanh.

## Luồng backend

### 1. Booking được tạo
- User đặt ghế và thanh toán hoàn tất.
- Booking chuyển sang trạng thái `CONFIRMED`.

### 2. Frontend gọi API booking để lấy dữ liệu
- Response booking sẽ có thêm:
  - `reviewed`
  - `canReview`
  - `reviewAvailableAt`
  - `review`

### 3. Backend quyết định có được review hay không
`canReview = true` chỉ khi:
- booking đang ở trạng thái `CONFIRMED`
- thời gian hiện tại lớn hơn `showtime.endTime`
- booking đó chưa có review nào

### 4. Frontend hiển thị nút
- Nếu `canReview` là `true`, hiện nút `Viết đánh giá`.
- Nếu `reviewed` là `true`, hiện `Đã đánh giá`.
- Nếu suất chiếu chưa kết thúc, ẩn hoặc disable nút.

### 5. User gửi review
- Frontend gửi lên:
  - `bookingId`
  - `rating`
  - `content`
  - `spoiler` là tùy chọn
- Backend kiểm tra lại quyền sở hữu và thời gian.
- Nếu hợp lệ, backend sẽ insert `MovieReview`.

### 6. Làm mới thống kê
Sau khi tạo, cập nhật, xóa, hoặc ẩn/hiện review:
- tính lại điểm trung bình từ các review có trạng thái `PUBLISHED`
- cập nhật `Movie.rating`
- cập nhật `Movie.reviewCount`

## Tóm tắt API

### Public
- `GET /api/reviews/movie/:movieId`

### User đã đăng nhập
- `GET /api/reviews/me`
- `GET /api/reviews/:id`
- `POST /api/reviews`
- `PUT /api/reviews/:id`
- `DELETE /api/reviews/:id`

### Admin
- `PATCH /api/reviews/:id/status`

## Hướng dẫn UI

- Không quyết định quyền review chỉ ở trình duyệt.
- Dùng `canReview` từ backend làm nguồn sự thật.
- UI có thể polling hoặc refresh dữ liệu booking để giao diện đổi trạng thái mượt hơn, nhưng backend vẫn phải kiểm tra lại trước khi tạo hoặc cập nhật review.
