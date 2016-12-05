[![npm version](http://img.shields.io/npm/v/simple-redis-cache.svg?style=flat-square)](https://npmjs.org/package/simple-redis-cache)
[![Build Status](https://travis-ci.org/pasupulaphani/simple-redis-cache.svg?branch=master)](https://travis-ci.org/pasupulaphani/simple-redis-cache)
[![Coverage Status](https://coveralls.io/repos/github/pasupulaphani/simple-redis-cache/badge.svg?branch=master)](https://coveralls.io/github/pasupulaphani/simple-redis-cache?branch=master)
[![Dependency Status](https://www.versioneye.com/user/projects/583c520dd2d44d003fb603be/badge.svg?style=flat-square)](https://www.versioneye.com/user/projects/583c520dd2d44d003fb603be)
[![Gratipay donate button](https://img.shields.io/badge/gratipay-donate-yellow.svg?style=flat-square)](https://gratipay.com/simple-redis-cache/)

# simple-redis-cache
Redis cache ready to scale with node-pool support [![See on Github](https://github.com/themes/tactile/images/octocat-icon.png)](https://github.com/pasupulaphani/simple-redis-store)

> Cache Early; Cache Often

## Prerequisites

```node >= 4``` This module requires nodejs v4 or above as it has dependencies on es6 components such as Map, Set, Promise etc.

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

```
    npm install simple-redis-cache
```

#### Usage
```
    const RedisCache = require("simple-redis-cache");
    const cache = new RedisCache();

    // set
    cache.set("key", "value");

```

#### API

- RedisCache([options])

#### `options` object properties

<table class="params">
  <thead>
    <tr>
      <th>Name</th>
      <th>Type</th>
      <th class="last">Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="name"><code>name</code></td>
      <td class="type">
        <span class="param-type">string</span>
      </td>
      <td class="description last">
        <p>Name your store</p>
      </td>
    </tr>
    <tr>
      <td class="name"><code>redisOptions</code></td>
      <td class="type">
        <span class="param-type">object</span>
      </td>
      <td class="description last">
        <p>opts from <a href="https://github.com/NodeRedis/node_redis#options-object-properties">node_redis#options-object-properties</a></p>
      </td>
    </tr>
    <tr>
      <td class="name"><code>poolOptions</code></td>
      <td class="type">
        <span class="param-type">object</span>
      </td>
      <td class="description last">
        <p>opts from <a href="https://github.com/coopernurse/node-pool#createpool">node-pool#createpool</a></p>
      </td>
    </tr>
    <tr>
      <td class="name"><code>logger</code></td>
      <td class="type">
        <span class="param-type">object</span>
      </td>
      <td class="description last">
        <p>Inject your custom logger</p>
      </td>
    </tr>
  </tbody>
</table>


### Run tests

    bash test.sh

## Contribute

[Discover how you can contribute by heading on over to the `CONTRIBUTING.md` file.](https://github.com/pasupulaphani/simple-redis-cache/blob/master/CONTRIBUTING.md)

## Backers

### Maintainers

These amazing people are maintaining this project:

*   [Phani](https://github.com/pasupulaphani) — [view contributions](https://github.com/pasupulaphani/simple-redis-cache/commits?author=pasupulaphani)

### Sponsors

No sponsors yet! Will you be the first?

[![Patreon donate button](https://img.shields.io/badge/patreon-donate-yellow.svg)](http://patreon.com/phaninder "Donate to this project using Patreon")
[![Gratipay donate button](https://img.shields.io/badge/gratipay-donate-yellow.svg)](https://gratipay.com/~pasupulaphani/ "Donate weekly to this project using Gratipay")
[![Flattr donate button](https://img.shields.io/badge/flattr-donate-yellow.svg)](https://flattr.com/profile/pasupulaphani "Donate to this project using Flattr")
<!-- [![PayPal donate button](https://img.shields.io/badge/paypal-donate-yellow.svg)](https://phaninder.com/paypal "Donate to this project using Paypal") -->
<!-- [![Bitcoin donate button](https://img.shields.io/badge/bitcoin-donate-yellow.svg)](https://phaninder.com/bitcoin "Donate once-off to this project using Bitcoin") -->
<!-- [![Wishlist browse button](https://img.shields.io/badge/wishlist-donate-yellow.svg)](https://phaninder.com/wishlist "Buy an item on our wishlist for us") -->

### Contributors

These amazing people have contributed code to this project:

*   [Oliver Brooks](https://github.com/oliverbrooks)

Feel free to make changes. Please see the [Contributors' Guide](https://github.com/pasupulaphani/simple-redis-cache/blob/master/CONTRIBUTING.md) for more information on contributing to the documentation.

<br />

---
