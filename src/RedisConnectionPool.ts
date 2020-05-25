import util from 'util'

import Debug from 'debug'
import genericPool, {
  Pool,
  Options as PoolOptions,
  Factory
} from 'generic-pool'
import redis, { ClientOpts as RedisOptions, RedisClient } from 'redis'
// @ts-ignore
import retry from 'retry-as-promised'

import { createLogger, Logger, genRandomStr } from './helpers'

const debug = Debug('nodeRedisPool')

const createClient = (redisOptions: RedisOptions) => {
  return new Promise((resolve, reject) => {
    debug('Start redis createClient', redisOptions)
    const client = redis.createClient(redisOptions)

    client.on('error', err => {
      debug('Failed redis createClient', err)
      reject(err)
    })
    client.on('connect', () => {
      debug('Succeeded redis createClient', redisOptions)
      resolve(client)
    })
  })
}

const selectDB = (client: RedisClient, db: number): Promise<RedisClient> => {
  return new Promise((resolve, reject) => {
    client.select(db, err => {
      if (err) reject(err)
      debug('DB selected: ', db)
      resolve(client)
    })
  })
}

/**
 * @alias RedisPoolStatus
 */
export interface RedisPoolStatus {
  name: string
  size: number
  available: number
  pending: number
}

/**
 * RedisPool
 */
class RedisPool {
  name: string
  redisOptions: RedisOptions
  poolOptions: PoolOptions
  logger: {
    debug: Function
    log: Function
    info: Function
    warn: Function
    error: Function
  }

  pool: Pool<any>

  /**
   * @constructor
   * @param {object}  options
   * @param {string}  options.name         - Name your pool
   * @param {object}  options.redisOptions - opts from [node_redis#options-object-properties]{@link https://github.com/NodeRedis/node_redis#options-object-properties}
   * @param {object}  options.poolOptions  - opts from [node-pool#createpool]{@link https://github.com/coopernurse/node-pool#createpool}
   * @param {object}  options.logger       - Inject your custom logger
   */
  constructor({
    name,
    redisOptions,
    poolOptions,
    logger
  }: {
    name?: string
    redisOptions: RedisOptions
    poolOptions?: PoolOptions
    logger?: Logger
  }) {
    this.name = name || `redisPool-${genRandomStr()}`
    this.redisOptions = redisOptions
    this.poolOptions = poolOptions || {}
    this.logger = createLogger(logger)

    const factory: Factory<any> = {
      create: () => {
        // for retry
        let createAttempts = 0

        // this is due to the limitation of node-pool ATM
        // https://github.com/coopernurse/node-pool/issues/161#issuecomment-261109882
        return retry(
          () => {
            createAttempts += 1
            if (createAttempts > 3) {
              const err = new Error(
                `Failed redis createClient, ${JSON.stringify(
                  redisOptions || {}
                )}`
              )
              err.name = 'CONN_FAILED'
              debug(
                'Max conn createAttempts reached: %s, resolving to error:',
                createAttempts,
                err
              )

              // reset for next try
              createAttempts = 0
              return Promise.resolve(err)
            }

            return createClient(redisOptions)
          },
          {
            max: 10,
            name: 'factory.create',
            report: debug
          }
        )
      },
      destroy: (client: RedisClient) =>
        new Promise(resolve => {
          try {
            // Flush when closing.
            client.end(true)
            debug(
              'Client conn closed. Available count : %s. Pool size: %s',
              this.availableCount(),
              this.getPoolSize()
            )
            this.logger.log(
              'Client conn closed. Available count : %s. Pool size: %s',
              this.availableCount(),
              this.getPoolSize()
            )
            resolve()
          } catch (err) {
            debug('Failed to destroy connection', err)
            this.logger.error('Failed to destroy connection', err)

            // throw error cause infinite event loop; limitation of node-pool
            // throw err;
          }
        })
    }

    // Now that the pool settings are ready create a pool instance.
    debug('Creating pool', this.poolOptions)
    this.pool = genericPool.createPool(factory, this.poolOptions)

    this.pool.on('factoryCreateError', e => {
      debug('Errored while connecting Redis', e)
      this.logger.error('Errored while connecting Redis', e)
    })
    this.pool.on('factoryDestroyError', e => {
      debug('Errored while destroying Redis conn', e)
      this.logger.error('Errored while destroying Redis conn', e)
    })
  }

  /**
   * Send redis instructions
   * @async
   * @param {string} commandName - Name of the command
   * @param {array}  commandArgs - Args sent to the command
   * @returns {promise} Promise resolve with the result or Error
   */
  async sendCommand(commandName: string, commandArgs: any[] = []) {
    debug('Executing send_command', commandName, commandArgs)

    const conn = await this.pool.acquire(this.poolOptions.priorityRange || 1)

    const sendCommand = util.promisify(conn.send_command).bind(conn)
    let result
    try {
      result = await sendCommand(commandName, commandArgs)
      this.pool.release(conn)
    } catch (error) {
      this.pool.release(conn)
      this.logger.error('Errored send_command', error)
      debug('Errored send_command', error)
      throw error
    }

    return result
  }

  /**
   * Acquire a Redis connection and use an optional priority.
   * @async
   * @param {number} priority - priority list number
   * @param {number} db       - Use the db with range {0-16}
   * @returns {Promise<RedisClient>} Promise resolve with the connection or Error
   */
  async acquire(priority?: number, db?: number): Promise<RedisClient> {
    const client = await this.pool.acquire(priority)
    if (client instanceof Error) {
      debug("Couldn't acquire connection to %j", this.redisOptions)
      this.logger.error("Couldn't acquire connection to %j", this.redisOptions)
      throw client
    }

    if (db) {
      this.logger.info('select DB:', db)
      return selectDB(client, db)
    }
    return client
  }

  /**
   * Release a Redis connection to the pool.
   * @async
   * @param {RedisClient} client - Redis connection
   * @returns {PromiseLike<void>} void
   */
  async release(client?: RedisClient): Promise<void> {
    await this.pool.release(client)
  }

  /**
   * Destroy a Redis connection.
   * @async
   * @param {RedisClient} client - Redis connection
   * @returns {PromiseLike<void>} void
   */
  async destroy(client?: RedisClient): Promise<void> {
    await this.pool.destroy(client)
  }

  /**
   * Drains the connection pool and call the callback id provided.
   * @async
   * @returns {promise} Promise
   */
  async drain(): Promise<void> {
    await this.pool.drain()
    this.pool.clear()
  }

  /**
   * Returns factory.name for this pool
   *
   * @returns {string} Name of the pool
   */
  getName(): string {
    return this.name
  }

  /**
   * Returns this.redisOptions for this pool
   *
   * @returns {object} redis options given
   */
  getRedisOptions(): RedisOptions {
    return this.redisOptions
  }

  /**
   * Returns this.poolOptions for this pool
   *
   * @returns {object} pool options given
   */
  getPoolOptions(): PoolOptions {
    return this.poolOptions
  }

  /**
   * Returns size of the pool
   *
   * @returns {number} size of the pool
   */
  getPoolSize(): number {
    return this.pool.size
  }

  /**
   * Returns available connections count of the pool
   *
   * @returns {number} available connections count of the pool
   */
  availableCount(): number {
    return this.pool.available
  }

  /**
   * Returns pending connections count of the pool
   *
   * @returns {number} pending connections count of the pool
   */
  pendingCount(): number {
    return this.pool.pending
  }

  /**
   * Returns pool status and stats
   *
   * @returns {object} pool status and stats
   */
  status(): RedisPoolStatus {
    return {
      name: this.name,
      size: this.pool.size,
      available: this.pool.available,
      pending: this.pool.pending
    }
  }
}

export default RedisPool
