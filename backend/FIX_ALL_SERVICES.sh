#!/bin/bash

# Fix script for all backend services to resolve HealthChecker and Consul issues
# This script disables service registry for development and fixes common issues

echo "🔧 Fixing all backend services..."

# Services to fix
services=("admin-service" "field-service" "user-service" "crop-service")

for service in "${services[@]}"; do
    echo ""
    echo "📦 Processing $service..."
    
    cd "/workspace/digital-latest/backend/$service" || continue
    
    # Check if server.js exists
    if [ ! -f "server.js" ]; then
        echo "⚠️  server.js not found in $service, skipping..."
        continue
    fi
    
    # Create backup
    cp server.js server.js.backup-fix-$(date +%s)
    echo "✅ Created backup of server.js"
    
    # Fix the server.js file by commenting out service registry
    echo "🔧 Applying service registry fix..."
    
    # Use sed to comment out the service registry section
    sed -i '/ServiceRegistry/,/});/ {
        s/^/\/\/ /g
        s/\/\/ \/\/ /\//g
    }' server.js
    
    # Also comment out the import if it exists
    sed -i 's/^const { ServiceRegistry.*$/\/\/ &/' server.js
    
    echo "✅ Applied fix to $service"
done

echo ""
echo "🎉 Service fixes completed!"
echo ""
echo "📋 Next steps:"
echo "1. Install dependencies for each service: cd backend/service-name && npm install"
echo "2. Start each service: npm start"
echo "3. The blockchain-service is already fixed and running on port 3011"
echo ""
echo "🔍 Service ports:"
echo "- admin-service: 3003"
echo "- field-service: 3005" 
echo "- user-service: 3001"
echo "- blockchain-service: 3011 (already running)"