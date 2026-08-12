#!/bin/sh
# First-run setup on a new machine: install deps, run the checks, start dev server.
set -e
npm install
npm test
npm run dev
