#!/bin/bash
# build.sh — Build all ShopWave Docker images
set -e

REGISTRY="${REGISTRY:-docker.io/aladin78}"
TAG="${TAG:-latest}"

echo "🐳 Building ShopWave images (Registry: $REGISTRY, Tag: $TAG)"

SERVICES=(
  "gateway:./gateway"
  "auth:./services/auth"
  "products:./services/products"
  "orders:./services/orders"
  "payments:./services/payments"
  "notifications:./services/notifications"
  "frontend:./frontend"
)

for entry in "${SERVICES[@]}"; do
  NAME="${entry%%:*}"
  PATH_="${entry##*:}"
  echo "  Building $NAME..."
  docker build -t "$REGISTRY/$NAME:$TAG" "$PATH_"
  docker tag "$REGISTRY/$NAME:$TAG" "$REGISTRY/$NAME:latest"
  echo "  ✅ $REGISTRY/$NAME:$TAG"
done

echo "✅ All images built successfully!"
