# VNPay FE Integration Guide

Base URL:

```txt
http://uit-cinema.koreacentral.cloudapp.azure.com/api
```

## Summary

Flow for VNPay payment:

```txt
1. User selects seats.
2. FE calls hold seats API.
3. FE calls create VNPay payment API.
4. FE opens data.payUrl in browser/webview.
5. User pays on VNPay sandbox page using NCB test card.
6. VNPay redirects to backend return URL.
7. FE checks payment status by orderId.
```

Important:

```txt
For sandbox testing, do not rely on scanning QR with a real banking app.
Open data.payUrl and pay with the NCB test card.
```

## 1. Get Seats By Showtime

Request:

```http
GET /showtimeseats/:showtimeId
```

Example:

```http
GET /showtimeseats/60
```

Response example:

```json
{
  "message": "Success",
  "data": [
    {
      "id": 3425,
      "showtimeId": 60,
      "seatId": 49,
      "status": "AVAILABLE",
      "holdUntil": null,
      "heldBy": null,
      "seat": {
        "id": 49,
        "roomId": 2,
        "seatNumber": "A1"
      }
    }
  ]
}
```

Use `seatId` when holding/creating payment, not `id`.

## 2. Hold Seats

Request:

```http
POST /showtimeseats/hold
Content-Type: application/json
```

Body:

```json
{
  "userId": 2,
  "showtimeId": 60,
  "seatIds": [49, 51]
}
```

Success response:

```json
{
  "holdUntil": "2026-06-28T13:23:40.953Z"
}
```

Error example:

```json
{
  "message": "Some seats were just taken"
}
```

After hold succeeds, call create payment before `holdUntil` expires.

## 3. Create VNPay Payment

Request:

```http
POST /payments/vnpay/create
Content-Type: application/json
```

Body:

```json
{
  "userId": 2,
  "showtimeId": 60,
  "seatIds": [49, 51]
}
```

Success response:

```json
{
  "message": "VNPay payment created",
  "data": {
    "bookingId": 55,
    "paymentId": 54,
    "amount": 40000,
    "orderId": "VNPAY_55_1782652734477",
    "requestId": "VNPAY_55_1782652734477_710591",
    "payUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...",
    "qrCodeUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...",
    "deeplink": null
  }
}
```

Error examples:

```json
{
  "message": "Invalid input"
}
```

```json
{
  "message": "Some seats are invalid or expired"
}
```

```json
{
  "message": "Some seats already have a pending or confirmed booking"
}
```

## 4. Open VNPay Payment Page

Use:

```js
window.location.href = response.data.data.payUrl;
```

For mobile/webview:

```js
open(response.data.data.payUrl);
```

If FE wants to display a QR:

```js
renderQrCode(response.data.data.qrCodeUrl);
```

Note:

```txt
qrCodeUrl is currently the VNPay payment URL.
Rendering it as a QR lets another device open the VNPay sandbox page.
For stable sandbox testing, use payUrl directly.
```

## 5. Test Payment On VNPay Sandbox

On VNPay payment page, choose ATM/domestic card and use:

```txt
Bank: NCB
Card number: 9704198526191432198
Card holder: NGUYEN VAN A
Issue date: 07/15
OTP: 123456
```

Do not use real cards for sandbox testing.

## 6. VNPay Return And IPN

Backend endpoints already exist:

```txt
GET /payments/vnpay/return
GET /payments/vnpay/ipn
```

FE does not need to call these manually.

VNPay redirects/calls backend with query params like:

```txt
vnp_TxnRef
vnp_ResponseCode
vnp_TransactionStatus
vnp_Amount
vnp_SecureHash
```

Backend verifies `vnp_SecureHash` and updates database:

```txt
vnp_ResponseCode = "00" and vnp_TransactionStatus = "00"
=> Payment status PAID
=> Booking status CONFIRMED
=> Seats BOOKED
```

Otherwise:

```txt
Payment status FAILED
Booking status CANCELLED
Seats AVAILABLE
```

## 7. Check Payment Status

After returning from VNPay, FE can check the payment by `orderId`.

Request:

```http
GET /payments/order/:orderId
```

Example:

```http
GET /payments/order/VNPAY_55_1782652734477
```

Response example:

```json
{
  "data": {
    "id": 54,
    "bookingId": 55,
    "provider": "VNPAY",
    "amount": "40000",
    "currency": "VND",
    "status": "PAID",
    "orderId": "VNPAY_55_1782652734477",
    "requestId": "VNPAY_55_1782652734477_710591",
    "transId": "14423890",
    "payUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...",
    "qrCodeUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...",
    "deeplink": null,
    "rawResponse": {},
    "createdAt": "2026-06-28T13:18:54.000Z",
    "updatedAt": "2026-06-28T13:20:10.000Z",
    "booking": {
      "id": 55,
      "status": "CONFIRMED",
      "totalPrice": "40000"
    }
  }
}
```

Possible payment statuses:

```txt
PENDING
PAID
FAILED
CANCELLED
```

## FE Pseudocode

```js
const API_BASE_URL = "http://uit-cinema.koreacentral.cloudapp.azure.com/api";

async function payWithVnpay({ userId, showtimeId, seatIds }) {
  await fetch(`${API_BASE_URL}/showtimeseats/hold`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, showtimeId, seatIds })
  });

  const paymentRes = await fetch(`${API_BASE_URL}/payments/vnpay/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, showtimeId, seatIds })
  });

  const paymentJson = await paymentRes.json();

  if (!paymentRes.ok) {
    throw new Error(paymentJson.message || "Create VNPay payment failed");
  }

  const { payUrl, orderId } = paymentJson.data;

  localStorage.setItem("pendingPaymentOrderId", orderId);
  window.location.href = payUrl;
}
```

After app/browser returns:

```js
async function checkPaymentStatus(orderId) {
  const res = await fetch(`${API_BASE_URL}/payments/order/${orderId}`);
  const json = await res.json();
  return json.data;
}
```

## Quick Notes For The FE Team

```txt
Use /payments/vnpay/create for VNPay.
Open data.payUrl.
Render data.qrCodeUrl only if you want QR UI.
Sandbox test should use NCB card, not real banking app QR.
Use /payments/order/:orderId to verify final status.
```
