#!/bin/bash

# Deploy script for inidepok
# Run this on the server after cloning the repo

set -e

echo "=== Deploying IniDepok ==="

# Navigate to app directory
cd /opt/apps/inidepok

# Pull latest changes
echo "Pulling latest changes..."
git pull origin main

# Create database if not exists
echo "Setting up database..."
docker exec -i kilasindonesia-db psql -U kilasindonesia -c "CREATE DATABASE inidepok;" 2>/dev/null || echo "Database already exists"

# Build and start the container
echo "Building and starting container..."
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# Wait for container to start
echo "Waiting for container to start..."
sleep 10

# Run Prisma migrations
echo "Running database migrations..."
docker exec -i inidepok-app npx prisma migrate deploy

# Copy nginx config
echo "Setting up nginx..."
cp nginx/inidepok.conf /opt/apps/kilasindonesia/nginx/conf.d/

# Reload nginx
docker exec -i kilasindonesia-nginx nginx -s reload

echo "=== Deployment complete ==="
echo "Site should be available at https://inidepok.com"
