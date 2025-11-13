#!/bin/bash

echo "\ud83e\uddea Testing Agrimaan Backend Services..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test health endpoints
services=(
  "user-service:3002"
  "crop-service:3003"
  "field-service:3004"
  "weather-service:3005"
  "marketplace-service:3006"
  "logistics-service:3007"
  "iot-service:3008"
  "analytics-service:3009"
  "admin-service:3010"
)

echo "\ud83d\udd0d Testing health endpoints..."
for service in "${services[@]}"; do
  IFS=':' read -r name port <<< "$service"
  response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$port/health)
  
  if [ "$response" -eq 200 ]; then
    echo -e "${GREEN}\u2705 $name is healthy${NC}"
  else
    echo -e "${RED}\u274c $name is not responding (HTTP $response)${NC}"
  fi
done

echo ""
echo "\ud83c\udfaf Testing user registration..."
user_response=$(curl -s -X POST http://localhost:3002/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser_'$(date +%s)'",
    "email": "test@'$(date +%s)'.com",
    "password": "testpass123",
    "role": "farmer"
  }')

if echo "$user_response" | grep -q "User created successfully"; then
  echo -e "${GREEN}\u2705 User registration successful${NC}"
  user_id=$(echo "$user_response" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
  echo "User ID: $user_id"
else
  echo -e "${RED}\u274c User registration failed${NC}"
  echo "$user_response"
fi

echo ""
echo "\ud83c\udf31 Testing crop creation..."
if [ -n "$user_id" ]; then
  crop_response=$(curl -s -X POST http://localhost:3003/api/crops \
    -H "Content-Type: application/json" \
    -d '{
      "farmerId": "'$user_id'",
      "name": "Test Crop",
      "plantingDate": "2025-09-27",
      "quantity": 5,
      "unit": "acres"
    }')
  
  if echo "$crop_response" | grep -q '"name":"Test Crop"'; then
    echo -e "${GREEN}\u2705 Crop creation successful${NC}"
    crop_id=$(echo "$crop_response" | grep -o '"_id":"[^"]*"' | cut -d'"' -f4)
    echo "Crop ID: $crop_id"
  else
    echo -e "${RED}\u274c Crop creation failed${NC}"
  fi
fi

echo ""
echo "\ud83c\udfde\ufe0f Testing field creation..."
if [ -n "$user_id" ]; then
  field_response=$(curl -s -X POST http://localhost:3004/api/fields \
    -H "Content-Type: application/json" \
    -d '{
      "farmerId": "'$user_id'",
      "name": "Test Field",
      "size": 10,
      "unit": "acres"
    }')
  
  if echo "$field_response" | grep -q '"name":"Test Field"'; then
    echo -e "${GREEN}\u2705 Field creation successful${NC}"
  else
    echo -e "${RED}\u274c Field creation failed${NC}"
  fi
fi

echo ""
echo "\ud83d\uded2 Testing marketplace creation..."
if [ -n "$user_id" ] && [ -n "$crop_id" ]; then
  marketplace_response=$(curl -s -X POST http://localhost:3006/api/marketplace \
    -H "Content-Type: application/json" \
    -d '{
      "farmerId": "'$user_id'",
      "farmerName": "Test Farmer",
      "cropId": "'$crop_id'",
      "cropName": "Test Crop",
      "quantity": 100,
      "unit": "kg",
      "price": 2.5
    }')
  
  if echo "$marketplace_response" | grep -q '"cropName":"Test Crop"'; then
    echo -e "${GREEN}\u2705 Marketplace item creation successful${NC}"
  else
    echo -e "${RED}\u274c Marketplace item creation failed${NC}"
  fi
fi

echo ""
echo "\ud83d\ude9b Testing logistics creation..."
if [ -n "$user_id" ]; then
  logistics_response=$(curl -s -X POST http://localhost:3007/api/logistics \
    -H "Content-Type: application/json" \
    -d '{
      "orderId": "ORD_'$(date +%s)'",
      "buyerId": "'$user_id'",
      "sellerId": "'$user_id'",
      "cropId": "'$crop_id'",
      "quantity": 50,
      "pickupLocation": {
        "address": "123 Farm Road"
      },
      "deliveryLocation": {
        "address": "456 Market Street"
      }
    }')
  
  if echo "$logistics_response" | grep -q '"orderId"'; then
    echo -e "${GREEN}\u2705 Logistics order creation successful${NC}"
  else
    echo -e "${RED}\u274c Logistics order creation failed${NC}"
  fi
fi

echo ""
echo "\ud83d\udcca Testing analytics..."
analytics_response=$(curl -s -X POST http://localhost:3009/api/analytics \
  -H "Content-Type: application/json" \
  -d '{
    "farmerId": "'$user_id'",
    "fieldId": "test_field",
    "cropId": "'$crop_id'",
    "metricType": "yield",
    "value": 1000,
    "unit": "kg"
  }')

if echo "$analytics_response" | grep -q '"metricType":"yield"'; then
  echo -e "${GREEN}\u2705 Analytics data creation successful${NC}"
else
  echo -e "${RED}\u274c Analytics data creation failed${NC}"
fi

echo ""
echo "\ud83c\udf10 Testing IoT..."
iot_response=$(curl -s -X POST http://localhost:3008/api/sensors/devices \
  -H "Content-Type: application/json" \
  -d '{
    "farmerId": "'$user_id'",
    "fieldId": "test_field",
    "deviceId": "DEV_'$(date +%s)'",
    "name": "Test Sensor",
    "type": "Sensor"
  }')

if echo "$iot_response" | grep -q '"name":"Test Sensor"'; then
  echo -e "${GREEN}\u2705 IoT device creation successful${NC}"
else
  echo -e "${RED}\u274c IoT device creation failed${NC}"
fi

echo ""
echo "\ud83d\udd27 Testing admin..."
admin_response=$(curl -s -X POST http://localhost:3010/api/admin/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin_'$(date +%s)'",
    "email": "admin@'$(date +%s)'.com",
    "password": "adminpass123"
  }')

if echo "$admin_response" | grep -q "Admin created successfully"; then
  echo -e "${GREEN}\u2705 Admin registration successful${NC}"
else
  echo -e "${RED}\u274c Admin registration failed${NC}"
fi

echo ""
echo -e "${GREEN}\ud83c\udf89 System testing complete!${NC}"
echo "Check logs for any detailed errors: tail -f logs/*.log"

