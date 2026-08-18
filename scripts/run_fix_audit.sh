#!/bin/sh

# ensure we are in the root dir
cd $(dirname $0)/..

# exit upon error
set -e

pnpm audit --fix update
pnpm audit --fix override
