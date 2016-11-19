[![npm version](http://img.shields.io/npm/v/simple-redis-cache.svg)](https://npmjs.org/package/simple-redis-cache)
[![Build Status](https://travis-ci.org/pasupulaphani/simple-redis-cache.svg?branch=master)](https://travis-ci.org/pasupulaphani/simple-redis-cache)
[![Coverage Status](https://coveralls.io/repos/github/pasupulaphani/simple-redis-cache/badge.svg?branch=master)](https://coveralls.io/github/pasupulaphani/simple-redis-cache?branch=master)
[![dependencies Status](https://david-dm.org/pasupulaphani/simple-redis-cache/status.svg)](https://david-dm.org/pasupulaphani/simple-redis-cache)
[![Gratipay donate button](https://img.shields.io/badge/gratipay-donate-yellow.svg)](https://gratipay.com/simple-redis-store/)

# simple-redis-cache
Redis cache ready to scale with node-pool support

> Note: This lib is in beta

## Prerequisites

This module requires nodejs v4 or above as it has dependencies on constious es6 components such as Map, Set, Promise etc.

### Getting started

    npm install simple-redis-cache

    const RedisCache = require("simple-redis-cache");
    const cache = new RedisCache();

    // set
    cache.set("key", "value");

### Run tests

    bash test.sh
