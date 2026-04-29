#!/bin/bash

echo "🔐 Testing Admin Panel API..."
echo ""

# Login and get token
echo "1️⃣  Login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@test.com","password":"Admin@123"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Login failed!"
  echo $LOGIN_RESPONSE | jq .
  exit 1
fi

echo "✅ Login successful! Token: ${TOKEN:0:50}..."
echo ""

# Test Statistics
echo "2️⃣  Testing Statistics..."
STATS=$(curl -s http://localhost:4000/api/admin/statistics \
  -H "Authorization: Bearer $TOKEN")
echo $STATS | jq .
echo ""

# Test Create User
echo "3️⃣  Testing Create User..."
NEW_USER=$(curl -s -X POST http://localhost:4000/api/admin/users \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "email": "testuser'$(date +%s)'@test.com",
    "password": "Test@123",
    "fullName": "Test User",
    "role": "PATIENT"
  }')
echo $NEW_USER | jq .
echo ""

# Test Get Users
echo "4️⃣  Testing Get Users..."
USERS=$(curl -s http://localhost:4000/api/admin/users \
  -H "Authorization: Bearer $TOKEN")
echo $USERS | jq '.data.users | length' | xargs echo "Total users:"
echo ""

# Test Create Doctor
echo "5️⃣  Testing Create Doctor..."
NEW_DOCTOR=$(curl -s -X POST http://localhost:4000/api/admin/doctors \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "email": "doctor'$(date +%s)'@test.com",
    "password": "Doctor@123",
    "fullName": "Dr. Test",
    "specialty": "Cardiology",
    "yearsExperience": 5
  }')
echo $NEW_DOCTOR | jq .
echo ""

echo "✅ All tests completed!"
