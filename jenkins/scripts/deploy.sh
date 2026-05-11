#!/bin/bash
# deploy.sh — Deploy ShopWave to Kubernetes using Helm
set -e

RELEASE="${RELEASE:-aladin78}"
NAMESPACE="${NAMESPACE:-aladin78}"
CHART_PATH="${CHART_PATH:-./helm}"
ENV="${ENV:-staging}"
TAG="${TAG:-latest}"
REGISTRY="${REGISTRY:-docker.io/aladin78}"

echo "🚀 Deploying $RELEASE to Kubernetes (env: $ENV, tag: $TAG)"

VALUES_FILE="$CHART_PATH/values.yaml"
if [ "$ENV" == "production" ]; then
  VALUES_FILE="$CHART_PATH/values-prod.yaml"
fi

# Build image tag overrides
SERVICES=(gateway auth products orders payments notifications frontend)
TAG_ARGS=""
for svc in "${SERVICES[@]}"; do
  TAG_ARGS="$TAG_ARGS --set $svc.tag=$TAG"
done

helm upgrade --install "$RELEASE" "$CHART_PATH" \
  --namespace "$NAMESPACE" \
  --create-namespace \
  -f "$VALUES_FILE" \
  --set global.imageRegistry="$REGISTRY" \
  $TAG_ARGS \
  --wait \
  --timeout 10m \
  --atomic

echo "✅ Deployment complete!"
kubectl get pods -n "$NAMESPACE"
