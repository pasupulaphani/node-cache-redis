const RedisPool = require("./redis_pool");

const debug = require("debug")("simpleRedisStore");


const RedisStore = module.exports = function (options) {

  this.name = options.name || `redisStore-${Math.random().toString(36).substr(2, 10)}`;
  this.redisOptions = options.redisOptions;
  this.poolOptions = Object.assign({
    acquireTimeoutMillis: 200
  }, options.poolOptions || {});
  this.logger = require("./logger")(options.logger);

  this.pool = null;
  try {
    this.pool = new RedisPool({
      name: this.name,
      redisOptions: this.redisOptions,
      poolOptions: this.poolOptions,
      logger: this.logger
    });

    this.ping()
      .then(resp => {
        if (resp === "PONG") {
          debug("Redis store created.", this.pool.status());
        } else {
          debug("expected PONG but got", resp);
          const err = new Error("UNKNOWN_PING_RESPONSE");
          err.message = "expected PONG but got : " + resp;
          throw err;
        }
      });

  } catch (e) {
    debug("Failed to create", e);
    this.pool = null;
    throw e;
  }
};


RedisStore.prototype.getName = function () {
  return this.pool.getName();
};

RedisStore.prototype.getRedisOptions = function () {
  return this.pool.getRedisOptions();
};

RedisStore.prototype.getPoolOptions = function () {
  return this.pool.getPoolOptions();
};

// verify if the connection is successful or not
RedisStore.prototype.ping = function () {
  return this.pool.sendCommand("ping");
};

RedisStore.prototype.get = function (key) {
  return this.pool.sendCommand("get", key);
};

RedisStore.prototype.set = function (key, value, ttlInSeconds) {

  if (ttlInSeconds) {
    return this.pool.sendCommand("setex", [key, ttlInSeconds, value]);
  } else {
    return this.pool.sendCommand("set", [key, value]);
  }
};

RedisStore.prototype.del = function (keys) {
  return this.pool.sendCommand("del", keys);
};

RedisStore.prototype.expire = function (key, ttlInSeconds) {
  return this.pool.sendCommand("expire", [key, ttlInSeconds]);
};

RedisStore.prototype.ttlInSeconds = function (key) {
  return this.pool.sendCommand("ttl", key);
};

RedisStore.prototype.keys = function (pattern) {
  if (!pattern || pattern === "") {
    pattern = "*";
  }

  return this.pool.sendCommand("keys", pattern);
};

RedisStore.prototype.deleteAll = function (pattern) {
  if (!pattern || pattern === "") {
    pattern = "*";
  }
  debug("clearing redis keys: ", pattern);

  return this.keys(pattern)
    .then(keys => {

      if (keys.length > 0) {
        debug("deleting keys ", keys);
        return this.del(keys);
      } else {
        debug("no keys exists with pattern: ", pattern);
        return Promise.resolve(true);
      }
    });
};
