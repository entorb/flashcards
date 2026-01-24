#!/bin/sh

# ensure we are in the root dir
cd $(dirname $0)/..

# exit upon error
set -e

# remove old node_modules
rm -rf node_modules
for app in 1x1 voc lwk; do
  echo === $app ===
  rm -rf $app/node_modules
done

pnpm up
for app in 1x1 voc lwk; do
  echo === $app ===
  pnpm up
done

pnpm run check
echo "start 'pnpm run dev' and press Enter"
read ok
pnpm run cy:run

echo DONE
