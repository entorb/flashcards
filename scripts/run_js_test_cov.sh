#!/bin/sh

cd "$(dirname "$0")/.." || exit 1

pnpm run test:cov
