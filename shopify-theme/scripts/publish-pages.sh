#!/usr/bin/env bash
set -euo pipefail

repository_root="$(git rev-parse --show-toplevel)"
demo_path="shopify-theme/html-demo"

if ! git -C "$repository_root" diff --quiet -- "$demo_path" ||
   ! git -C "$repository_root" diff --cached --quiet -- "$demo_path"; then
  printf '%s\n' 'Commit HTML demo changes before publishing.' >&2
  exit 1
fi

# Publish only the standalone HTML storefront, never the surrounding project.
git -C "$repository_root" subtree push --prefix="$demo_path" origin gh-pages
