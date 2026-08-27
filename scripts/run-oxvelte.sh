#!/bin/sh
# Runs oxvelte with the cargo bin directory on PATH, installing the PINNED revision first when the
# binary is missing or when the one on this machine came from somewhere else. Every caller goes
# through here - `bun run lint:svelte`, the pre-push hook and the `Linting Svelte templates` step
# of the Run Tests workflow - so a workstation and CI lint with the same binary or neither does.
#
# POSIX sh, not bash: see scripts/install-oxvelte.sh.
set -eu

SCRIPT_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"

if [ -f "$HOME/.cargo/env" ]; then
	# shellcheck disable=SC1091
	. "$HOME/.cargo/env"
fi
PATH="${CARGO_HOME:-$HOME/.cargo}/bin:$HOME/.cargo/bin:$PATH"
export PATH

"$SCRIPT_DIR/install-oxvelte.sh"

exec oxvelte "$@"
