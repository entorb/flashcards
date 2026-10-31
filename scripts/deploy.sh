#!/bin/sh
set -e
cd "$(dirname "$0")/.."

# cleanup
rm -f .DS_Store
rm -f -- ./*/.DS_Store

APPS="1x1 div eta lwk pum voc"

echo "## Checks"
echo "### Code checks"
./scripts/run_checks.sh
./scripts/run_spelling.sh

echo "### E2E tests"
./scripts/run_e2e.sh

echo "## Frontend Build and Transfer"
rsync -rhv --delete --no-perms www/index.* entorb8@mab.uberspace.de:html/flashcards/
rsync -rhv --delete --no-perms www/styles.css entorb8@mab.uberspace.de:html/flashcards/

for app in $APPS; do
  echo "### $app"
  pnpm run "build:$app"
  rsync -rhv --delete --no-perms "apps/$app/dist/" "entorb8@mab.uberspace.de:html/fc-$app/"
  rsync -rhv --delete --no-perms "apps/$app/assets/icon.svg" "entorb8@mab.uberspace.de:html/fc-$app/icon.svg"
done

echo "## DONE"
