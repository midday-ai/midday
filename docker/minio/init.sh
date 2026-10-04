#!/bin/sh
set -e
mc alias set local http://minio:9000 midday midday-secret
mc mb --ignore-existing local/vault local/avatars local/apps local/institution-logos
mc anonymous set download local/avatars
mc anonymous set download local/apps
mc anonymous set download local/institution-logos
echo "storage ready"
