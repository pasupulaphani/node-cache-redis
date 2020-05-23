const RedisStore = require('./redisStore')

describe('redisStore', () => {
  const name = 'testStore'
  const redisOptions = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    auth_pass: process.env.REDIS_AUTH
  }
  const poolOptions = {
    min: 2,
    max: 4
  }
  const options = {
    name,
    redisOptions,
    poolOptions
  }

  let store
  beforeEach(() => {
    store = new RedisStore(options)
  })

  // describe("constructor", () => {
  //
  //   it("invalid host fail acquire connection", () => {
  //
  //     (new RedisStore({
  //       redisOptions: {
  //         host: "UNAVAILABLE_HOST"
  //       }
  //     })).should.throw();
  //   });
  //
  //   it("conn timeout fail acquire connection", () => {
  //
  //     (new RedisStore({
  //       redisOptions: redisOptions,
  //       poolOptions: {
  //         acquireTimeoutMillis: 1
  //       }
  //     })).should.throw();
  //   });
  // });

  describe('getName', () => {
    test('set given name', () => {
      expect(store.getName()).toBe(name)
    })

    test('set random name if not set', () => {
      const noNameStore = new RedisStore()

      expect(noNameStore.getName()).not.toHaveLength(0)
    })
  })

  describe('getRedisOptions', () => {
    test('set given redis options', () => {
      expect(store.getRedisOptions()).toBe(redisOptions)
    })
  })

  describe('getPoolOptions', () => {
    test('set given pool options', () => {
      expect(store.getPoolOptions()).toBe(poolOptions)
    })
  })

  describe('status', () => {
    test('get store stats', () => {
      const status = store.status()
      expect(status.name).toBe(name)
      expect(status.size).toBe(poolOptions.min)
      expect(status.available).toBe(0)
      expect(status.pending).toBe(0)
    })
  })

  describe('ping', () => {
    test("return 'PONG' if no arg is supplied", () =>
      expect(store.ping()).resolves.toBe('PONG'))

    test("return 'string supplied'", () => {
      const str = 'Yello'
      expect(store.ping(str)).resolves.toBe(str)
    })
  })

  describe('get', () => {
    test('retrieve an existing key', async () => {
      const key = 'chuck-norris'
      const value = 'superman'

      await store.set(key, value)

      expect(store.get(key)).resolves.toBe(value)
    })

    test('retrieve parsed json', async () => {
      const key = 'chuck-norris'
      const value = {
        type: 'superman'
      }

      await store.set(key, value)

      expect(store.get(key)).resolves.toStrictEqual(value)
    })

    test('retrieve parsed array', async () => {
      const key = 'chuck-norris'
      const value = ['superman', 'spideman']

      await store.set(key, value)

      expect(store.keys()).resolves.toEqual(expect.arrayContaining([key]))
    })

    test("return null if key doesn't exist", () =>
      expect(store.get('unknownKey')).resolves.toBeNull())
  })

  describe('set', () => {
    test('store a value', async () => {
      const key = 'key'
      const value = 'neverExpire'

      const result = await store.set(key, value)
      expect(result).toBe('OK')

      expect(store.get(key)).resolves.toBe(value)
    })

    test('store json', async () => {
      const key = 'key'
      const value = {
        type: 'json'
      }

      const result = await store.set(key, value)
      expect(result).toBe('OK')

      expect(store.get(key)).resolves.toStrictEqual(value)
    })

    test('store array', async () => {
      const key = 'key'
      const value = ['json', 'node']

      const result = await store.set(key, value)
      expect(result).toBe('OK')

      expect(store.get(key)).resolves.toEqual(expect.arrayContaining(value))
    })

    test('store with an expiry if ttl set', async () => {
      const key = 'shortLivedKey'
      const value = 'expireIn1s'
      const ttlInSeconds = 1

      const result = await store.set(key, value, ttlInSeconds)
      expect(result).toBe('OK')

      expect(store.get(key)).resolves.toBe(value)

      await new Promise((r) => setTimeout(r, 1100))
      expect(store.get(key)).resolves.toBeNull()
    })
  })

  describe('del', () => {
    test('delete an existing key', async () => {
      const key = 'key'
      const value = 'neverExpire'

      await store.set(key, value)
      const result = await store.del(key)
      expect(result).toBe(1)

      expect(store.del(key)).resolves.toBe(0)
    })

    test('return null deleting non-existing key', () =>
      expect(store.del('unknownKey')).resolves.toBe(0))
  })

  describe('expire', () => {
    test('set a key with expire in seconds', async () => {
      const key = 'key'
      const value = 'make it expire'
      const ttlInSeconds = 1

      await store.set(key, value)
      const result = await store.expire(key, ttlInSeconds)
      expect(result).toBe(1)

      await new Promise((r) => setTimeout(r, 1100))
      expect(store.get(key)).resolves.toBeNull()
    })

    test('return null expiring non-existing key', () =>
      expect(store.expire('unknownKey', 10)).resolves.toBe(0))
  })

  describe('ttl', () => {
    test('return ttl left for a key in seconds', async () => {
      const key = 'key'
      const value = 'make it expire'
      const ttlInSeconds = 10

      await store.set(key, value, ttlInSeconds)

      const result = await store.getTtl(key)
      expect(result).toBe(ttlInSeconds)
    })

    test('return null on ttl for a non-existing key', () =>
      expect(store.getTtl('unknownKey')).resolves.toBe(-2))
  })

  describe('keys', () => {
    const keyValues = {
      key1: 'value1',
      key2: 'value2'
    }

    beforeEach(async () => {
      await Promise.all(
        Object.keys(keyValues).map((key) => store.set(key, keyValues[key]))
      )
    })

    test('return all the keys', async () => {
      const keys = await store.keys()

      expect(keys).toEqual(expect.arrayContaining(Object.keys(keyValues)))
    })

    test('return all the keys matches pattern', () =>
      expect(store.keys('key[2]')).resolves.toStrictEqual(['key2']))
  })

  describe('deleteAll', () => {
    const keyValues = {
      key1: 'value1',
      key2: 'value2'
    }

    beforeEach(async () => {
      await store.deleteAll()
      await Promise.all(
        Object.keys(keyValues).map((key) => store.set(key, keyValues[key]))
      )
    })

    test('delete all the keys', async () => {
      const result = await store.deleteAll()
      expect(result).toBe(2)

      expect(store.keys()).resolves.toHaveLength(0)
    })

    test('delete all the keys matches pattern', async () => {
      const result = await store.deleteAll('key[2]')
      expect(result).toBe(1)

      expect(store.keys()).resolves.toEqual(
        expect.not.arrayContaining(['key2'])
      )
    })

    test('not delete when nothing matches', async () => {
      const result = await store.deleteAll('test')
      expect(result).toBe(0)
    })
  })
})
