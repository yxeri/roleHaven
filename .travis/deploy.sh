#!/bin/bash

# Travis setup procedure
# gem install travis
# travis login
# ssh-keygen -t rsa -b 4096 -f ./.travis/deploy_key
# travis encrypt-file ./.travis/deploy_key ./.travis/deploy_key.enc --add
# echo ".travis/deploy_key" >> .gitignore
# rm ./.travis/deploy_key
# In Github, add deploy_key.pub contents as a deploy key with push permissions

# Check that we're on the master branch
if [ "${TRAVIS_BRANCH}" != "master" ]; then
    echo "Branch is not master"
    exit 1
fi

# If Travis reacts to push events, our git push in this very script
# will trigger another Travis build. To avoid an infinite bump loop,
# check if HEAD already is tagged with a semver tag.
git tag --contains HEAD | grep -q "[0-9]*\.[0-9]*\.[0-9]*"
if [ $? -eq 0 ]; then
  echo "HEAD is already tagged with a version. Doing nothing."
else
  npm install -g reliable-bump
  reliable-bump
  git status

  # Push to remote
  git push --verbose --follow-tags deploy master
fi
