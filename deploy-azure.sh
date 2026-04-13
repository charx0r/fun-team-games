#!/usr/bin/env bash
# One-shot deploy to Azure Container Apps. Requires `az` CLI logged in.
# Builds the Dockerfile from this folder, pushes to a managed registry,
# and runs a single always-on replica with WebSocket-capable ingress.

set -euo pipefail

RESOURCE_GROUP="${RESOURCE_GROUP:-squint-games-rg}"
LOCATION="${LOCATION:-eastus}"
ENV_NAME="${ENV_NAME:-squint-games-env}"
APP_NAME="${APP_NAME:-squint-games}"

echo "→ Resource group:   $RESOURCE_GROUP ($LOCATION)"
echo "→ Container env:    $ENV_NAME"
echo "→ App name:         $APP_NAME"

az group create \
  --name "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --only-show-errors >/dev/null

# `az containerapp up` creates the environment, builds the image from
# the current directory, pushes it, and deploys. Re-running updates.
az containerapp up \
  --resource-group "$RESOURCE_GROUP" \
  --name "$APP_NAME" \
  --environment "$ENV_NAME" \
  --location "$LOCATION" \
  --source . \
  --ingress external \
  --target-port 3000

# Pin to exactly one always-on replica (disables scale-to-zero + scale-out).
az containerapp update \
  --resource-group "$RESOURCE_GROUP" \
  --name "$APP_NAME" \
  --min-replicas 1 \
  --max-replicas 1 \
  --only-show-errors >/dev/null

FQDN=$(az containerapp show \
  --resource-group "$RESOURCE_GROUP" \
  --name "$APP_NAME" \
  --query properties.configuration.ingress.fqdn -o tsv)

echo ""
echo "✅ Deployed. Open: https://$FQDN"
