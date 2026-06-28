# Cinema System Sequence Diagrams

This document describes the sequence flows between:

```txt
Cinema Android app: https://github.com/nmkhoi3006/Cinema-Android
Backend API: this repository
Database: MySQL via Prisma
Payment gateways: MoMo sandbox and VNPay sandbox
```

Backend base URL:

```txt
http://uit-cinema.koreacentral.cloudapp.azure.com/api
```

Important implementation notes:

```txt
The current Android app uses Retrofit with base URL /api/.
The current Android payment flow is MoMo: POST /payments/momo/create.
VNPay is already supported by the backend: POST /payments/vnpay/create.
Android needs a small client-side switch/new repository method to use VNPay.
```

## 1. Register And Login

Used Android classes:

```txt
AuthApiService
SignupActivity
LoginActivity
SessionManager
```

Used backend routes:

```txt
POST /api/auth/register
POST /api/auth/login
GET /api/auth/me
```

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant App as Android App
    participant AuthRepo as AuthRepository/AuthApiService
    participant API as Backend Auth API
    participant DB as MySQL/Prisma
    participant Session as SessionManager

    User->>App: Enter register information
    App->>AuthRepo: register(RegisterRequest)
    AuthRepo->>API: POST /api/auth/register
    API->>DB: Create user with hashed password
    DB-->>API: User created
    API-->>AuthRepo: RegisterResponse
    AuthRepo-->>App: Register success

    User->>App: Enter email/password
    App->>AuthRepo: login(LoginRequest)
    AuthRepo->>API: POST /api/auth/login
    API->>DB: Find user by email
    DB-->>API: User + password hash
    API->>API: Verify password and sign JWT
    API-->>AuthRepo: LoginResponse { token, user }
    AuthRepo-->>App: Login success
    App->>Session: Save JWT and user info

    App->>AuthRepo: getProfile()
    AuthRepo->>API: GET /api/auth/me with Authorization: Bearer token
    API->>API: authMiddleware verifies JWT
    API->>DB: Find current user
    DB-->>API: Profile
    API-->>AuthRepo: Profile
    AuthRepo-->>App: Render logged-in user
```

## 2. Browse Movies, Cinemas, Dates, And Showtimes

Used Android classes:

```txt
MovieApiService
CinemaApiService
ShowTimesApiService
MovieDetailActivity
ChooseCinemaActivity
DateTimeActivity
SeatActivity
```

Used backend routes:

```txt
GET /api/movies/now_showing
GET /api/movies/coming_soon
GET /api/movies/:movieId
GET /api/cinemas
GET /api/showtimes?movieId=&cinemaId=&date=
GET /api/showtimes/:id
```

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant App as Android App
    participant MovieRepo as MovieRepository/MovieApiService
    participant CinemaRepo as CinemaRepository/CinemaApiService
    participant ShowRepo as ShowTimesRepository/ShowTimesApiService
    participant API as Backend API
    participant DB as MySQL/Prisma

    User->>App: Open home/movie list
    App->>MovieRepo: getListMovieByStatus("now_showing")
    MovieRepo->>API: GET /api/movies/now_showing
    API->>DB: Query movies where status is now showing
    DB-->>API: Movie list
    API-->>MovieRepo: List<MovieResponse>
    MovieRepo-->>App: Render movies

    User->>App: Select movie
    App->>MovieRepo: getMovieDetail(movieId)
    MovieRepo->>API: GET /api/movies/{movieId}
    API->>DB: Query movie detail, people, genres, showtimes
    DB-->>API: Movie detail
    API-->>MovieRepo: DetailMovieResponse
    MovieRepo-->>App: Render movie detail

    User->>App: Choose cinema
    App->>CinemaRepo: getListCinemas()
    CinemaRepo->>API: GET /api/cinemas
    API->>DB: Query cinemas
    DB-->>API: Cinema list
    API-->>CinemaRepo: List<CinemaResponse>
    CinemaRepo-->>App: Render cinemas

    User->>App: Choose date/time
    App->>ShowRepo: getShowTimes(movieId, cinemaId, date)
    ShowRepo->>API: GET /api/showtimes?movieId=&cinemaId=&date=
    API->>DB: Query showtimes by movie, cinema, date
    DB-->>API: Showtime list
    API-->>ShowRepo: List<ShowTimesResponse>
    ShowRepo-->>App: Render available showtimes

    User->>App: Select showtime
    App->>ShowRepo: getDetailShowTimes(showtimeId)
    ShowRepo->>API: GET /api/showtimes/{id}
    API->>DB: Query showtime with movie, room, cinema
    DB-->>API: Showtime detail
    API-->>ShowRepo: ShowTimesResponse
    ShowRepo-->>App: Open SeatActivity
```

## 3. Seat Selection And Hold

Used Android classes:

```txt
SeatActivity
SeatRepository
SeatApiService
SeatSelectionManager
BookingConfirmationDialogFragment
```

Used backend routes:

```txt
GET /api/showtimeseats/:showtimeId
POST /api/showtimeseats/hold
POST /api/showtimeseats/release
```

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant SeatScreen as SeatActivity
    participant SeatRepo as SeatRepository/SeatApiService
    participant API as Backend ShowtimeSeat API
    participant DB as MySQL/Prisma
    participant Selection as SeatSelectionManager
    participant Dialog as BookingConfirmationDialogFragment

    SeatScreen->>SeatRepo: getSeats(showtimeId)
    SeatRepo->>API: GET /api/showtimeseats/{showtimeId}
    API->>DB: Clear expired HOLD seats
    API->>DB: Query seats by showtime
    DB-->>API: ShowtimeSeat[] with Seat info
    API-->>SeatRepo: { message, data }
    SeatRepo-->>SeatScreen: Map seats to UI grid

    User->>SeatScreen: Select seats
    SeatScreen->>Selection: Track selected seatIds and seat names

    User->>SeatScreen: Tap Next
    SeatScreen->>SeatRepo: holdSeats(showtimeId, userId, selectedSeatIds)
    SeatRepo->>API: POST /api/showtimeseats/hold
    API->>DB: Transaction update AVAILABLE seats to HOLD
    alt All selected seats are available
        DB-->>API: updateMany count equals selected count
        API-->>SeatRepo: { holdUntil }
        SeatRepo-->>SeatScreen: Hold success
        SeatScreen->>Selection: markCurrentSelectionAsHeld()
        SeatScreen->>Dialog: Show booking confirmation
    else Some seats already taken
        DB-->>API: updateMany count mismatch
        API-->>SeatRepo: 400 { message: "Some seats were just taken" }
        SeatRepo-->>SeatScreen: Show error and re-enable button
    end
```

## 4. Booking And MoMo Payment Flow (Current Android Flow)

Used Android classes:

```txt
SeatActivity
MomoRepository
MomoApiService
PaymentReturnHandler
SessionManager
```

Used backend routes:

```txt
POST /api/payments/momo/create
POST /api/payments/momo/ipn
GET /api/payments/momo/return
GET /api/payments/order/:orderId
```

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant App as SeatActivity
    participant MomoRepo as MomoRepository/MomoApiService
    participant API as Backend Payment API
    participant DB as MySQL/Prisma
    participant MoMo as MoMo Sandbox
    participant Handler as PaymentReturnHandler
    participant Session as SessionManager

    User->>App: Confirm payment in dialog
    App->>MomoRepo: createPayment(showtimeId, userId, heldSeatIds)
    MomoRepo->>API: POST /api/payments/momo/create
    API->>DB: Validate held seats belong to user and not expired
    API->>DB: Create Booking(PENDING)
    API->>DB: Create BookingSeat rows
    API->>DB: Extend seat holdUntil
    API->>DB: Create Payment(provider=MOMO, status=PENDING)
    API->>MoMo: Create payment request with signature
    MoMo-->>API: payUrl, qrCodeUrl, deeplink, transId
    API->>DB: Save MoMo rawResponse and payment URLs
    API-->>MomoRepo: { data: { orderId, bookingId, payUrl, qrCodeUrl, deeplink } }
    MomoRepo-->>App: Payment data
    App->>Session: savePendingPaymentOrderId(orderId)
    App->>MoMo: ACTION_VIEW deeplink or payUrl

    alt MoMo payment success
        MoMo->>API: POST /api/payments/momo/ipn
        API->>API: Verify MoMo signature
        API->>DB: Update Payment PAID
        API->>DB: Update Booking CONFIRMED
        API->>DB: Update seats BOOKED
        API-->>MoMo: 204 No Content
        MoMo->>API: GET /api/payments/momo/return
        API->>API: Verify return signature
        API->>DB: Payment already PAID or confirm again safely
        API-->>MoMo: Redirect to uitcinema://payment/momo-return?orderId=...
        MoMo-->>Handler: Android deep link intent
        Handler->>MomoRepo: getPaymentByOrderId(orderId)
        MomoRepo->>API: GET /api/payments/order/{orderId}
        API->>DB: Query payment + booking status
        DB-->>API: Payment(PAID), Booking(CONFIRMED)
        API-->>MomoRepo: Payment data
        Handler->>Session: clearPendingPaymentOrderId()
        Handler-->>App: onPaymentSuccess(paymentData)
        App-->>User: Navigate home and create local notification
    else MoMo returns resultCode not 0
        MoMo->>API: IPN/Return with failed resultCode
        API->>DB: Update Payment FAILED
        API->>DB: Update Booking CANCELLED
        API->>DB: Release held seats to AVAILABLE
        Handler->>MomoRepo: GET /api/payments/order/{orderId}
        API-->>MomoRepo: Payment FAILED
        Handler-->>App: onPaymentPending("FAILED") or error toast
    end
```

## 5. Booking And VNPay Payment Flow (Backend Supported, Android Needs Client Hook)

Backend VNPay support was added for sandbox fallback.

Used backend routes:

```txt
POST /api/payments/vnpay/create
GET /api/payments/vnpay/return
GET /api/payments/vnpay/ipn
GET /api/payments/order/:orderId
```

Android change needed:

```txt
Add VnpayApiService.createPayment() similar to MomoApiService.
Open response.data.payUrl with ACTION_VIEW.
After return, call GET /payments/order/{orderId} like PaymentReturnHandler already does.
```

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant App as Android App / Future VnpayRepository
    participant API as Backend Payment API
    participant DB as MySQL/Prisma
    participant VNPay as VNPay Sandbox
    participant Browser as Browser/WebView

    User->>App: Confirm payment with VNPay
    App->>API: POST /api/payments/vnpay/create
    Note over App,API: Body: { userId, showtimeId, seatIds } after seats are HOLD
    API->>DB: Validate held seats belong to user and not expired
    API->>DB: Create Booking(PENDING)
    API->>DB: Create BookingSeat rows
    API->>DB: Extend seat holdUntil
    API->>DB: Create Payment(provider=VNPAY, status=PENDING)
    API->>API: Build VNPay params and HMAC SHA512 secure hash
    API->>DB: Save payUrl, qrCodeUrl, rawResponse
    API-->>App: { data: { orderId, bookingId, payUrl, qrCodeUrl, deeplink:null } }
    App->>Browser: Open payUrl
    Browser->>VNPay: User pays with NCB sandbox card

    alt VNPay success
        VNPay->>API: GET /api/payments/vnpay/ipn
        API->>API: Verify vnp_SecureHash
        API->>DB: Update Payment PAID
        API->>DB: Update Booking CONFIRMED
        API->>DB: Update seats BOOKED
        API-->>VNPay: { RspCode:"00", Message:"Confirm Success" }
        VNPay->>API: GET /api/payments/vnpay/return
        API->>API: Verify vnp_SecureHash
        API->>DB: Query/update payment idempotently
        API-->>Browser: Redirect to app return URL or JSON result
        App->>API: GET /api/payments/order/{orderId}
        API->>DB: Query payment + booking
        API-->>App: Payment(PAID), Booking(CONFIRMED)
        App-->>User: Show booking success
    else VNPay failure/cancel
        VNPay->>API: GET /api/payments/vnpay/return with non-00 code
        API->>API: Verify vnp_SecureHash
        API->>DB: Update Payment FAILED
        API->>DB: Update Booking CANCELLED
        API->>DB: Release seats AVAILABLE
        App->>API: GET /api/payments/order/{orderId}
        API-->>App: Payment(FAILED), Booking(CANCELLED)
        App-->>User: Show payment failed/cancelled
    end
```

## 6. View Tickets / Booking History

Used backend routes:

```txt
GET /api/bookings/user/:userId
GET /api/bookings/:id
```

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant App as Android App
    participant API as Backend Booking API
    participant DB as MySQL/Prisma

    User->>App: Open tickets/order history
    App->>API: GET /api/bookings/user/{userId}
    API->>DB: Query bookings by user with movie, showtime, seats, payment
    DB-->>API: Booking[]
    API-->>App: { data: bookings }
    App-->>User: Render ticket list

    User->>App: Open ticket detail
    App->>API: GET /api/bookings/{bookingId}
    API->>DB: Query booking detail
    DB-->>API: Booking detail
    API-->>App: { data: booking }
    App-->>User: Render QR/ticket detail
```

## 7. Reviews

Used backend routes:

```txt
GET /api/reviews/movie/:movieId
GET /api/reviews/me
GET /api/reviews/:id
POST /api/reviews
PUT /api/reviews/:id
DELETE /api/reviews/:id
PATCH /api/reviews/:id/status
```

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant App as Android App
    participant API as Backend Review API
    participant Auth as authMiddleware
    participant DB as MySQL/Prisma

    User->>App: Open movie reviews
    App->>API: GET /api/reviews/movie/{movieId}
    API->>DB: Query published reviews by movie
    DB-->>API: Review[]
    API-->>App: Review list

    User->>App: Create review for a booking
    App->>API: POST /api/reviews with Bearer token
    API->>Auth: Verify JWT
    Auth-->>API: req.userId, req.userRole
    API->>DB: Validate booking belongs to user
    API->>DB: Ensure booking has no existing review
    API->>DB: Create MovieReview
    API->>DB: Refresh movie rating stats
    DB-->>API: Review data
    API-->>App: Created review

    User->>App: Update/delete own review
    App->>API: PUT or DELETE /api/reviews/{id} with Bearer token
    API->>Auth: Verify JWT
    API->>DB: Validate review ownership or admin
    API->>DB: Update/delete review and refresh stats
    API-->>App: Updated/deleted result
```

## 8. Admin Web Panel And Production Deploy

Used backend/admin pieces:

```txt
Admin panel: /admin/
Admin APIs use JWT + requireAdmin middleware.
GitHub Actions: Deploy Backend workflow.
Prisma migration guard blocks destructive SQL.
Trivy Security Scan workflow runs on push/PR.
```

```mermaid
sequenceDiagram
    autonumber
    actor Admin
    participant AdminWeb as Admin Web Panel
    participant API as Backend API
    participant Auth as authMiddleware + requireAdmin
    participant DB as MySQL/Prisma
    participant GitHub as GitHub Actions
    participant VM as Azure VM / PM2 / Nginx

    Admin->>AdminWeb: Login as ADMIN
    AdminWeb->>API: POST /api/auth/login
    API->>DB: Verify user credentials
    API-->>AdminWeb: JWT with role ADMIN

    Admin->>AdminWeb: Create/update movie/cinema/room/showtime
    AdminWeb->>API: POST/PUT admin-protected endpoint with Bearer token
    API->>Auth: Verify JWT and role ADMIN
    Auth-->>API: Authorized
    API->>DB: Create/update records
    DB-->>API: Result
    API-->>AdminWeb: Success response

    Admin->>GitHub: Push code to main
    GitHub->>GitHub: Run Trivy Security Scan
    GitHub->>VM: SSH deploy workflow
    VM->>VM: Pull latest code
    VM->>VM: Write .env from GitHub Secrets
    VM->>VM: npm ci and prisma generate
    VM->>VM: Backup DB
    VM->>VM: Guard migrations against DROP/TRUNCATE/DELETE
    alt Migration safe
        VM->>DB: prisma migrate deploy or safe db push fallback
        VM->>VM: Build admin panel
        VM->>VM: Restart PM2 backend
        VM-->>GitHub: Deploy success
    else Destructive migration detected
        VM-->>GitHub: Deploy failed before DB destructive change
    end
```

## Endpoint Map Used In These Diagrams

```txt
Auth:
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me

Movies/Cinemas/Showtimes:
GET /api/movies/now_showing
GET /api/movies/coming_soon
GET /api/movies/:movieId
GET /api/cinemas
GET /api/showtimes?movieId=&cinemaId=&date=
GET /api/showtimes/:id

Seats:
GET  /api/showtimeseats/:showtimeId
POST /api/showtimeseats/hold
POST /api/showtimeseats/release

Payments:
POST /api/payments/momo/create
POST /api/payments/momo/ipn
GET  /api/payments/momo/return
POST /api/payments/vnpay/create
GET  /api/payments/vnpay/return
GET  /api/payments/vnpay/ipn
GET  /api/payments/order/:orderId

Bookings:
GET /api/bookings/user/:userId
GET /api/bookings/:id
POST /api/bookings/:id/cancel

Reviews:
GET    /api/reviews/movie/:movieId
GET    /api/reviews/me
GET    /api/reviews/:id
POST   /api/reviews
PUT    /api/reviews/:id
DELETE /api/reviews/:id
PATCH  /api/reviews/:id/status
```
