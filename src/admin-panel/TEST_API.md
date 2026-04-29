# API Testing Guide

## Test với curl

### 1. Login và get token
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@test.com","password":"Admin@123"}'
```

Lấy token từ response và dùng cho các requests sau.

### 2. Get Statistics
```bash
curl http://localhost:4000/api/admin/statistics \
  -H 'Authorization: Bearer YOUR_TOKEN_HERE'
```

### 3. Create User
```bash
curl -X POST http://localhost:4000/api/admin/users \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_TOKEN_HERE' \
  -d '{
    "email": "testuser@example.com",
    "password": "Test@123",
    "fullName": "Test User",
    "role": "PATIENT"
  }'
```

### 4. Get All Users
```bash
curl http://localhost:4000/api/admin/users \
  -H 'Authorization: Bearer YOUR_TOKEN_HERE'
```

### 5. Create Doctor
```bash
curl -X POST http://localhost:4000/api/admin/doctors \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_TOKEN_HERE' \
  -d '{
    "email": "doctor@example.com",
    "password": "Doctor@123",
    "fullName": "Dr. Smith",
    "specialty": "Cardiology",
    "yearsExperience": 10,
    "clinicName": "Health Clinic"
  }'
```

## Common Issues & Fixes

### Issue: "Cannot load statistics"
**Possible causes:**
1. Token expired or invalid
2. User doesn't have ADMIN role
3. Backend not running

**Fix:**
1. Login again to get new token
2. Verify user role in database
3. Check backend is running on port 4000

### Issue: "Cannot create user"
**Possible causes:**
1. Email already exists
2. Missing required fields
3. Invalid password format

**Fix:**
1. Use different email
2. Check all required fields: email, password, fullName, role
3. Password should be strong (min 8 chars, uppercase, lowercase, number)

### Issue: "401 Unauthorized"
**Fix:**
- Check Authorization header format: `Bearer YOUR_TOKEN`
- Token must be valid and not expired
- User must have ADMIN role

## Testing in Browser Console

```javascript
// Get token from localStorage
const token = localStorage.getItem('token');

// Test statistics
fetch('http://localhost:4000/api/admin/statistics', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(console.log);

// Test create user
fetch('http://localhost:4000/api/admin/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    email: 'newuser@test.com',
    password: 'Test@123',
    fullName: 'New User',
    role: 'PATIENT'
  })
})
.then(r => r.json())
.then(console.log);
```

## Expected Response Format

All responses follow this format:

### Success Response:
```json
{
  "success": true,
  "data": {
    // actual data here
  }
}
```

### Error Response:
```json
{
  "success": false,
  "message": "Error description"
}
```
