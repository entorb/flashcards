#!/bin/sh
SCRIPT_DIR="$(dirname "$0")"
cd "$SCRIPT_DIR/.."

# exit upon error
set -e

echo "## Node and PNPM Versions"
# use the versions provided by the system, never install them here (brew upgrade is done in korrekturleser only)
NODE_VER=$(node --version | sed 's/v//')
# query outside of the repo, inside pnpm reports the version pinned in package.json
PNPM_VER=$(cd / && pnpm --version)
PNPM_MANAGER="pnpm@$PNPM_VER"
printf '%s\n' "${NODE_VER%%.*}" >.nvmrc
node -e "
  const pkg = JSON.parse(require('fs').readFileSync('package.json','utf8'));
  pkg.packageManager = '$PNPM_MANAGER';
  pkg.engines ??= {};
  pkg.engines.node = '>=$NODE_VER';
  pkg.engines.pnpm = '>=$PNPM_VER';
  require('fs').writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"

APPS="1x1 div eta lwk pum voc"

echo "## Node"
echo "### delete old node_modules and lock"
rm -rf node_modules packages/shared/node_modules
rm -f pnpm-lock.yaml packages/shared/pnpm-lock.yaml
for app in $APPS; do
  rm -rf "apps/$app/node_modules"
  rm -f "apps/$app/pnpm-lock.yaml"
done

echo "### Node packages"
pnpm up --latest
pnpm exec biome migrate --write
# npm i baseline-browser-mapping@latest -D
# npx update-browserslist-db@latest
(cd packages/shared && pnpm up --latest)
for app in $APPS; do
  (cd "apps/$app" && pnpm up --latest)
done

echo "### Node package audit"
./scripts/chk_js_package_audit.sh

echo "## Code checks"
echo "### Prek autoupdate"
prek autoupdate

echo "### run_checks.sh"
./scripts/run_checks.sh

echo "### run_e2e.sh"
./scripts/run_e2e.sh

echo "## Git"

if [ -n "$(git status --porcelain)" ]; then
  echo "## git push"
  git add pnpm-lock.yaml
  git diff --staged --quiet -- pnpm-lock.yaml || git commit -m "chore(deps): Lock"

  git add package.json 'apps/*/package.json' 'packages/*/package.json' pnpm-workspace.yaml biome.json .pre-commit-config.yaml .nvmrc
  git commit -m "chore(deps): Package update" || true
  git push
fi

echo "update DONE, not yet deployed"
