#!/bin/bash

# Stop the screen if it's running
screen -S backend_deploy -X quit

# Pull the latest changes from GitLab
git pull

# Merge dotenvs with new variables
./merge-dotenv.sh

# Start the screen with the "deno task run" command
screen -dmS backend_deploy yarn run run