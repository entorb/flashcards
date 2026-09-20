#!/bin/sh
cd "$(dirname "$0")/.." || exit 1

# exit upon error
set -e

# cleanup
rm -f .DS_Store
rm -f -- ./*/.DS_Store

APPS="1x1 div eta lwk pum voc"

echo "## Checks"
echo "### Code checks"
./scripts/run_checks.sh

echo "### E2E tests"
./scripts/run_e2e.sh

echo "## Frontend Build and Transfer"
rsync -rhv --delete --no-perms www/index.* entorb@entorb.net:html/flashcards/
rsync -rhv --delete --no-perms www/styles.css entorb@entorb.net:html/flashcards/

# # migration
# rsync -rhv --delete --no-perms www/1x1/index.html entorb@entorb.net:html/1x1/
# rsync -rhv --delete --no-perms www/voc/index.html entorb@entorb.net:html/voc/

for app in $APPS; do
  echo "### $app"
  pnpm run "build:$app"
  rsync -rhv --delete --no-perms "apps/$app/dist/" "entorb@entorb.net:html/fc-$app/"
  rsync -rhv --delete --no-perms "apps/$app/assets/icon.svg" "entorb@entorb.net:html/fc-$app/icon.svg"
done

echo "## DONE"
