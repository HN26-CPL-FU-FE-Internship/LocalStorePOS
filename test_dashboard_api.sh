#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

pkill -f 'mvnw spring-boot:run' || true
pkill -f 'BackendApplication' || true
sleep 3

cd backend
nohup ./mvnw spring-boot:run -q > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

for i in $(seq 1 120); do
    if grep -q 'Started BackendApplication' /tmp/backend.log; then
        echo "Backend started successfully after ${i}s"
        break
    fi
    sleep 1
done

if ! ps -p $BACKEND_PID > /dev/null; then
    echo "Backend failed to start"
    tail -50 /tmp/backend.log
    exit 1
fi

BASE="http://localhost:8080/restaurant-pos/api"

echo ""
echo "=== Login ==="
LOGIN_RESPONSE=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pos.com","password":"admin"}')
echo "$LOGIN_RESPONSE" | head -c 200
echo ""

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*"' | head -1 | sed 's/"accessToken":"//;s/"$//')

if [ -z "$TOKEN" ]; then
    echo "Failed to get token"
    tail -50 /tmp/backend.log
    exit 1
fi

echo ""
echo "=== Dashboard Sales Performance ==="
curl -s -X GET "$BASE/dashboard/sales-performance" \
  -H "Authorization: Bearer $TOKEN"
echo ""

echo ""
echo "=== Dashboard Stats ==="
curl -s -X GET "$BASE/dashboard/stats" \
  -H "Authorization: Bearer $TOKEN"
echo ""

echo ""
echo "=== Stopping backend ==="
kill $BACKEND_PID 2>/dev/null || true
