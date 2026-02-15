#!/bin/sh

# ensure we are in the root dir
cd $(dirname $0)/..

# exit upon error
set -e

echo === deleting old node_modules and lock ===
rm -rf node_modules
rm -f pnpm-lock.yaml
rm -rf packages/shared/node_modules
rm -f packages/shared/pnpm-lock.yaml
for app in 1x1 eta lwk voc; do
  rm -rf $app/node_modules
  rm -f $app/pnpm-lock.yaml
done

echo === updating root packages ===
pnpm up

echo === updating shared packages ===
cd packages/shared
pnpm up
cd ../..

for app in 1x1 eta lwk voc; do
  echo === updating $app packages ===
  cd apps/$app
  pnpm up
  cd ../..
done


echo === check ===
pnpm run check

echo === cypress ===
echo "start 'pnpm run dev' and press Enter"
read ok
pnpm run cy:run

echo DONE
