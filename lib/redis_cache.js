"use strict";

const RedisStore = require("./redis_store");

const debug = require("debug")("simpleRedisCache");

function set (store, key, value, ttlInSeconds) {
  if (!store || ttlInSeconds === 0) return Promise.resolve(value);

  if (ttlInSeconds) {
    return store.setex(key, value, ttlInSeconds);
  } else {
    return store.set(key, value);
  }
}

function RedisCache (name, redisOptions, poolOptions) {

  this.name = name;
  this.redisOptions = redisOptions;
  this.poolOptions = poolOptions;

  try {
    this.store = new RedisStore(name, redisOptions, poolOptions);
    debug("Success in connecting to Redis", redisOptions);
  } catch (e) {
    debug("Failed in connecting to Redis", redisOptions);
  }
}

RedisCache.prototype.set = function (key, value, ttlInSeconds) {
  return set(this.store, key, value, ttlInSeconds);
};

RedisCache.prototype.get = function (key) {
  if (!this.store) return;

  return this.store.get(key);
};

RedisCache.prototype.keys = function () {
  if (!this.store) return;

  return this.store.keys();
};

RedisCache.prototype.deleteAll = function () {
  if (!this.store) return;

  return this.store.deleteAll();
};

RedisCache.prototype.wrap = function (key, promise, ttlInSeconds) {

  if (!this.store || ttlInSeconds === 0) {
    return Promise.resolve(promise);
  }

  return this.store.get(key)
    .then(value => {
      if (!value) {
        debug("MISS", {key: key});
        return Promise.resolve(promise)
          .then(value => set(this.store, key, value, ttlInSeconds).then(() => value));
      } else {
        debug("HIT", {key: key});
        return Promise.resolve(value);
      }
    });
};

module.exports = RedisCache;
