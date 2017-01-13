const RedisPool = require("./redis_pool");
const pick = require("lodash.pick");

const debug = require("debug")("simpleRedisStore");

module.exports = {
  create : function (options) {
    const store = new RedisStore(options);

    // since pool factory events are not triggered due to retry issue; a workaround
    return store.testConnection()
      .then(() => {
        console.log("####################################################")
        debug("Redis store created.", this.pool.status());
      })
      ;
// this.pool.acquire()
  }
}


/**
 * @constructor
 * @param    {object}   options - Accepts properties ["name", "redisOptions", "poolOptions", "logger"]
 * @param    {string}   options.name - Name your store
 * @param    {object}   options.redisOptions - opts from [node_redis#options-object-properties]{@link https://github.com/NodeRedis/node_redis#options-object-properties}
 * @param    {object}   options.poolOptions - opts from [node-pool#createpool]{@link https://github.com/coopernurse/node-pool#createpool}
 * @param    {object}   options.logger - Inject your custom logger
 */
function RedisStore (options) {

  options = pick(options, ["name", "redisOptions", "poolOptions", "logger"]);

  this.name = options.name || `redisStore-${Math.random().toString(36).substr(2, 10)}`;
  this.redisOptions = options.redisOptions;
  this.poolOptions = options.poolOptions;
  this.logger = require("./logger")(options.logger);

  this.pool = new RedisPool({
    name: this.name,
    redisOptions: this.redisOptions,
    poolOptions: this.poolOptions,
    logger: this.logger
  });
}

RedisStore.prototype.testConnection = function () {

  debug("PING to test connection");

  return this.ping()
    .then(resp => {
      if (resp !== "PONG") {
        debug("expected PONG but got", resp);
        const err = new Error("UNKNOWN_PING_RESPONSE");
        err.message = "expected PONG but got : " + resp;
        throw err;
      }
    })
    .catch(e => {
      debug("Failed to PING", e);
      this.logger.error("Test connection failed", e);
      throw e;
    });
};

/**
 * Returns factory.name for this pool
 *
 * @returns {string} Name of the pool
 */
RedisStore.prototype.getName = function () {
  return this.pool.getName();
};

/**
 * Returns this.redisOptions for this pool
 *
 * @returns {object} redis options given
 */
RedisStore.prototype.getRedisOptions = function () {
  return this.pool.getRedisOptions();
};

/**
 * Returns this.poolOptions for this pool
 *
 * @returns {object} pool options given
 */
RedisStore.prototype.getPoolOptions = function () {
  return this.pool.getPoolOptions();
};

/**
 * Send redis instructions
 *
 * @param {string} commandName - Name of the command
 * @param {array}  commandArgs - Args sent to the command
 * @returns {promise} Promise resolve with the result or Error
 */
RedisStore.prototype.sendCommand = function () {
  return this.pool.sendCommand.apply(this, arguments);
};

/**
 * Returns supplied string if not return 'PONG'
 *
 * @param {string} str - Optional string
 * @returns {string} supplied string if not return 'PONG'
 */
RedisStore.prototype.ping = function (str) {
  return !str ? this.sendCommand("ping") : this.sendCommand("ping", str);
};

/**
 * Returns value or null when the key is missing - See [redis get]{@link https://redis.io/commands/get}
 *
 * @param {string} key - key for the value stored
 * @returns {string} value or null when the key is missing
 */
RedisStore.prototype.get = function (key) {
  return this.sendCommand("get", key);
};

/**
 * Returns 'OK' if successful
 *
 * @param {string} key - key for the value stored
 * @param {string} value - value to stored
 * @param {number} ttlInSeconds - time to live in seconds
 * @returns {string} 'OK' if successful
 */
RedisStore.prototype.set = function (key, value, ttlInSeconds) {

  if (ttlInSeconds) {
    return this.sendCommand("setex", [key, ttlInSeconds, value]);
  } else {
    return this.sendCommand("set", [key, value]);
  }
};

/**
 * Returns the number of keys that were removed - See [redis del]{@link https://redis.io/commands/del}
 *
 * @param {array} keys - list of keys to delete
 * @returns {number} The number of keys that were removed.
 */
RedisStore.prototype.del = function (keys) {
  return this.sendCommand("del", keys);
};

/**
 * Returns 1 if the timeout was set/ 0 if key does not exist or the timeout could not be set - See [redis expire]{@link https://redis.io/commands/expire}
 *
 * @param {string} key - key to set expire
 * @param {number} ttlInSeconds - time to live in seconds
 * @returns {number} 1 if the timeout was set successfully; if not 0
 */
RedisStore.prototype.expire = function (key, ttlInSeconds) {
  return this.sendCommand("expire", [key, ttlInSeconds]);
};

/**
 * Returns TTL in seconds, or a negative value in order to signal an error - See [redis ttl]{@link https://redis.io/commands/ttl}
 *
 * @param {string} key - list of keys to delete
 * @returns {number} TTL in seconds, or a negative value in order to signal an error
 */
RedisStore.prototype.ttlInSeconds = function (key) {
  return this.sendCommand("ttl", key);
};

/**
 * Returns all keys matching pattern - See [redis keys]{@link https://redis.io/commands/keys}
 *
 * @param {string} pattern - glob-style patterns/default '*'
 * @returns {array} all keys matching pattern
 */
RedisStore.prototype.keys = function (pattern) {
  if (!pattern || pattern === "") {
    pattern = "*";
  }

  return this.sendCommand("keys", pattern);
};

/**
 * Deletes all keys matching pattern
 *
 * @param {string} pattern - glob-style patterns/default '*'
 * @returns {array} The number of keys that were removed.
 */
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

/**
 * Returns pool status and stats
 *
 * @returns {object} store status and stats
 */
RedisStore.prototype.status = function () {
  return this.pool.status();
};
