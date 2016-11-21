[![npm version](http://img.shields.io/npm/v/simple-redis-cache.svg)](https://npmjs.org/package/simple-redis-cache)
[![Build Status](https://travis-ci.org/pasupulaphani/simple-redis-cache.svg?branch=master)](https://travis-ci.org/pasupulaphani/simple-redis-cache)
[![Coverage Status](https://coveralls.io/repos/github/pasupulaphani/simple-redis-cache/badge.svg?branch=master)](https://coveralls.io/github/pasupulaphani/simple-redis-cache?branch=master)
[![dependencies Status](https://david-dm.org/pasupulaphani/simple-redis-cache/status.svg)](https://david-dm.org/pasupulaphani/simple-redis-cache)
[![Gratipay donate button](https://img.shields.io/badge/gratipay-donate-yellow.svg)](https://gratipay.com/simple-redis-store/)

# simple-redis-cache
Redis cache ready to scale with node-pool support

> Cache Early; Cache Often

> Note: This lib is in beta

## Prerequisites

This module requires nodejs v4 or above as it has dependencies on constious es6 components such as Map, Set, Promise etc.

## Featuring
- Out of the box default configuration (but fully configurable)
- Provides both sync and async API
- Scalable easily, less friction during locking and purging
- Synchronized locking with a semaphore
- Design for multithread environment
- Extensible Logging
- Serialization: Used to serialize values in distributed scenarios, can be configured.
- Flexible Expiration: Through configuration, you can set a default expiration mode and time for each layer.
- Statistics / Counters: Gather statistical information and track caching operations in Performance Monitor as needed.
- Modular Design: Lib comes in many different packages, separating the features and dependencies.

### Getting started

    npm install simple-redis-cache

    var RedisCache = require("simple-redis-cache");
    var cache = new RedisCache();

    // set
    cache.set("key", "value");

### Run tests

    bash test.sh
 
 
### Contributing

Feel free to make changes. Please see the [Contributors' Guide](https://github.com/pasupulaphani/simple-redis-cache/blob/master/CONTRIBUTING.md) for more information on contributing to the documentation.
