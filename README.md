[![npm version](https://img.shields.io/npm/v/node-cache-redis.svg?style=flat-square)](https://npmjs.org/package/node-cache-redis)
[![Build Status](https://travis-ci.org/pasupulaphani/node-cache-redis.svg?branch=master)](https://travis-ci.org/pasupulaphani/node-cache-redis)
[![Coverage Status](https://coveralls.io/repos/github/pasupulaphani/node-cache-redis/badge.svg?branch=master)](https://coveralls.io/github/pasupulaphani/node-cache-redis?branch=master)
[![Dependency Status](https://www.versioneye.com/user/projects/583c520dd2d44d003fb603be/badge.svg?style=flat-square)](https://www.versioneye.com/user/projects/583c520dd2d44d003fb603be)
[![Gratipay donate button](https://img.shields.io/badge/gratipay-donate-yellow.svg?style=flat-square)](https://gratipay.com/node-cache-redis/)

# node-cache-redis [![See on Github](https://github.com/themes/tactile/images/octocat-icon.png)](https://github.com/pasupulaphani/simple-redis-store)

Simplistic node redis cache ready can scale with generic-pool support

> Cache Early; Cache Often

## Prerequisites

```node >= 4``` This module requires nodejs v4 or above as it has dependencies on es6 components such as Map, Set, Promise etc.

## Featuring
- Out of the box default configuration (but fully configurable)
- Scalable easily, less friction during locking and purging
- Design for multithread environment
- Extensible Logging
- Flexible Expiration: Through configuration, you can set a default expiration mode and time for each layer.
- Statistics / Counters: Gather statistical information and track caching operations in Performance Monitor as needed.
- Modular Design: Lib comes in many different packages, separating the features and dependencies.

##### Todo:

- Serialization: Used to serialize values in distributed scenarios, can be configured.
- Synchronized locking with a semaphore
- Provides both sync and async API


### Getting started

```
    npm install node-cache-redis
```

#### Usage
```
    const RedisCache = require("node-cache-redis");
    const cache = new RedisCache();

    // set
    cache.set("key", "value")
    .then(function () {
      return cache.get("key");
    })
    .then(function (value) {
      assert.eql(value, "value")
    });

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
    <tr>
      <td class="name"><code>ttlInSeconds</code></td>
      <td class="type">
        <span class="param-type">number</span>
      </td>
      <td class="description last">
        <p>Default time to live for stored values</p>
      </td>
    </tr>
  </tbody>
</table>


### Run tests

    bash test.sh

## Contribute

[Discover how you can contribute by heading on over to the `CONTRIBUTING.md` file.](https://github.com/pasupulaphani/node-cache-redis/blob/master/CONTRIBUTING.md)

## Backers

### Maintainers

These amazing people are maintaining this project:

*   [Phani](https://github.com/pasupulaphani) — [view contributions](https://github.com/pasupulaphani/node-cache-redis/commits?author=pasupulaphani)

### Sponsors

No sponsors yet! Will you be the first?

[![Patreon donate button](https://img.shields.io/badge/patreon-donate-yellow.svg)](http://patreon.com/phaninder "Donate to this project using Patreon")
[![Gratipay donate button](https://img.shields.io/badge/gratipay-donate-yellow.svg)](https://gratipay.com/~pasupulaphani/ "Donate weekly to this project using Gratipay")
[![Flattr donate button](https://img.shields.io/badge/flattr-donate-yellow.svg)](https://flattr.com/profile/pasupulaphani "Donate to this project using Flattr")
<!-- [![PayPal donate button](https://img.shields.io/badge/paypal-donate-yellow.svg)](https://phaninder.com/paypal "Donate to this project using Paypal") -->
<!-- [![Bitcoin donate button](https://img.shields.io/badge/bitcoin-donate-yellow.svg)](https://phaninder.com/bitcoin "Donate once-off to this project using Bitcoin") -->
<!-- [![Wishlist browse button](https://img.shields.io/badge/wishlist-donate-yellow.svg)](https://phaninder.com/wishlist "Buy an item on our wishlist for us") -->

<a href='https://pledgie.com/campaigns/33095'><img alt='Click here to lend your support to: simple-node-redis-cache and make a donation at pledgie.com !' src='https://pledgie.com/campaigns/33095.png?skin_name=chrome' border='0' ></a>

### Contributors

These amazing people have contributed code to this project:

*   [Oliver Brooks](https://github.com/oliverbrooks)

Feel free to make changes. Please see the [Contributors' Guide](https://github.com/pasupulaphani/node-cache-redis/blob/master/CONTRIBUTING.md) for more information on contributing to the documentation.

<br />
<script>(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');ga('create', 'UA-57413413-5', 'auto');ga('send', 'pageview');</script>
---
