[![npm version](https://badge.fury.io/js/node-cache-redis.svg)](https://badge.fury.io/js/node-cache-redis)
[![Build Status](https://travis-ci.org/pasupulaphani/node-cache-redis.svg?branch=master)](https://travis-ci.org/pasupulaphani/node-cache-redis)
[![Coverage Status](https://coveralls.io/repos/github/pasupulaphani/node-cache-redis/badge.svg?branch=master)](https://coveralls.io/github/pasupulaphani/node-cache-redis?branch=master)
[![](https://img.shields.io/badge/gratipay-donate-yellow.svg?style=flat-square)](https://gratipay.com/simple-redis-cache/)

# node-cache-redis [![See on Github](https://github.com/themes/tactile/images/octocat-icon.png)](https://github.com/pasupulaphani/node-cache-redis)

Simplistic node redis cache ready can scale with generic-pool support

> Cache Early; Cache Often

### Documentation

- [JSDOC pages](https://pasupulaphani.github.io/node-cache-redis/)

## Prerequisites

- `node >= 8` This module requires nodejs v6
- `redis >= 4` This module requires redis v4 or above as it has dependencies on `UNLINK` and `redis.replicate_commands()` for pattern deletion.

## Featuring

- Works out of the box
- Easy to scale with low friction during locking and purging
- Designed for multithread environment
- Logging can be customized
- Flexible Expiration: Through configuration, you can set a default expiration mode and time for each layer.
- Statistics / Counters: Gather statistical information.
- Modular Design

## Migration

[4.0.0](https://github.com/pasupulaphani/node-cache-redis/releases/tag/v4.0.0) contains braking change. See 
[CHANGELOG.md](https://github.com/pasupulaphani/node-cache-redis/blob/master/CHANGELOG.md)

### Getting started

```
    npm install node-cache-redis
```

#### Usage

```
    const { init, set, get } = require("node-cache-redis");
    init();

    // set
    await set("key", { "hello": "world" })
    const value = await get("key")
```

#### API

- init([options]) [JSDOC init](https://pasupulaphani.github.io/node-cache-redis/global.html#init)

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

##### Using docker

```
bash test.sh
```

##### Run manually

```
docker run -it -p 6379:6379 redis
npm t
```

##### Todo:

- Serialization: Used to serialize values in distributed scenarios and configuration.
- Synchronized locking with a semaphore

## Contribute

[Discover how you can contribute by heading on over to the `CONTRIBUTING.md` file.](https://github.com/pasupulaphani/node-cache-redis/blob/master/CONTRIBUTING.md)

## Backers

### Maintainers

These amazing people are maintaining this project:

- [Phaninder](https://github.com/pasupulaphani) — [view contributions](https://github.com/pasupulaphani/node-cache-redis/commits?author=pasupulaphani)

### Sponsors

No sponsors yet! Will you be the first?

[![Patreon donate button](https://img.shields.io/badge/patreon-donate-yellow.svg)](http://patreon.com/phaninder 'Donate to this project using Patreon')
[![Gratipay donate button](https://img.shields.io/badge/gratipay-donate-yellow.svg)](https://gratipay.com/~pasupulaphani/ 'Donate weekly to this project using Gratipay')
[![Flattr donate button](https://img.shields.io/badge/flattr-donate-yellow.svg)](https://flattr.com/profile/pasupulaphani 'Donate to this project using Flattr')

<!-- [![PayPal donate button](https://img.shields.io/badge/paypal-donate-yellow.svg)](https://phaninder.com/paypal "Donate to this project using Paypal") -->
<!-- [![Bitcoin donate button](https://img.shields.io/badge/bitcoin-donate-yellow.svg)](https://phaninder.com/bitcoin "Donate once-off to this project using Bitcoin") -->
<!-- [![Wishlist browse button](https://img.shields.io/badge/wishlist-donate-yellow.svg)](https://phaninder.com/wishlist "Buy an item on our wishlist for us") -->
<!-- <a href='https://pledgie.com/campaigns/33095'><img alt='Click here to lend your support to: simple-node-redis-cache and make a donation at pledgie.com !' src='https://pledgie.com/campaigns/33095.png?skin_name=chrome' border='0' ></a> -->

### Contributors

Amazing people who have contributed code to this project:

- Ron Yang
- [Oliver Brooks](https://github.com/oliverbrooks)

Feel free to make changes. Please see the [Contributors' Guide](https://github.com/pasupulaphani/node-cache-redis/blob/master/CONTRIBUTING.md) for more information on contributing to the documentation.

---
