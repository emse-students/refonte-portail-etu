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

# Invoked through `sh` rather than executed: two of the four repositories that carry this script
# lost the executable bit on the way into git (a Windows checkout with core.fileMode false), and CI
# then failed with "Permission denied" on a file that runs fine on every workstation. The mode is
# set correctly as well; this line means a lost mode can never break the gate again.
sh "$SCRIPT_DIR/install-oxvelte.sh"

exec oxvelte "$@"
