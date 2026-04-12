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
for app in 1x1 div eta lwk pum voc; do
  rm -rf $app/node_modules
  rm -f $app/pnpm-lock.yaml
done

echo === updating root packages ===
pnpm up
pnpm exec biome migrate --write

echo === updating shared packages ===
cd packages/shared
pnpm up
cd ../..

for app in 1x1 div eta lwk pum voc; do
  echo === updating $app packages ===
  cd apps/$app
  pnpm up
  cd ../..
done


echo === check ===
pnpm run check

# start dev server in background, bypassing pnpm wrapper to remove warning upon killing process
pnpm run dev &
# ./node_modules/.bin/vite > /dev/null 2>&1 &
DEV_PID=$!

# wait for dev server to be ready (port 5173 is Vite's default)
echo "Waiting for dev server..."
while ! nc -z localhost 5173; do
  sleep 0.5
done
echo "Dev server ready (PID $DEV_PID)"

# run Cypress
for app in 1x1 div eta lwk pum voc; do
  pnpm run cy:run:$app
done

kill $DEV_PID
wait $DEV_PID 2>/dev/null || true

echo "DONE"
