#!/usr/bin/env bash
set -euo pipefail
# Legacy convenience entrypoint; matrix runner owns evaluation and fail-closed reporting.
cd "$(dirname "$0")/.."
node scripts/review-matrix.mjs --live "$@"
