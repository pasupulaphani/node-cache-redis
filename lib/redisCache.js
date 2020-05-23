const debug = require('debug')('nodeCacheRedis')

const RedisStore = require('./redisStore')
const createLogger = require('./createLogger')
const NotInitialisedError = require('./NotInitialisedError')
const { genRandomStr, getPositiveNumOr0 } = require('./util')

let options = {}
let store = null

/**
 * @param    {object}   options
 * @param    {string}   options.name         - Name your store
 * @param    {object}   options.redisOptions - opts from [node_redis#options-object-properties]{@link https://github.com/NodeRedis/node_redis#options-object-properties}
 * @param    {object}   options.poolOptions  - opts from [node-pool#createpool]{@link https://github.com/coopernurse/node-pool#createpool}
 * @param    {object}   options.logger       - Inject your custom logger
 * @param    {integer}  options.ttlInSeconds - Number of seconds to store by default
 */
exports.init = ({
  name,
  redisOptions,
  poolOptions = {},
  logger,
  ttlInSeconds
} = {}) => {
  if (store) return

  options = {
    name: name || `redisCache-${genRandomStr()}`,
    redisOptions,
    poolOptions,
    logger: createLogger(logger),
    ttlInSeconds: getPositiveNumOr0(ttlInSeconds)
  }

  store = new RedisStore(options)
}

exports.getStore = () => {
  if (!store) throw NotInitialisedError('RedisCache not initialised')
  return store
}

/**
 * Returns name of this pool
 * @returns {string} Name of the pool
 */
exports.getName = () => this.getStore().getName()

/**
 * Returns redisOptions of this pool
 * @returns {object} redis options given
 */
exports.getRedisOptions = () => this.getStore().getRedisOptions()

/**
 * Returns poolOptions of this pool
 * @returns {object} pool options given
 */
exports.getPoolOptions = () => this.getStore().getPoolOptions()

/**
 * Returns pool status and stats
 * @returns {object} cache and its store status and stats
 */
exports.status = () => this.getStore().status()

/**
 * Return the ttlInSeconds
 * @returns {number?} ttlInSeconds
 */
exports.getTtlInSeconds = () => options.ttlInSeconds

/**
 * Sets the ttlInSeconds
 * @returns {number} ttl
 */
exports.setTtlInSeconds = ttl => {
  options.ttlInSeconds = getPositiveNumOr0(ttl)
  return options.ttlInSeconds
}

/**
 * Returns 'OK' if successful
 * @param {string} key - key for the value stored
 * @param {string} value - value to stored
 * @param {number} ttlInSeconds - time to live in seconds
 * @returns {string} 'OK' if successful
 */
exports.set = async (key, value, ttlInSeconds) => {
  const ttl = getPositiveNumOr0(ttlInSeconds) || options.ttlInSeconds
  return ttl === 0 ? value : this.getStore().set(key, value, ttl)
}

/**
 * Returns 'OK' if successful
 * @param {string} key - key for the value stored
 * @param {string} value - value to stored
 * @param {number} ttlInSeconds - time to live in seconds
 * @returns {string} 'OK' if successful
 */
exports.getset = async (key, value, ttlInSeconds) => {
  const ttl = getPositiveNumOr0(ttlInSeconds) || options.ttlInSeconds
  return ttl === 0 ? value : this.getStore().getset(key, value, ttl)
}

/**
 * Returns value or null when the key is missing
 * @param {string} key - key for the value stored
 * @returns {any} value or null when the key is missing
 */
exports.get = key => this.getStore().get(key)

/**
 * Returns all keys matching pattern
 * @param {string} pattern - glob-style patterns/default '*'
 * @returns {array} all keys matching pattern
 */
exports.keys = (pattern = '*') => this.getStore().keys(pattern)

/**
 * Delete keys
 * @param {array} keys - keys for the value stored
 * @returns {number} The number of keys that were removed.
 */
exports.del = (keys = []) => this.getStore().del(keys)

/**
 * Deletes all keys matching pattern
 * @param {string} pattern - glob-style patterns/default '*'
 * @returns {number} The number of keys that were removed.
 */
exports.deleteAll = (pattern = '*') => this.getStore().deleteAll(pattern)

/**
 * Wraps promise to set its value if not exists.
 * @param {string}   key     - key for the value stored
 * @param {function} fn      - function to call if not cache found
 * @param {object}   opts    - options for wrap
 * @property {number} opts.ttlInSeconds - time to live in seconds
 * @returns {string} 'OK' if successful
 */
exports.wrap = async (key, fn, { ttlInSeconds } = {}) => {
  const ttl = getPositiveNumOr0(ttlInSeconds) || options.ttlInSeconds

  if (ttl === 0) {
    debug(`Not caching, invalid ttl: ${ttlInSeconds}`)
    return fn()
  }

  const cachedValue = await this.getStore().get(key)
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
  return cachedValue
}
