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
 * @param options
 * @param options.name         - Name your cache store
 * @param options.redisOptions - opts from [node_redis#options-object-properties]{@link https://github.com/NodeRedis/node_redis#options-object-properties}
 * @param options.poolOptions  - opts from [node-pool#createpool]{@link https://github.com/coopernurse/node-pool#createpool}
 * @param options.logger       - Inject your custom logger
 * @param options.defaulTtlInS - Number of seconds to store by default
 */
export const init = (options: {
  /** Name your cache store */
  name?: string
  /** opts from [node_redis#options-object-properties]{@link https://github.com/NodeRedis/node_redis#options-object-properties} */
  redisOptions: RedisOptions
  /** opts from [node-pool#createpool]{@link https://github.com/coopernurse/node-pool#createpool} */
  poolOptions?: PoolOptions
  /** Inject your custom logger */
  logger?: Logger
  /** Number of seconds to store by default */
  defaulTtlInS?: number
}) => {
  if (store) return

  const { name, logger, defaulTtlInS } = options || {}
  store = new RedisStore({
    ...options,
    name: name || `redisCache-${genRandomStr()}`,
    logger: createLogger(logger),
    defaulTtlInS: validatedTtl(defaulTtlInS)
  })
}

/**
 * Returns cache store
 */
export const getStore = (): RedisStore => {
  if (!store) throw new NotInitialisedError('RedisCache not initialised')
  return store
}

/**
 * Returns name of this pool
 */
export const getName = (): string => getStore().getName()

/**
 * Returns redisOptions of this pool
 */
export const getRedisOptions = (): RedisOptions => getStore().getRedisOptions()

/**
 * Returns poolOptions of this pool
 */
export const getPoolOptions = (): PoolOptions => getStore().getPoolOptions()

/**
 * Returns pool status and stats
 */
export const getStatus = (): RedisPoolStatus => getStore().status()

/**
 * Return the defaulTtlInS
 */
export const getDefaultTtlInS = (): number | undefined =>
  getStore().getDefaultTtlInS()

/**
 * Sets the defaulTtlInS
 * @param ttl - new default ttl in seconds
 */
export const setDefaultTtlInS = (ttl: number): number | undefined =>
  getStore().setDefaultTtlInS(ttl)

/**
 * Unsets the defaulTtlInS
 */
export const unsetDefaultTtlInS = (): boolean => getStore().unsetDefaultTtlInS()

/**
 * Returns 'OK' if successful
 * @param key - key for the value stored
 * @param value - value to stored
 * @param ttlInSeconds - time to live in seconds
 * @returns 'OK' if successful
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
 * @param key - key for the value stored
 * @param value - value to stored
 * @param ttlInSeconds - time to live in seconds
 * @returns 'OK' if successful
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
 * @param key - key for the value stored
 * @returns value or null when the key is missing
 */
export const get = (key: string): Promise<any> => getStore().get(key)

/**
 * Returns all keys matching pattern
 * @param pattern - glob-style patterns/default '*'
 * @returns all keys matching pattern
 */
export const keys = (pattern: string = '*'): Promise<string[]> =>
  getStore().keys(pattern)

/**
 * Delete keys
 * @param keys - keys for the value stored
 * @returns The number of keys that were removed.
 */
export const del = (_keys: string[] = []): Promise<number> =>
  getStore().del(_keys)

/**
 * Deletes all keys matching pattern
 * @param pattern - glob-style patterns/default '*'
 * @returns The number of keys that were removed.
 */
export const deleteAll = (pattern: string = '*'): Promise<number> =>
  getStore().deleteAll(pattern)

/**
 * Wraps promise to set its value if not exists.
 * @async
 * @param key     - key for the value stored
 * @param fn      - function to call if not cache found
 * @param opts    - options for wrap
 * @property {number} opts.ttlInSeconds - time to live in seconds
 * @returns 'OK' if successful
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
