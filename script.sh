#!/bin/bash
echo "\"use strict\"" > script.js
cat controls.js db.js flights.js itineraries.js map.js \
parameters.js ticket.js >> script.js
echo "db_login()" >> script.js
