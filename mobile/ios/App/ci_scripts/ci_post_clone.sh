#!/bin/sh
set -eu

cd "$CI_PRIMARY_REPOSITORY_PATH/mobile"
npm ci
npm run sync
