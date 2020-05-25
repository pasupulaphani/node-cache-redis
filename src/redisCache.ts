import Debug from 'debug'
import { Options as PoolOptions } from 'generic-pool'
import { ClientOpts as RedisOptions } from 'redis'

import RedisStore from './RedisStore'
import NotInitialisedError from './error/NotInitialisedError'
import { createLogger, Logger, genRandomStr, validatedTtl } from './helpers'
import { RedisPoolStatus } from './RedisConnectionPool'

const debug = Debug('nodeCacheRedis')
let store: RedisStore

/**
 * @param {object}    options
 * @param {string?}   options.name         - Name your store
 * @param {object}    options.redisOptions - opts from [node_redis#options-object-properties]{@link https://github.com/NodeRedis/node_redis#options-object-properties}
 * @param {object?}   options.poolOptions  - opts from [node-pool#createpool]{@link https://github.com/coopernurse/node-pool#createpool}
 * @param {object?}   options.logger       - Inject your custom logger
 * @param {integer?}  options.defaulTtlInS - Number of seconds to store by default
 */
export const init = ({
  name,
  redisOptions,
  poolOptions = {},
  logger,
  defaulTtlInS
}: {
  name?: string
  redisOptions: RedisOptions
  poolOptions?: PoolOptions
  logger?: Logger
  defaulTtlInS?: number
}) => {
  if (store) return

  store = new RedisStore({
    name: name || `redisCache-${genRandomStr()}`,
    redisOptions,
    poolOptions,
    logger: createLogger(logger),
    defaulTtlInS: validatedTtl(defaulTtlInS)
  })
}

/**
 * Returns name of this pool
 * @returns {string} Name of the pool
 */
export const getStore = (): RedisStore => {
  if (!store) throw new NotInitialisedError('RedisCache not initialised')
  return store
}

/**
 * Returns name of this pool
 * @returns {string} Name of the pool
 */
export const getName = (): string => getStore().getName()

/**
 * Returns redisOptions of this pool
 * @returns {object} redis options given
 */
export const getRedisOptions = (): RedisOptions => getStore().getRedisOptions()

/**
 * Returns poolOptions of this pool
 * @returns {object} pool options given
 */
export const getPoolOptions = (): PoolOptions => getStore().getPoolOptions()

/**
 * Returns pool status and stats
 * @returns {object} cache and its store status and stats
 */
export const getStatus = (): RedisPoolStatus => getStore().status()

/**
 * Return the defaulTtlInS
 * @returns {number} defaulTtlInS
 */
export const getDefaultTtlInS = (): number | undefined =>
  getStore().getDefaultTtlInS()

/**
 * Sets the defaulTtlInS
 * @param {number} defaulTtlInS - new default ttl in seconds
 * @returns {number} defaulTtlInS
 */
export const setDefaultTtlInS = (ttl: number): number | undefined =>
  getStore().setDefaultTtlInS(ttl)

/**
 * Returns 'OK' if successful
 * @param {string}   key - key for the value stored
 * @param {any}      value - value to stored
 * @param {number?}  ttlInSeconds - time to live in seconds
 * @returns {Promise<string>} 'OK' if successful
 */
export const set = (
  key: string,
  value: any,
  ttlInSeconds?: number
): Promise<string> => {
  return getStore().set(key, value, ttlInSeconds)
}

/**
 * Returns 'OK' if successful
 * @param {string} key - key for the value stored
 * @param {any}    value - value to stored
 * @param {number} ttlInSeconds - time to live in seconds
 * @returns {Promise<T>} 'OK' if successful
 */
export const getset = (
  key: string,
  value: any,
  ttlInSeconds?: number
): Promise<any> => {
  return getStore().getset(key, value, ttlInSeconds)
}

/**
 * Returns value or null when the key is missing
 * @param {string} key - key for the value stored
 * @returns {Promise<any>} value or null when the key is missing
 */
export const get = (key: string): Promise<any> => getStore().get(key)

/**
 * Returns all keys matching pattern
 * @param {string} pattern - glob-style patterns/default '*'
 * @returns {Promise<string[]>} all keys matching pattern
 */
export const keys = (pattern: string = '*'): Promise<string[]> =>
  getStore().keys(pattern)

/**
 * Delete keys
 * @param {array<string>} keys - keys for the value stored
 * @returns {Promise<number>} The number of keys that were removed.
 */
export const del = (_keys: string[] = []): Promise<number> =>
  getStore().del(_keys)

/**
 * Deletes all keys matching pattern
 * @param {string} pattern - glob-style patterns/default '*'
 * @returns {Promise<number>} The number of keys that were removed.
 */
export const deleteAll = (pattern: string = '*'): Promise<number> =>
  getStore().deleteAll(pattern)

/**
 * Wraps promise to set its value if not exists.
 * @async
 * @param {string}   key     - key for the value stored
 * @param {function} fn      - function to call if not cache found
 * @param {object?}   opts    - options for wrap
 * @property {number} opts.ttlInSeconds - time to live in seconds
 * @returns {string} 'OK' if successful
 */
export const wrap = async (
  key: string,
  fn: Function,
  { ttlInSeconds }: any = {}
): Promise<any> => {
  const ttl = validatedTtl(ttlInSeconds, getDefaultTtlInS())
  if (!ttl) {
    debug(`Not caching, invalid ttl: ${ttlInSeconds}`)
    return fn()
  }

  const cachedValue = await getStore().get(key)
  if (!cachedValue) {
    debug('MISS', { key })

    const value = await Promise.resolve(fn())
    await set(key, value, ttl)
    return value
  }
  debug('HIT', { key })
  return cachedValue
}
