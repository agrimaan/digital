
#!/bin/bash
# Script to fix Dockerfile casing issues

set -e

cd /opt/agm/digital

echo "Fixing Dockerfile casing issues..."

# Fix frontend service Dockerfiles
for service in frontend/*/; do
    if [ -f "$service/Dockerfile" ]; then
        echo "Fixing $service/Dockerfile"
        sed -i 's/FROM node:18-alpine as build/FROM node:18-alpine AS build/g' "$service/Dockerfile"
        sed -i 's/FROM node:16-alpine as build/FROM node:18-alpine AS build/g' "$service/Dockerfile"
    fi
done

# Fix backend service Dockerfiles
for service in backend/*/; do
    if [ -f "$service/Dockerfile" ]; then
        echo "Fixing $service/Dockerfile"
        sed -i 's/FROM node:18-alpine as build/FROM node:18-alpine AS build/g' "$service/Dockerfile"
    fi
done

echo "All Dockerfile casing issues fixed!"

