#!/bin/sh
if [ -z "docs" ]
then
  echo "No docs folder found to deploy to ghpages"
  exit 1
fi
git add docs && git commit -m 'docs cmit prepublish'
git push origin `git subtree split --prefix docs master`:gh-pages --force
