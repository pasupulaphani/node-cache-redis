const debug = require('debug')('nodeRedisStore')
const isJSON = require('is-json')

const RedisPool = require('./redisConnectionPool')
const createLogger = require('./createLogger')
const genRandomStr = require('./genRandomStr')

/**
 * @constructor
 * @param    {object}   options
 * @param    {string}   options.name         - Name your store
 * @param    {object}   options.redisOptions - opts from [node_redis#options-object-properties]{@link https://github.com/NodeRedis/node_redis#options-object-properties}
 * @param    {object}   options.poolOptions  - opts from [node-pool#createpool]{@link https://github.com/coopernurse/node-pool#createpool}
 * @param    {object}   options.logger       - Inject your custom logger
 * @param    {integer}  options.ttlInSeconds - Number of seconds to store by default
 */
module.exports = class RedisStore extends RedisPool {
  constructor({ name, redisOptions, poolOptions, logger, ttlInSeconds } = {}) {
    const options = {
      name: name || `redisStore-${genRandomStr()}`,
      redisOptions,
      poolOptions,
      logger: createLogger(logger),
      ttlInSeconds
    }

    super(options)
  }

  /**
   * Returns 'PONG'
   *
   * @param {string} str - string passed
   * @returns {string} 'PONG'/string passed
   */
  ping(str) {
    return this.sendCommand('ping', str)
  }

  /**
   * Returns value or null when the key is missing - See [redis get]{@link https://redis.io/commands/get}
   *
   * @param {string} key - key for the value stored
   * @returns {string} value or null when the key is missing
   */
  async get(key) {
    let result = await this.sendCommand('get', key)

    try {
      result = JSON.parse(result)
    } catch (e) {
      // do nothing
    }
    return result
  }

  /**
   * Returns 'OK' if successful
   *
   * @param {string} key - key for the value stored
   * @param {any}  value - value to stored
   * @param {number} ttlInSeconds - time to live in seconds
   * @returns {string} 'OK' if successful
   */
  set(key, value, ttlInSeconds) {
    const str =
      Array.isArray(value) || isJSON(value, true)
        ? JSON.stringify(value)
        : value
    const ttlInS = ttlInSeconds || this.ttlInSeconds

    if (ttlInS) {
      return this.sendCommand('setex', [key, ttlInS, str])
    }
    return this.sendCommand('set', [key, str])
  }

  /**
   * Returns 'OK' if successful
   *
   * @param {string} key - key for the value stored
   * @param {any} value  - value to stored
   * @param {number} ttlInSeconds - time to live in seconds
   * @returns {any}
   */
  async getset(key, value, ttlInSeconds) {
    const str =
      Array.isArray(value) || isJSON(value, true)
        ? JSON.stringify(value)
        : value
    const ttlInS = ttlInSeconds || this.ttlInSeconds

    let result = await this.sendCommand('getset', [key, str])
    try {
      result = JSON.parse(result)
    } catch (e) {
      // do nothing
    }

    if (ttlInS) {
      await this.sendCommand('expire', [key, ttlInS])
    }
    return result
  }

  /**
   * Returns the number of keys that were removed - See [redis del]{@link https://redis.io/commands/del}
   *
   * @param {array} keys - list of keys to delete
   * @returns {number} The number of keys that were removed.
   */
  del(keys) {
    return this.sendCommand('del', keys)
  }

  /**
   * Returns 1 if the timeout was set/ 0 if key does not exist or the timeout could not be set - See [redis expire]{@link https://redis.io/commands/expire}
   *
   * @param {string} key - key to set expire
   * @param {number} ttlInSeconds - time to live in seconds
   * @returns {number} 1 if the timeout was set successfully; if not 0
   */
  expire(key, ttlInSeconds) {
    return this.sendCommand('expire', [key, ttlInSeconds])
  }

  /**
   * Returns TTL in seconds, or a negative value in order to signal an error - See [redis ttl]{@link https://redis.io/commands/ttl}
   *
   * @param {string} key - list of keys to delete
   * @returns {number} TTL in seconds, or a negative value in order to signal an error
   */
  getTtl(key) {
    return this.sendCommand('ttl', key)
  }

  /**
   * Returns all keys matching pattern - See [redis keys]{@link https://redis.io/commands/keys}
   *
   * @param {string} pattern - glob-style patterns/default '*'
   * @returns {array} all keys matching pattern
   */
  keys(pattern) {
    return this.sendCommand('keys', pattern || '*')
  }

  /**
   * Deletes all keys matching pattern
   *
   * @param {string} pattern - glob-style patterns/default '*'
   * @returns {number} The number of keys that were removed.
   */
  deleteAll(pattern) {
    debug('clearing redis keys: ', pattern || '*')
    return this._executeDeleteAll(pattern || '*')
  }

  /**
   * Preloads delete all scripts into redis script cache
   * (this script requires redis >=  4.0.0)
   * @async
   * @returns {Promise<string>} sha1 hash of preloaded function
   * @private
   */
  _loadDeleteAllScript() {
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
    return deleted;`
      this.__deleteScriptPromise = this.sendCommand('SCRIPT', [
        'LOAD',
        deleteKeysScript
      ])
    }
    return this.__deleteScriptPromise
  }

  /**
   * Preloads and execute delete all script
   * @async
   * @param {string} pattern - glob-style patterns/default '*'
   * @returns {Promise<number>} The number of keys that were removed.
   * @private
   */
  async _executeDeleteAll(pattern) {
    let sha1
    try {
      sha1 = await this._loadDeleteAllScript()
    } catch (error) {
      if (error.code === 'NOSCRIPT') {
        // We can get here only if server is restarted somehow and cache is deleted
        this.__deleteScriptPromise = null
        return this._executeDeleteAll(pattern)
      }
      throw error
    }
    return this.sendCommand('EVALSHA', [sha1, 0, pattern, 1000])
  }
}
