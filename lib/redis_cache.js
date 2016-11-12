"use strict";

const RedisStore = require("./redis_store");
const logger = require("./logger");

const debug = require("debug")("simpleRedisCache");

function RedisCache (name, redisOptions, poolOptions) {
  let store;

  try {

    store = new RedisStore(name, redisOptions, poolOptions);

    // setTimeout(function storeStats (store) {
    //   // periodically report statistics
    //
    //   const status = store.status();
    //   logger.info("REDIS CACHE STORE STATS: ", status);
    //
    //   if (status.waitingClients > 0) {
    //     logger.warn("Clients waiting for resources.");
    //     // probably use errbit to warn?
    //   }
    //   setTimeout(storeStats, 300000, store);
    // }, 300000, store);

  } catch (e) {
    logger.error("Redis cache connection failed", e);
    return;
  }

  return {
    wrap: (key, promise, ttlInSeconds) => {

      if (!store || isNaN(ttlInSeconds) || ttlInSeconds <= 0) {
        return promise;
      }

      return store.get(key)
        .then(value => {
          if (!value) {
            debug("MISS", {key: key});
            return Promise.resolve(promise)
              .then(value => {
                value = JSON.stringify(value);
                store.setex(key, value, ttlInSeconds);
              });
          }
        });
    },

    set: (key, value, ttlInSeconds) => {
      if (!store) return;

      if (isNaN(ttlInSeconds) || ttlInSeconds <= 0) {
        return store.set(key, value);
      } else {
        return store.setex(key, value, ttlInSeconds);
      }
    },

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
