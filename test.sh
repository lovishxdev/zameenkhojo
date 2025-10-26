#!/bin/bash

echo "🧪 ZameenKhojo Backend Test Script"
echo "=================================="

# Check if server is running
echo "Testing server connection..."
curl -s http://localhost:3000/api/properties > /dev/null

if [ $? -eq 0 ]; then
    echo "✅ Server is running"

    echo "🔍 Testing API endpoints..."

    # Test properties endpoint
    echo "Testing GET /api/properties..."
    curl -s http://localhost:3000/api/properties | head -c 100
    echo ""

    # Test contact form
    echo "Testing POST /api/contact..."
    curl -s -X POST http://localhost:3000/api/contact \
      -H "Content-Type: application/json" \
      -d '{"name":"Test User","email":"test@test.com","phone":"1234567890","subject":"buying","message":"Test message"}' \
      | head -c 100
    echo ""

    # Test admin login
    echo "Testing POST /api/admin/login..."
    curl -s -X POST http://localhost:3000/api/admin/login \
      -H "Content-Type: application/json" \
      -d '{"username":"admin","password":"admin123"}' \
      | head -c 100
    echo ""

    echo "✅ All tests completed!"
else
    echo "❌ Server is not running"
    echo "Please start the server with: npm start"
fi