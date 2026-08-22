#!/bin/sh

# ensure we are in the root dir
cd $(dirname "$0")/..

# exit upon error
set -e

echo "##  brew: update pnpm and node"
echo "Update Node and pnpm via brew? [y/N]"
read -r REPLY
if [ "$REPLY" = "y" ] || [ "$REPLY" = "Y" ]; then
  brew update
  brew upgrade node@24
  brew upgrade pnpm
  pnpm self-update

  # update package.json with new versions
  NODE_VER=$(node --version | sed 's/v//')
  PNPM_VER=$(pnpm --version)
  PNPM_MANAGER="pnpm@$PNPM_VER"
  node -e "
    const pkg = JSON.parse(require('fs').readFileSync('package.json','utf8'));
    pkg.packageManager = '$PNPM_MANAGER';
    pkg.engines.node = '>=$NODE_VER';
    pkg.engines.pnpm = '>=$PNPM_VER';
    require('fs').writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
  "
fi

echo "## delete old node_modules and lock"
rm -rf node_modules
rm -f pnpm-lock.yaml
rm -rf packages/shared/node_modules
rm -f packages/shared/pnpm-lock.yaml
for app in 1x1 div eta lwk pum voc; do
  rm -rf apps/$app/node_modules
  rm -f apps/$app/pnpm-lock.yaml
done

echo "## update root packages"
pnpm self-update
pnpm up -L
pnpm exec biome migrate --write

echo "## update shared packages"
cd packages/shared
pnpm up -L
cd ../..

for app in 1x1 div eta lwk pum voc; do
  echo "## updating $app packages"
  cd apps/$app
  pnpm up -L
  cd ../..
done

if ! pnpm audit; then
  echo "## fix audit findings"
  pnpm audit --fix update
fi
if ! pnpm audit; then
  pnpm audit --fix override
  pnpm install
fi

echo "## check"
pnpm run check

if [ -n "$(git status --porcelain)" ]; then
  echo "## git push"
  git add .
  git commit -m "package update and pnpm audit findings"
  git push
fi

echo "## Cypress"
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

echo "update DONE, not yet deployed"
