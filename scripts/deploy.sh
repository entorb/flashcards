#!/bin/sh
# ensure we are in the root dir
cd $(dirname $0)/..

# exit upon error
set -e

# cleanup
rm -f .DS_Store
rm -f */.DS_Store

rsync -rhv --delete --no-perms --ignore-times www/index.* entorb@entorb.net:html/flashcards/

pnpm run check
pnpm run cy:run

# # migration
# rsync -rhv --delete --no-perms --ignore-times www/1x1/index.html entorb@entorb.net:html/1x1/
# rsync -rhv --delete --no-perms --ignore-times www/voc/index.html entorb@entorb.net:html/voc/

for app in 1x1 voc lwk; do
  pnpm run build:$app
  rsync -rhv --delete --no-perms --ignore-times apps/$app/dist/ entorb@entorb.net:html/fc-$app/
  rsync -rhv --delete --no-perms --ignore-times apps/$app/assets/icon.svg entorb@entorb.net:html/fc-$app/icon.svg
done

echo DONE
