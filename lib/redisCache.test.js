const genRandomStr = require('./genRandomStr')
const {
  init,
  del,
  deleteAll,
  get,
  getName,
  getPoolOptions,
  getRedisOptions,
  getset,
  getTtlInSeconds,
  keys,
  set,
  setTtlInSeconds,
  status,
  wrap,
} = require('./redisCache');

describe('redisCache', () => {
  const name = 'testCache';
  const redisOptions = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    auth_pass: process.env.REDIS_AUTH,
  };
  const poolOptions = {
    min: 2,
    max: 4,
  };
  const ttlInSeconds = 10
  const options = {
    name,
    redisOptions,
    poolOptions,
    ttlInSeconds
  }
  init(options);

  const key = 'chuck-norris';
  const value = 'superman';

  describe('getName', () => {
    test('get given name', () => {
      expect(getName()).toBe(name);
    });
  });

  describe('getRedisOptions', () => {
    test('get given redis options', () => {
      expect(getRedisOptions()).toBe(redisOptions);
    });
  });

  describe('getPoolOptions', () => {
    test('get given pool options', () => {
      expect(getPoolOptions()).toBe(poolOptions);
    });
  });

  describe('getTtlInSeconds', () => {
    test('get ttlInSeconds option', () => {
      expect(getTtlInSeconds()).toBe(ttlInSeconds);
    });
  });

  describe('setTtlInSeconds', () => {
    test('set ttlInSeconds option', () => {
      expect(setTtlInSeconds(2)).toBe(2);
      expect(getTtlInSeconds()).toBe(2);
    });
  });

  describe('status', () => {
    test('get store stats', () => {
      const {
        name: statusName,
        size,
        available,
        pending
      } = status();
      expect(statusName).toBe(name);
      expect(size).toBe(poolOptions.min);
      expect(available).toBe(0);
      expect(pending).toBe(0);
    });
  });

  describe('set', () => {
    beforeEach(() => deleteAll());

    test('set value without expiry if ttl is not provided', async () => {
      await set(key, value)
      expect(get(key)).resolves.toBe(value)
    });

    test('set value with expiry if ttl is provided', async () => {
      await set(key, value, 1)
      expect(get(key)).resolves.toBe(value)
    });
  });

  describe('get', () => {
    beforeEach(() => deleteAll());

    test('get the existing key', async () => {
      await set(key, value)
      expect(get(key)).resolves.toBe(value)
    });

    test('not get the non-existing key',
      () => expect(get('nonExistingKey')).resolves.toBeNull());
  });

  describe('getset', () => {
    beforeEach(() => deleteAll());

    test('get the existing key which is NULL',
      () => expect(getset(key, value, 60)).resolves.toBeNull());

    test('get previous value set', async () => {
      await set(key, value)
      expect(getset(key, value)).resolves.toBe(value)
    });
  });

  describe('wrap', () => {
    const newValue = 'test';
    const fn = () => newValue
    const fnToFail = () => {
      throw new Error('not be called')
    }

    beforeAll(() => deleteAll());

    test("set if key doesn't exist", async () => {
      const localKey = genRandomStr();

      const result = await wrap(localKey, fn, {
        ttlInSeconds: 5000,
      })

      expect(result).toBe(newValue)
      expect(get(localKey)).resolves.toBe(newValue);
    });

    test('get if key exists', async () => {
      const localKey = genRandomStr();

      await set(localKey, newValue)
      expect(wrap(localKey, fnToFail)).resolves.toBe(newValue);
    });

    test('do nothing when ttlInSeconds=0', async () => {
      const localKey = genRandomStr();

      const result = await wrap(localKey, fn, {
        ttlInSeconds: 0,
      })

      expect(result).toBe(newValue)
    });

    test('do nothing when ttlInSeconds=0', async () => {
      const localKey = genRandomStr();

      const result = await wrap(localKey, fn, {
        ttlInSeconds: -1,
      })

      expect(result).toBe(newValue)
    });

    test('do nothing when ttlInSeconds is invalid', async () => {
      const localKey = genRandomStr();

      const result = await wrap(localKey, fn, {
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

    beforeAll(() => deleteAll());
    beforeEach(() => Promise.all(Object.keys(keyValues)
      .map((k) => set(k, keyValues[k]))));

    test('return all the keys', async () =>
      expect(keys()).resolves.toEqual(expect.arrayContaining(Object.keys(keyValues))));

    test('not return keys not matching pattern', async () =>
      expect(keys('test:*')).resolves.toEqual(expect.not.arrayContaining(['key1'])));

    test('return keys matches pattern', async () =>
      expect(keys('test:*')).resolves.toEqual(expect.arrayContaining(['test:key2'])));
  });

  describe('del', () => {
    const keyValues = {
      key1: 'value1',
      key2: 'value2'
    };

    beforeEach(async () => {
      await deleteAll()
      await Promise.all(Object.keys(keyValues)
        .map((k) => set(k, keyValues[k])))
    });

    test('delete keys array', async () => {
      await del(Object.keys(keyValues))
      expect(keys()).resolves.toHaveLength(0)
    });

    test('deletes the key', async () => {
      await del(['key1'])
      expect(keys()).resolves.toEqual(expect.arrayContaining(['key2']));
      expect(keys()).resolves.toEqual(expect.not.arrayContaining(['key1']));
    });

    test('throw for an empty array', async () => {
      expect(del([])).rejects.toThrow();
    });
  });

  describe('deleteAll', () => {
    const keyValues = {
      key1: 'value1',
      key2: 'value2'
    };

    beforeEach(() => Promise.all(Object.keys(keyValues)
      .map((k) => set(k, keyValues[k]))));

    test('delete all the keys', async () => {
      await deleteAll()
      expect(keys()).resolves.toHaveLength(0)
    });

    test('delete all the keys with pattern', async () => {
      await deleteAll('key1*')
      expect(keys()).resolves.toEqual(expect.arrayContaining(['key2']));
    });
  });
});
