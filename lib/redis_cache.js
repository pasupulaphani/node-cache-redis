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
  let store;

  try {
    store = new RedisStore(name, redisOptions, poolOptions);
  } catch (e) {
    debug("Redis cache connection failed", e);
    return;
  }

  return {
    wrap: (key, promise, ttlInSeconds) => {

      if (!store || ttlInSeconds === 0) {
        return Promise.resolve(promise);
      }

      return store.get(key)
        .then(value => {
          if (!value) {
            debug("MISS", {key: key});
            return Promise.resolve(promise)
              .then(value => set(store, key, value, ttlInSeconds).then(() => value));
          } else {
            debug("HIT", {key: key});
            return Promise.resolve(value);
          }
        });
    },

    set: (key, value, ttlInSeconds) => set(store, key, value, ttlInSeconds),

    get: (key) => {
      if (!store) return;

      return store.get(key);
    },

    keys: () => {
      if (!store) return;

      return store.keys();
    },

    deleteAll: () => {
      if (!store) return;

      return store.deleteAll();
    }
  };
}

module.exports = RedisCache;
