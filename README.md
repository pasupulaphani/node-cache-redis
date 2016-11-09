[![Build Status](https://travis-ci.org/pasupulaphani/angular-gist-embed.svg?branch=master)](https://travis-ci.org/pasupulaphani/angular-gist-embed) [![npm version](https://badge.fury.io/js/simple-redis-cache.svg)](https://badge.fury.io/js/simple-redis-cache) [![Test Coverage](https://codeclimate.com/github/pasupulaphani/simple-redis-cache/badges/coverage.svg)](https://codeclimate.com/github/pasupulaphani/simple-redis-cache/coverage) [![Code Climate](https://codeclimate.com/github/pasupulaphani/simple-redis-cache/badges/gpa.svg)](https://codeclimate.com/github/pasupulaphani/simple-redis-cache)

# simple-redis-cache
Redis cache ready to scale with node-pool support

> Note: This lib is still in alpha

### Getting started

    npm install simple-redis-cache

    var RedisStore = require("simple-redis-cache");
    var cache = new RedisStore();

    // set
    cache.set("key", "value");
