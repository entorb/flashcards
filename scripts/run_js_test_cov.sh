#!/bin/sh

cd "$(dirname "$0")/.."

pnpm run test:cov
