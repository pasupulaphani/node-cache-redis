const RedisCache = require('./redisCache');

describe('redisCache', () => {
  // // current limitation due to node-pool limitation
  // describe.only("connect", () => {
  //
  //   it("should throw error on failed initialization", () => {
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
      auth_pass: process.env.REDIS_AUTH || 'admin',
    };
    const cache = new RedisCache({
      name,
      redisOptions,
      cacheTtl: 100,
    });

    describe('set', () => {
      const key = 'captain-america';
      const value = 'daddyIssues';

      beforeEach(() => cache.deleteAll());

      test(
        'should set value without expiry if ttl is not provided',
        () => expect(cache.set(key, value)
          .then(() => cache.get(key))).toBe(value)
      );

      test(
        'should set value with expiry if ttl is provided',
        () => expect(cache.set('key', 'value', 1)).toBeTruthy()
      );
    });

    describe('get', () => {
      const key = 'chuck-norris';
      const value = 'superman';

      beforeAll(() => cache.set(key, value));

      test('should get the existing key', () => expect(cache.get(key)).toBe(value));

      test(
        'should not get the non-existing key',
        () => expect(cache.get('nonExistingKey')).toBeFalsy()
      );
    });

    describe('getset', () => {
      const key = 'chuck-norris';
      const value = 'superman';

      beforeAll(() => cache.deleteAll());

      test(
        'should get the existing key which is NULL',
        () => expect(cache.getset(key, value, 60)).toBeFalsy()
      );

      test(
        'should get previous value set',
        () => expect(cache.getset(key, value)).toBe(value)
      );
    });


    describe('wrap', () => {
      const value = 'test';

      function genKey() {
        return `${Math.floor(Math.random(100))}`;
      }

      beforeAll(() => cache.deleteAll());

      test("should set if key doesn't exist", () => {
        const key = genKey();

        function fn() {
          return value;
        }

        return expect(cache
          .wrap(key, fn, {
            ttlInSeconds: 5000,
          })
          .then((v) => expect(v).toBe(value))
          .then(() => cache.get(key))).toBe(value);
      });

      test('should get if key exists', () => {
        const key = genKey();

        function failIfCalled(value) {
          expect('Should not be called').fail;
          return value;
        }

        return expect(cache.set(key, value)
          .then((v) => expect(v).toBeTruthy())
          .then(() => cache.wrap(key, failIfCalled))).toBe(value);
      });

      test('should do nothing when ttlInSeconds=0', () => {
        function fn() {
          return value;
        }

        return expect(cache
          .wrap(genKey(), fn, {
            ttlInSeconds: 0,
          })).toBe(value);
      });

      test('should do nothing when ttlInSeconds < 0', () => {
        function fn() {
          return value;
        }

        return expect(cache
          .wrap(genKey(), fn, {
            ttlInSeconds: -1,
          })).toBe(value);
      });

      test('should do nothing when ttlInSeconds is invalid', () => {
        function fn() {
          return value;
        }

        return expect(cache
          .wrap(genKey(), fn, {
            ttlInSeconds: 'NOT_NUMBER',
          })).toBe(value);
      });
    });

    describe('keys', () => {
      const keyValues = { key1: 'value1', 'test:key2': 'value2' };

      beforeAll(() => cache.deleteAll());
      beforeEach(() => Promise.all(Object.keys(keyValues)
        .map((key) => cache.set(key, keyValues[key]))));

      test('should return all the keys', () => cache.keys()
        .then((keys) => keys.map((k) => expect(Object.keys(keyValues)).to.containEql(k))));

      test(
        'should not return keys not matching pattern',
        () => expect(cache.keys('test:*')).to.eventually.not.containEql('key1')
      );

      test(
        'should return keys matches pattern',
        () => expect(cache.keys('test:*')).to.eventually.containEql('test:key2')
      );
    });

    describe('deleteAll', () => {
      const keyValues = { key1: 'value1', key2: 'value2' };

      beforeEach(() => Promise.all(Object.keys(keyValues)
        .map((key) => cache.set(key, keyValues[key]))));

      test('should delete all the keys', () => expect(cache.deleteAll()
        .then(() => cache.keys())).toHaveLength(0));

      test(
        'should delete all the keys with pattern',
        () => expect(cache.deleteAll('key1*')
          .then(() => cache.keys())).toEqual(['key2'])
      );
    });

    describe('getName', () => {
      test('should set given name', () => {
        expect(cache.getName()).toBe(name);
      });

      test('should set random name if not set', () => {
        const cache = new RedisCache({
          redisOptions,
        });

        expect(cache.getName()).not.toHaveLength(0);
      });
    });

    describe('getRedisOptions', () => {
      test('should set given redis options', () => {
        expect(cache.getRedisOptions()).toBe(redisOptions);
      });
    });

    describe('getPoolOptions', () => {
      test('should set given pool options', () => {
        const poolOptions = {
          min: 2,
          max: 4,
        };
        const cache = new RedisCache({
          name,
          redisOptions,
          poolOptions,
        });

        expect(cache.getPoolOptions()).toBe(poolOptions);
      });
    });

    describe('status', () => {
      test('should get store stats', () => {
        const name = 'testStore';
        const poolOptions = {
          min: 2,
          max: 4,
        };
        const cache = new RedisCache({
          name,
          redisOptions,
          poolOptions,
        });

        const status = cache.status();
        expect(status.name).toBe(name);
        expect(status.size).toBe(poolOptions.min);
        expect(status.available).toBe(0);
        expect(status.pending).toBe(0);
      });
    });
  });
});
