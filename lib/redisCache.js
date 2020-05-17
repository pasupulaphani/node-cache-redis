const debug = require('debug')('nodeCacheRedis')

const RedisStore = require('./redisStore')
const createLogger = require('./createLogger')

/**
 * @constructor
 * @param    {object}   options
 * @param    {string}   options.name         - Name your store
 * @param    {object}   options.redisOptions - opts from [node_redis#options-object-properties]{@link https://github.com/NodeRedis/node_redis#options-object-properties}
 * @param    {object}   options.poolOptions  - opts from [node-pool#createpool]{@link https://github.com/coopernurse/node-pool#createpool}
 * @param    {object}   options.logger       - Inject your custom logger
 * @param    {integer}  options.ttlInSeconds - Number of seconds to store by default
 */
const RedisCache = (module.exports = function ({
  name,
  redisOptions,
  poolOptions,
  logger,
  ttlInSeconds
} = {}) {
  this.name = name || `redisCache-${Math.random().toString(36).substr(2, 10)}`
  this.redisOptions = redisOptions
  this.poolOptions = poolOptions || {}
  this.logger = createLogger(logger)
  this.ttlInSeconds = ttlInSeconds
  this.store = new RedisStore({
    name: this.name,
    redisOptions: this.redisOptions,
    poolOptions: this.poolOptions,
    logger: this.logger,
    ttlInSeconds: this.ttlInSeconds
  })
})

/**
 * Return the ttl or the default set on instantiation
 *
 * @param {number} ttlInSeconds - time to live in seconds
 * @returns {number} ttl
 */
RedisCache.prototype.getTtl = function (ttlInSeconds) {
  return ttlInSeconds || this.ttlInSeconds
}

/**
 * Returns 'OK' if successful
 *
 * @param {string} key - key for the value stored
 * @param {string} value - value to stored
 * @param {number} ttlInSeconds - time to live in seconds
 * @returns {string} 'OK' if successful
 */
RedisCache.prototype.set = function (key, value, ttlInSeconds) {
  if (this.getTtl(ttlInSeconds) === 0) return Promise.resolve(value)

  return this.store.set(key, value, ttlInSeconds)
}

RedisCache.prototype.getset = function (key, value, ttlInSeconds) {
  if (this.getTtl(ttlInSeconds) === 0) return Promise.resolve(value)

  return this.store.getset(key, value, ttlInSeconds)
}

/**
 * Returns value or null when the key is missing
 *
 * @param {string} key - key for the value stored
 * @returns {string} value or null when the key is missing
 */
RedisCache.prototype.get = function (key) {
  return this.store.get(key)
}

/**
 * Returns all keys matching pattern
 *
 * @param {string} pattern - glob-style patterns/default '*'
 * @returns {array} all keys matching pattern
 */
RedisCache.prototype.keys = function (pattern) {
  return this.store.keys(pattern || '*')
}

/**
 * Delete keys
 *
 * @param {array} keys - keys for the value stored
 * @returns {number} The number of keys that were removed.
 */
RedisCache.prototype.del = function (keys) {
  return this.store.del(keys)
}

/**
 * Deletes all keys matching pattern
 *
 * @param {string} pattern - glob-style patterns/default '*'
 * @returns {number} The number of keys that were removed.
 */
RedisCache.prototype.deleteAll = function (pattern) {
  return this.store.deleteAll(pattern || '*')
}

/**
 * Wraps promise to set its value if not exists.
 *
 * @param {string} key - key for the value stored
 * @param {function} fn - function to call if not cache found
 * @param {object} opts - options for wrap
 * @property {number} ttlInSeconds - time to live in seconds
 * @returns {string} 'OK' if successful
 */
RedisCache.prototype.wrap = async function (key, fn, opts = {}) {
  const ttlInSeconds = this.getTtl(opts.ttlInSeconds)

  if (ttlInSeconds && (Number.isNaN(ttlInSeconds) || ttlInSeconds <= 0)) {
    debug(`Not caching, invalid ttl: ${ttlInSeconds}`)
    return Promise.resolve(fn())
  }

  const cachedValue = await this.store.get(key)

  if (!cachedValue) {
    debug('MISS', {
      key
    })

    const value = await Promise.resolve(fn())
    await this.set(key, value, ttlInSeconds)
    return value
  }
  debug('HIT', {
    key
  })
  return Promise.resolve(cachedValue)
}

/**
 * Returns factory.name for this pool
 *
 * @returns {string} Name of the pool
 */
RedisCache.prototype.getName = function () {
  return this.store.getName()
}

/**
 * Returns this.redisOptions for this pool
 *
 * @returns {object} redis options given
 */
RedisCache.prototype.getRedisOptions = function () {
  return this.store.getRedisOptions()
}

/**
 * Returns this.poolOptions for this pool
 *
 * @returns {object} pool options given
 */
RedisCache.prototype.getPoolOptions = function () {
  return this.store.getPoolOptions()
}

/**
 * Returns pool status and stats
 *
 * @returns {object} cache and its store status and stats
 */
RedisCache.prototype.status = function () {
  return this.store.status()
}
