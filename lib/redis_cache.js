const RedisStore = require("./redis_store");
const pick = require("lodash.pick");

const debug = require("debug")("nodeCacheRedis");

/**
 * @constructor
 * @param    {object}   options - Accepts properties ["name", "redisOptions", "poolOptions", "logger"]
 * @param    {string}   options.name - Name your store
 * @param    {object}   options.redisOptions - opts from [node_redis#options-object-properties]{@link https://github.com/NodeRedis/node_redis#options-object-properties}
 * @param    {object}   options.poolOptions - opts from [node-pool#createpool]{@link https://github.com/coopernurse/node-pool#createpool}
 * @param    {object}   options.logger - Inject your custom logger
 */
const RedisCache = module.exports = function (options) {

  options = pick(options, ["name", "redisOptions", "poolOptions", "logger"]);

  this.name = options.name || `redisCache-${Math.random().toString(36).substr(2, 10)}`;
  this.redisOptions = options.redisOptions;
  this.poolOptions = options.poolOptions;
  this.logger = require("./logger")(options.logger);
  this.store = new RedisStore({
    name: this.name,
    redisOptions: this.redisOptions,
    poolOptions: this.poolOptions,
    logger: this.logger
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
RedisCache.prototype.set = function (key, value, ttlInSeconds) {
  if (!this.store || ttlInSeconds === 0) return Promise.resolve(value);

  return this.store.set(key, value, ttlInSeconds);
};

/**
 * Returns value or null when the key is missing
 *
 * @param {string} key - key for the value stored
 * @returns {string} value or null when the key is missing
 */
RedisCache.prototype.get = function (key) {
  if (!this.store) return;

  return this.store.get(key);
};

/**
 * Returns all keys matching pattern
 *
 * @param {string} pattern - glob-style patterns/default '*'
 * @returns {array} all keys matching pattern
 */
RedisCache.prototype.keys = function (pattern) {
  if (!this.store) return;

  if (!pattern || pattern === "") {
    pattern = "*";
  }

  return this.store.keys();
};

/**
 * Deletes all keys matching pattern
 *
 * @param {string} pattern - glob-style patterns/default '*'
 * @returns {array} The number of keys that were removed.
 */
RedisCache.prototype.deleteAll = function (pattern) {
  if (!this.store) return;

  if (!pattern || pattern === "") {
    pattern = "*";
  }

  return this.store.deleteAll();
};

/**
 * Wraps promise to set its value if not exists.
 *
 * @param {string} key - key for the value stored
 * @param {string} promise / value - value to stored
 * @param {number} ttlInSeconds - time to live in seconds
 * @returns {string} 'OK' if successful
 */
RedisCache.prototype.wrap = function (key, promise, ttlInSeconds) {

  if (!this.store || (ttlInSeconds && (isNaN(ttlInSeconds) || ttlInSeconds <= 0))) {
    debug(`Not caching, invalid ttl: ${ttlInSeconds}`);
    return Promise.resolve(promise);
  }

  return this.store.get(key)
    .then(value => {
      if (!value) {
        debug("MISS", {key: key});
        return Promise.resolve(promise)
          .then(value => this.set(key, value, ttlInSeconds).then(() => value));
      } else {
        debug("HIT", {key: key});
        return Promise.resolve(value);
      }
    });
};

/**
 * Returns factory.name for this pool
 *
 * @returns {string} Name of the pool
 */
RedisCache.prototype.getName = function () {
  return this.store.getName();
};

/**
 * Returns this.redisOptions for this pool
 *
 * @returns {object} redis options given
 */
RedisCache.prototype.getRedisOptions = function () {
  return this.store.getRedisOptions();
};

/**
 * Returns this.poolOptions for this pool
 *
 * @returns {object} pool options given
 */
RedisCache.prototype.getPoolOptions = function () {
  return this.store.getPoolOptions();
};

/**
 * Returns pool status and stats
 *
 * @returns {object} cache and its store status and stats
 */
RedisCache.prototype.status = function () {
  return this.store.status();
};
