var Bluebird = require("bluebird");
var RedisStore = require("simple-redis-store");
var Debug = require("debug");

var debug = new Debug("simpleRedisCache");

module.exports = function (name, logger, redisOptions, poolOptions) {
  try {

    var store = new RedisStore(name, redisOptions, poolOptions);

    // setTimeout(function storeStats (store) {
    //   // periodically report statistics
    //
    //   var status = store.status();
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
    wrap: function wrap (key, promise, ttlInSeconds) {

      if (!store || isNaN(ttlInSeconds) || ttlInSeconds <= 0) {
        return promise;
      }

      return store.get(key)
        .then(function (value) {
          if (!value) {
            debug("MISS", {key: key});
            return Bluebird.resolve(promise)
              .then(function (value) {
                value = JSON.stringify(value);
                store.setex(key, value, ttlInSeconds);
              });
          }
        });
    },

    set: function get (key, value, ttlInSeconds) {
      if (!store) return;

      if (isNaN(ttlInSeconds) || ttlInSeconds <= 0) {
        return store.set(key, value);
      } else {
        return store.setex(key, value, ttlInSeconds);
      }
    },

    get: function get (key) {
      if (!store) return;

      return store.get(key);
    },

    keys: function keys () {
      if (!store) return;

      return store.keys();
    },

    deleteAll: function deleteAll () {
      if (!store) return;

      return store.deleteAll();
    }
  };
};
