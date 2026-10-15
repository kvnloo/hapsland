#!/usr/bin/env bash
set -euo pipefail

# The project settings live at the canonical Git root, not this example folder.
cd "$(dirname "$0")/../../.."
if ! git rev-parse --show-toplevel >/dev/null 2>&1; then
  echo "Run inside the Hapsland fork Git working tree." >&2
  exit 2
fi
if ! command -v hapsland >/dev/null 2>&1; then
  echo "Install a supported Hapsland CLI and configure review credentials first." >&2
  exit 2
fi

hapsland rules show --id meaningless_combinations
printf "\nLoose type: expect a finding (hypothesis, not guaranteed)\n"
hapsland rules check \
  --path examples/road-status-demo/src/flat-road-state.ts \
  --line 1 --id meaningless_combinations
printf "\nTagged type: expect clear (hypothesis, not guaranteed)\n"
hapsland rules check \
  --path examples/road-status-demo/src/tagged-road-state.ts \
  --line 1 --id meaningless_combinations
