import RedisPool from './RedisConnectionPool'

describe('redisConnectionPool', () => {
  const name = 'testPool'
  const redisOptions = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    auth_pass: process.env.REDIS_AUTH
  }
  const poolOptions = { min: 2, max: 4 }
  const options = { name, redisOptions, poolOptions }

  let pool: RedisPool
  beforeEach(() => {
    pool = new RedisPool(options)
  })

  describe('constructor', () => {
    test('set db when sent as constructor option', async () => {
      const db = 1
      const localPool = new RedisPool({
        ...options,
        redisOptions: {
          ...redisOptions,
          db
        }
      })

      const client = await localPool.acquire()
      // @ts-ignore
      expect(client.selected_db).toBe(db)
    })
  })

  describe('getName', () => {
    test('set given name', () => {
      expect(pool.getName()).toBe(name)
    })

    test('set random name if not set', () => {
      const poolUnNamed = new RedisPool(options)

      expect(poolUnNamed.getName()).not.toHaveLength(0)
    })
  })

  describe('getRedisOptions', () => {
    test('set given redis options', () => {
      expect(pool.getRedisOptions()).toBe(redisOptions)
    })
  })

  describe('getPoolOptions', () => {
    test('set given pool options', () => {
      expect(pool.getPoolOptions()).toBe(poolOptions)
    })
  })

  describe('status', () => {
    test('get pool stats', () => {
      const status = pool.status()
      expect(status.name).toBe(name)
      expect(status.size).toBe(poolOptions.min)
      expect(status.available).toBe(0)
      expect(status.pending).toBe(0)
    })
  })

  describe('acquire', () => {
    test('acquire connection with valid host', async () => {
      const client = await pool.acquire()
      expect(client).toBeTruthy()
    })

    test('acquire connection to db when set', async () => {
      const db = 1

      const client = await pool.acquire(0, db)
      // @ts-ignore
      expect(client.selected_db).toBe(db)
    })

    test('wait to acquire if all used up', async () => {
      const localPoolOptions = { min: 0, max: 1 }
      const localPool = new RedisPool({
        ...options,
        poolOptions: localPoolOptions
      })

      expect(localPool.availableCount()).toBe(localPoolOptions.min)
      expect(localPool.getPoolSize()).toBe(localPoolOptions.min)
      expect(localPool.pendingCount()).toBe(0)

      const client = await localPool.acquire()

      expect(localPool.availableCount()).toBe(localPoolOptions.min)
      expect(localPool.getPoolSize()).toBe(1)
      expect(localPool.pendingCount()).toBe(0)

      await localPool.release(client)
      expect(localPool.availableCount()).toBe(1)

      await localPool.acquire()
      expect(localPool.availableCount()).toBe(0)
      expect(localPool.getPoolSize()).toBe(1)
      expect(localPool.pendingCount()).toBe(0)

      // tslint:disable-next-line:no-floating-promises
      localPool.acquire() // this is hanging op so no return
      expect(localPool.availableCount()).toBe(0)
      expect(localPool.getPoolSize()).toBe(1)
      expect(localPool.pendingCount()).toBe(1)
    })

    test('not fail with many higher min connections', async () => {
      const localPool = new RedisPool({
        ...options,
        poolOptions: { min: 5, max: 10 }
      })

      const client = await localPool.acquire()
      expect(client).toBeTruthy()
    })

    test('invalid host fail acquire connection', async () => {
      const localPool = new RedisPool({
        ...options,
        redisOptions: { ...redisOptions, host: 'UNAVAILABLE_HOST' }
      })

      await expect(localPool.acquire()).rejects.toThrowError(
        'Failed redis createClient, {"host":"UNAVAILABLE_HOST"}'
      )
    })

    test('conn timeout fail acquire connection', async () => {
      const localPool = new RedisPool({
        ...options,
        poolOptions: { min: 1, acquireTimeoutMillis: 1 }
      })

      // make the conn is in-use
      await new Promise(r => setTimeout(r, 300))
      await localPool.acquire()

      await new Promise(r => setTimeout(r, 1500))
      await expect(() => localPool.acquire()).rejects.toThrowError(
        'ResourceRequest timed out'
      )
    })
  })

  describe('release', () => {
    test('release connection with valid host', async () => {
      const localPool = new RedisPool(options)
      await new Promise(r => setTimeout(r, 300))

      expect(localPool.availableCount()).toBe(poolOptions.min)
      expect(localPool.getPoolSize()).toBe(poolOptions.min)
      expect(localPool.pendingCount()).toBe(0)

      const client = await localPool.acquire()

      expect(localPool.availableCount()).toBe(poolOptions.min - 1)

      await localPool.release(client)
      expect(localPool.availableCount()).toBe(poolOptions.min)
    })

    test('release connection with invalid host', async () => {
      const localPool = new RedisPool({
        ...options,
        redisOptions: { ...redisOptions, host: 'UNAVAILABLE_HOST' }
      })

      await expect(localPool.release()).rejects.toThrowError(
        'Resource not currently part of this pool'
      )
    })
  })

  describe('destroy', () => {
    test('destroy connection with valid host', async () => {
      const localPool = new RedisPool(options)
      await new Promise(r => setTimeout(r, 300))

      expect(localPool.availableCount()).toBe(poolOptions.min)
      expect(localPool.getPoolSize()).toBe(poolOptions.min)
      expect(localPool.pendingCount()).toBe(0)

      const client = await localPool.acquire()

      expect(localPool.availableCount()).toBe(poolOptions.min - 1)
      await localPool.destroy(client)

      await new Promise(r => setTimeout(r, 300))
      expect(localPool.availableCount()).toBe(poolOptions.min)
    })
  })

  describe('drain', () => {
    test('drain all the coonections', async () => {
      const localPool = new RedisPool(options)
      await new Promise(r => setTimeout(r, 300))

      expect(localPool.availableCount()).toBe(poolOptions.min)
      expect(localPool.getPoolSize()).toBe(poolOptions.min)
      expect(localPool.pendingCount()).toBe(0)

      const client = await localPool.acquire()
      expect(localPool.availableCount()).toBe(poolOptions.min - 1)
      await localPool.destroy(client)

      await localPool.drain()
      await new Promise(r => setTimeout(r, 300))
      expect(localPool.availableCount()).toBe(poolOptions.min)
      expect(localPool.getPoolSize()).toBe(0)
    })
  })

  describe('sendCommand', () => {
    const key = 'MyNameIs'
    const value = 'RealSlimShady'

    beforeEach(() => pool.sendCommand('del', ['*']))

    test('execute given command', async () => {
      await pool.sendCommand('set', [key, value])

      const result = await pool.sendCommand('get', [key])
      return expect(result).toBe(value)
    })

    test('reject when cmd failed', async () => {
      await expect(pool.sendCommand('keys')).rejects.toThrowError(
        /ERR wrong number of arguments for 'keys' command/
      )
    })
  })
})
