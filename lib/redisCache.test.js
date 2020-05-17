const RedisCache = require('./redisCache');

const genKey = () => Math.floor(Math.random(100)).toString();

describe('redisCache', () => {
  // // current limitation due to node-pool limitation
  // describe("connect", () => {
  //
  //   it("throw error on failed initialization", () => {
  //     const redisOptions = Object.assign({
  //       host: "UNAVAILABLE_HOST"
  //     });
  //
  //     (() => new RedisCache("testCache", redisOptions)).should.throw();
  //   });
  // });

  // describe("Store not available", () => {
  // });


  describe('API', () => {
    const name = 'testCache';
    const redisOptions = {
      host: process.env.REDIS_HOST || '127.0.0.1',
      auth_pass: process.env.REDIS_AUTH,
    };
    const poolOptions = {
      min: 2,
      max: 4,
    };
    const cacheTtl = 100
    const options = {
      name,
      redisOptions,
      poolOptions,
      cacheTtl
    }
    const cache = new RedisCache(options);

    const key = 'chuck-norris';
    const value = 'superman';

    describe('getName', () => {
      test('set given name', () => {
        expect(cache.getName()).toBe(name);
      });

      test('set random name if not set', () => {
        const cacheUnNamed = new RedisCache({
          redisOptions,
        });

        expect(cacheUnNamed.getName()).not.toHaveLength(0);
      });
    });

    describe('getRedisOptions', () => {
      test('set given redis options', () => {
        expect(cache.getRedisOptions()).toBe(redisOptions);
      });
    });

    describe('getPoolOptions', () => {
      test('set given pool options', () => {
        expect(cache.getPoolOptions()).toBe(poolOptions);
      });
    });

    describe('status', () => {
      test('get store stats', () => {
        const status = cache.status();
        expect(status.name).toBe(name);
        expect(status.size).toBe(poolOptions.min);
        expect(status.available).toBe(0);
        expect(status.pending).toBe(0);
      });
    });

    describe('set', () => {
      beforeEach(() => cache.deleteAll());

      test('set value without expiry if ttl is not provided', async () => {
        await cache.set(key, value)
        expect(cache.get(key)).resolves.toBe(value)
      });

      test('set value with expiry if ttl is provided', async () => {
        await cache.set(key, value, 1)
        expect(cache.get(key)).resolves.toBe(value)
      });
    });

    describe('get', () => {
      beforeEach(() => cache.deleteAll());

      test('get the existing key', async () => {
        await cache.set(key, value)
        expect(cache.get(key)).resolves.toBe(value)
      });

      test('not get the non-existing key',
        () => expect(cache.get('nonExistingKey')).resolves.toBeNull());
    });

    describe('getset', () => {
      beforeEach(() => cache.deleteAll());

      test('get the existing key which is NULL',
        () => expect(cache.getset(key, value, 60)).resolves.toBeNull());

      test('get previous value set', async () => {
        await cache.set(key, value)
        expect(cache.getset(key, value)).resolves.toBe(value)
      });
    });

    describe('wrap', () => {
      const newValue = 'test';
      const fn = () => newValue
      const fnToFail = () => {
        throw new Error('not be called')
      }

      beforeAll(() => cache.deleteAll());

      test("set if key doesn't exist", async () => {
        const localKey = genKey();

        const result = await cache.wrap(localKey, fn, {
          ttlInSeconds: 5000,
        })

        expect(result).toBe(newValue)
        expect(cache.get(localKey)).resolves.toBe(newValue);
      });

      test('get if key exists', async () => {
        const localKey = genKey();

        await cache.set(localKey, newValue)
        expect(cache.wrap(localKey, fnToFail)).resolves.toBe(newValue);
      });

      test('do nothing when ttlInSeconds=0', async () => {
        const localKey = genKey();

        const result = await cache.wrap(localKey, fn, {
          ttlInSeconds: 0,
        })

        expect(result).toBe(newValue)
      });

      test('do nothing when ttlInSeconds=0', async () => {
        const localKey = genKey();

        const result = await cache.wrap(localKey, fn, {
          ttlInSeconds: -1,
        })

        expect(result).toBe(newValue)
      });

      test('do nothing when ttlInSeconds is invalid', async () => {
        const localKey = genKey();

        const result = await cache.wrap(localKey, fn, {
          ttlInSeconds: 'NOT_NUMBER',
        })

        expect(result).toBe(newValue)
      });
    });

    describe('keys', () => {
      const keyValues = {
        key1: 'value1',
        'test:key2': 'value2'
      };

      beforeAll(() => cache.deleteAll());
      beforeEach(() => Promise.all(Object.keys(keyValues)
        .map((k) => cache.set(k, keyValues[k]))));

      test('return all the keys', async () => {
        const keys = await cache.keys()

        expect(keys).toEqual(expect.arrayContaining(Object.keys(keyValues)));
      });

      test('not return keys not matching pattern', async () => {
        const keys = await cache.keys('test:*')

        expect(keys).toEqual(expect.not.arrayContaining(['key1']));
      });

      test('return keys matches pattern', async () => {
        const keys = await cache.keys('test:*')

        expect(keys).toEqual(expect.arrayContaining(['test:key2']));
      });
    });

    describe('deleteAll', () => {
      const keyValues = {
        key1: 'value1',
        key2: 'value2'
      };

      beforeEach(() => Promise.all(Object.keys(keyValues)
        .map((k) => cache.set(k, keyValues[k]))));

      test('delete all the keys', async () => {
        await cache.deleteAll()
        expect(cache.keys()).resolves.toHaveLength(0)
      });

      test('delete all the keys with pattern', async () => {
        await cache.deleteAll('key1*')
        expect(cache.keys()).resolves.toEqual(expect.arrayContaining(['key2']));
      });
    });
  });
});
