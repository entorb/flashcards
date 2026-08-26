#!/bin/sh

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

  # update package.json and .nvmrc with new versions
  NODE_VER=$(node --version | sed 's/v//')
  PNPM_VER=$(pnpm --version)
  PNPM_MANAGER="pnpm@$PNPM_VER"
  printf '%s\n' "$NODE_VER" >.nvmrc
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
pnpm up --latest
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

echo "## package audit"
./scripts/chk_js_package_audit.sh

echo "## code checks"
./scripts/run_checks.sh

echo "## Playwright E2E Tests"
# start dev server in background, bypassing pnpm wrapper to remove warning upon killing process
pnpm run dev &
# ./node_modules/.bin/vite > /dev/null 2>&1 &
PID_DEV=$!

# wait for dev server to be ready (port 5173 is Vite's default)
echo "Waiting for dev server..."
while ! nc -z localhost 5173; do
  sleep 0.5
done
echo "Dev server ready (PID $PID_DEV)"

# run Cypress
for app in 1x1 div eta lwk pum voc; do
  pnpm run pw:run:$app
done

if [ -n "$(git status --porcelain)" ]; then
  echo "## git push"
  git add pnpm-lock.yaml
  git diff --staged --quiet -- pnpm-lock.yaml || git commit -m "chore(deps): Lock"
  git add .
  git commit -m "chore(deps): Package update"
  git push
fi

echo "update DONE, not yet deployed"
kill $PID_DEV
wait $PID_DEV 2>/dev/null || true
