#!/bin/sh

# ensure we are in the root dir
script_dir=$(cd $(dirname $0) && pwd)
cd $script_dir/..

rsync -rhv --delete --no-perms --ignore-times www/* entorb@entorb.net:html/flashcards/

pnpm run check || exit 1
pnpm run cy:run || exit 1

for app in 1x1 voc; do
  pnpm run build:$app || exit 1
  rsync -rhv --delete --no-perms --ignore-times apps/$app/dist/ entorb@entorb.net:html/$app/
  rsync -rhv --delete --no-perms --ignore-times apps/$app/assets/icon.svg entorb@entorb.net:html/$app/icon.svg
done
