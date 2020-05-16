const Bluebird = require('bluebird');
const RedisStore = require("./redisStore");

describe('redisStore', () => {
  const name = 'testStore';
  const redisOptions = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    auth_pass: process.env.REDIS_AUTH || 'admin'
  };

  // describe("constructor", () => {
  //
  //   it("should invalid host fail acquire connection", () => {
  //
  //     (new RedisStore({
  //       redisOptions: {
  //         host: "UNAVAILABLE_HOST"
  //       }
  //     })).should.throw();
  //   });
  //
  //   it("should conn timeout fail acquire connection", () => {
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
    test('should set given name', () => {
      const store = new RedisStore({
        name
      });
      expect(store.getName()).toBe(name);
    });

    test('should set random name if not set', () => {
      const store = new RedisStore();

      expect(store.getName()).not.toHaveLength(0);
    });
  });

  describe('getRedisOptions', () => {
    test('should set given redis options', () => {
      const store = new RedisStore({
        redisOptions
      });

      expect(store.getRedisOptions()).toBe(redisOptions);
    });
  });

  describe('getPoolOptions', () => {
    test('should set given pool options', () => {
      const poolOptions = {
        min: 2,
        max: 4,
      };
      const store = new RedisStore({
        name,
        redisOptions,
        poolOptions
      });

      expect(store.getPoolOptions()).toBe(poolOptions);
    });
  });

  describe('status', () => {
    test('should get store stats', () => {
      const name = 'testStore';
      const poolOptions = {
        min: 2,
        max: 4,
      };
      const store = new RedisStore({
        name,
        redisOptions,
        poolOptions
      });

      const status = store.status();
      expect(status.name).toBe(name);
      expect(status.size).toBe(poolOptions.min);
      expect(status.available).toBe(0);
      expect(status.pending).toBe(0);
    });
  });

  describe('ping', () => {
    const store = new RedisStore({
      redisOptions
    });

    test(
      "should return 'PONG' if no arg is supplied",
      () => expect(store.ping()).toBe("PONG")
    );

    test("should return 'string supplied'", () => {
      const str = 'Yello';
      return expect(store.ping(str)).toBe(str);
    });
  });


  describe('get', () => {
    const store = new RedisStore({
      name,
      redisOptions
    });

    test('should retrieve an existing key', () => {
      const key = 'chuck-norris';
      const value = 'superman';

      return expect(store.set(key, value)
        .then((test) => {
          expect(test).toBeTruthy();
        })
        .then(() => store.get(key))).toBe(value);
    });

    test('should retrieve parsed json', () => {
      const key = 'chuck-norris';
      const value = {
        type: 'superman'
      };

      return expect(store.set(key, value)
        .then((test) => {
          expect(test).toBeTruthy();
        })
        .then(() => store.get(key))).toEqual(value);
    });

    test(
      "should return null if key doesn't exist",
      () => expect(store.get("unknownKey")).toBeNull()
    );
  });

  describe('set', () => {
    const store = new RedisStore({
      name,
      redisOptions
    });

    test('should store a value', () => {
      const key = 'key';
      const value = 'neverExpire';

      return expect(store.set(key, value)
        .then((test) => {
          expect(test).toBeTruthy();
        })
        .then(() => store.get(key))).toBe(value);
    });

    test('should store json', () => {
      const key = 'key';
      const value = {
        type: 'json'
      };

      return expect(store.set(key, value)
        .then((test) => {
          expect(test).toBeTruthy();
        })
        .then(() => store.get(key))).toEqual(value);
    });

    test('should store array', () => {
      const key = 'key';
      const value = ['json', 'node'];

      return expect(store.set(key, value)
        .then((test) => {
          expect(test).toBeTruthy();
        })
        .then(() => store.get(key))).toEqual(value);
    });

    test('should store with an expiry if ttl set', () => {
      const key = 'shortLivedKey';
      const value = 'expireIn1s';
      const ttlInSeconds = 1;

      expect(store.set(key, value, ttlInSeconds)
        .then((test) => {
          expect(test).toBeTruthy();
        })
        .then(() => store.get(key))).toBe(value);

      return Bluebird.delay(ttlInSeconds * 1000)
        .done(() => expect(store.get(key)).toBeNull(),
        );
    });
  });

  describe('del', () => {
    const store = new RedisStore({
      name,
      redisOptions
    });

    test('should delete an existing key', () => {
      const key = 'key';
      const value = 'neverExpire';

      return expect(store.set(key, value)
        .then((test) => {
          expect(test).toBeTruthy();
        })
        .then(() => store.del(key))
        .then((v) => {
          expect(v).toBe(1);
        })
        .then(() => store.get(key))).toBeNull();
    });

    test(
      'should return null deleting non-existing key',
      () => store.del("unknownKey")
          .then(v => {
            expect(v).toBe(0);
          })
    );
  });

  describe('expire', () => {
    const store = new RedisStore({
      name,
      redisOptions
    });

    test('should set a key with expire in seconds', () => {
      const key = 'key';
      const value = 'make it expire';
      const ttlInSeconds = 1;

      expect(store.set(key, value)
        .then((test) => {
          expect(test).toBeTruthy();
        })
        .then(() => store.expire(key, ttlInSeconds))).toBeTruthy();

      return Bluebird.delay(ttlInSeconds * 1000)
        .done(() => expect(store.get(key)).toBeNull());
    });

    test(
      'should return null expiring non-existing key',
      () => expect(store.expire("unknownKey", 10)).toBeNull()
    );
  });

  describe('ttl', () => {
    const store = new RedisStore({
      name,
      redisOptions
    });

    beforeAll(() => store.deleteAll());

    test('should return ttl left for a key in seconds', () => {
      const key = 'key';
      const value = 'make it expire';
      const ttlInSeconds = 10;

      return expect(// it should be same as the time elapsed is very vvery small
      store.set(key, value, ttlInSeconds)
        .then((test) => {
          expect(test).toBeTruthy();
        })
        .then(() => store.getTtl(key))).toBe(ttlInSeconds);
    });

    test(
      'should return null on ttl for a non-existing key',
      () => expect(store.getTtl("unknownKey")).toBeNull()
    );
  });

  describe('keys', () => {
    const store = new RedisStore({
      name,
      redisOptions
    });

    const keyValues = { key1: 'value1', key2: 'value2'};

    beforeAll(() => store.deleteAll());

    beforeEach(() => Promise.all(Object.keys(keyValues)
      .map((key) => store.set(key, keyValues[key]))));

    test('should return all the keys', () => store.keys()
        .then(keys => keys.map(k => expect(Object.keys(keyValues)).to.containEql(k))));

    test(
      'should return all the keys matches pattern',
      () => expect(store.keys("key[2]")).to.eventually.containEql("key2")
    );
  });

  describe('deleteAll', () => {
    const store = new RedisStore({
      name,
      redisOptions
    });

    const keyValues = { key1: 'value1', key2: 'value2'};

    beforeEach(() => Promise.all(Object.keys(keyValues)
      .map((key) => store.set(key, keyValues[key]))));

    test('should delete all the keys', () => expect(store.deleteAll()
        .then(v => expect(v).toBe(2))
        .then(() => store.keys())).toHaveLength(0));

    test(
      'should delete all the keys matches pattern',
      () => expect(store.deleteAll("key[2]")
          .then(v => {
            expect(v).toBe(1);
          })
          .then(() => store.keys())).not.toHaveLength(0)
          .and.not.containEql("key2")
    );

    test('should not delete when nothing matches', () => expect(store.deleteAll()
        .then(v => {
          expect(v).toBe(2);
        })
        .then(() => store.deleteAll("nonExistingKey"))).toBe(0));

    test(
      'should delete if function is deleted from cache',
      () => expect(store.deleteAll()
          .then(v => {
            expect(v).toBe(2);
          })
          .then(() => store.sendCommand("script", ["flush"]))
          .then(() => store.deleteAll())).toBe(0)
    );
  });
});
