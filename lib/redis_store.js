const RedisPool = require("./redis_connection_pool");
const pick = require("lodash.pick");
const isJSON = require("is-json");

const debug = require("debug")("nodeRedisStore");

/**
 * @constructor
 * @param    {object}   options - Accepts properties ["name", "redisOptions", "poolOptions", "logger"]
 * @param    {string}   options.name - Name your store
 * @param    {object}   options.redisOptions - opts from [node_redis#options-object-properties]{@link https://github.com/NodeRedis/node_redis#options-object-properties}
 * @param    {object}   options.poolOptions - opts from [node-pool#createpool]{@link https://github.com/coopernurse/node-pool#createpool}
 * @param    {object}   options.logger - Inject your custom logger
 * @param    {integer}  options.ttlInSeconds - Number of seconds to store by default
 */
const RedisStore = module.exports = function (options) {

  options = pick(options, ["name", "redisOptions", "poolOptions", "logger", "ttlInSeconds"]);

  this.name = options.name || `redisStore-${Math.random().toString(36).substr(2, 10)}`;
  this.redisOptions = options.redisOptions;
  this.poolOptions = options.poolOptions||{};
  this.logger = require("./logger")(options.logger);
  this.ttlInSeconds = options.ttlInSeconds;

  this.pool = null;
  try {
    this.pool = new RedisPool({
      name: this.name,
      redisOptions: this.redisOptions,
      poolOptions: this.poolOptions,
      logger: this.logger
    });

    // // since pool factory events are not triggered due to retry issue; a workaround
    // this.testConnection()
    //   .then((res) => {
    //     console.log("#########################", res)
    //     debug("Redis store created.", this.pool.status())
    //   });
// this.pool.acquire()
  } catch (e) {
    debug("Failed to create", e);
    this.pool = null;
    throw e;
  }
};

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
 * Returns 'PONG'
 *
 * @param {string} str - string passed
 * @returns {string} 'PONG'/string passed
 */
RedisStore.prototype.ping = function (str) {
  if (str) {
    return this.sendCommand("ping", str);
  } else {
    return this.sendCommand("ping");
  }
};

/**
 * Returns value or null when the key is missing - See [redis get]{@link https://redis.io/commands/get}
 *
 * @param {string} key - key for the value stored
 * @returns {string} value or null when the key is missing
 */
RedisStore.prototype.get = function (key) {
  return this.sendCommand("get", key)
    .then(function (value) {
      try {
        value = JSON.parse(value);
      } catch (e) {
        // do nothing
      }
      return value;
    });
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
  value = Array.isArray(value) || isJSON(value, true) ? JSON.stringify(value) : value;

  if (!ttlInSeconds) {
    ttlInSeconds = this.ttlInSeconds;
  }
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
RedisStore.prototype.getTtl = function (key) {
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
 * @returns {number} The number of keys that were removed.
 */
RedisStore.prototype.deleteAll = function (pattern) {
  if (!pattern || pattern === "") {
    pattern = "*";
  }
  debug("clearing redis keys: ", pattern);
  return this._executeDeleteAll(pattern);
};

/**
 * Returns pool status and stats
 *
 * @returns {object} pool status and stats
 */
RedisStore.prototype.status = function () {
  return this.pool.status();
};

/**
 * Preloads delete all scripts into redis script cache
 * (this script requires redis >=  4.0.0)
 * @async
 * @returns {Promise<string>} sha1 hash of preloaded function
 * @private
 */
RedisStore.prototype._loadDeleteAllScript = function () {
  if (!this.__deleteScriptPromise) {
    const deleteKeysScript = `
    local keys = {};
    local done = false;
    local cursor = "0";
    local deleted = 0;
    redis.replicate_commands();
    repeat
        local result = redis.call("SCAN", cursor, "match", ARGV[1], "count", ARGV[2])
        cursor = result[1];
        keys = result[2];
        for i, key in ipairs(keys) do
            deleted = deleted + redis.call("UNLINK", key);
        end
        if cursor == "0" then
            done = true;
        end
    until done
    return deleted;`;
    this.__deleteScriptPromise = this.sendCommand("SCRIPT", ["LOAD", deleteKeysScript]);
  }
  return this.__deleteScriptPromise;
};

/**
 * Preloads and execute delete all script
 * @async
 * @param {string} pattern - glob-style patterns/default '*'
 * @returns {Promise<number>} The number of keys that were removed.
 * @private
 */
RedisStore.prototype._executeDeleteAll = function (pattern) {
  return this._loadDeleteAllScript()
    .then(sha1 => this.sendCommand("EVALSHA", [sha1, 0, pattern, 1000]))
    .catch(err => {
      if (err.code === "NOSCRIPT") {
        // We can get here only if server is restarted somehow and cache is deleted
        this.__deleteScriptPromise = null;
        return this._executeDeleteAll(pattern);
      }
      throw err;
    });
};
