#!/bin/sh

# Run mqttDummyPublisher in the background
node mqttDummyPublisher.js &

# Run the main server
node server.js
