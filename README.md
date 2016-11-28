[![npm version](http://img.shields.io/npm/v/simple-redis-cache.svg?style=flat-square)](https://npmjs.org/package/simple-redis-cache)
[![Build Status](https://travis-ci.org/pasupulaphani/simple-redis-cache.svg?branch=master)](https://travis-ci.org/pasupulaphani/simple-redis-cache)
[![Coverage Status](https://coveralls.io/repos/github/pasupulaphani/simple-redis-cache/badge.svg?branch=master)](https://coveralls.io/github/pasupulaphani/simple-redis-cache?branch=master)
[![Dependency Status](https://www.versioneye.com/user/projects/583c520dd2d44d003fb603be/badge.svg?style=flat-square)](https://www.versioneye.com/user/projects/583c520dd2d44d003fb603be)
[![Gratipay donate button](https://img.shields.io/badge/gratipay-donate-yellow.svg?style=flat-square)](https://gratipay.com/simple-redis-store/)

# simple-redis-cache
Redis cache ready to scale with node-pool support

> Note: This lib is in beta

## Prerequisites

This module requires nodejs v4 or above as it has dependencies on es6 components such as Map, Set, Promise etc.

### Getting started

    npm install simple-redis-cache

    const RedisCache = require("simple-redis-cache");
    const cache = new RedisCache();

    // set
    cache.set("key", "value");

#### API

- RedisCache([options])

#### `options` object properties

| Property  | Default   | Description |
|-----------|-----------|-------------|
| name      | Random unique string | Name your pool |
| redisOptions      | ```{url: redis://127.0.0.1:6379}```      | opts from  https://github.com/NodeRedis/node_redis#options-object-properties |
| poolOptions      | null      | opts from https://github.com/coopernurse/node-pool#createpool |
| logger       | null      | Inject your custom logger |

### Run tests

    bash test.sh
