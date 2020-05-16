const Bluebird = require('bluebird');
const RedisPool = require("./redisConnectionPool");

describe('redisPool', () => {
  const options = {
    redisOptions: {
      host: process.env.REDIS_HOST || '127.0.0.1',
      auth_pass: process.env.REDIS_AUTH || 'admin'
    },
  };

  describe('constructor', () => {
    test('should set db when sent as constructor option', () => {
      const redisDb = 1;
      const redisOptions = { ...options.redisOptions, db: redisDb};
      const pool = new RedisPool({ ...options, redisOptions: redisOptions});

      return expect(pool.acquire()
        .then((c) => c.selected_db)).toBe(redisDb);
    });
  });

  describe('acquire', () => {
    test('should acquire connection with valid host', () => {
      const pool = new RedisPool(options);

      return expect(pool.acquire()).toBeTruthy();
    });

    test('should acquire connection to db when set', () => {
      const pool = new RedisPool(options);
      const db = 1;

      return expect(pool.acquire(0, db)
        .then((c) => c.selected_db)).toBe(db);
    });

    test('should wait to acquire if all used up', () => {
      const poolOptions = {
        min: 0,
        max: 1,
      };
      const pool = new RedisPool({ ...options, poolOptions: poolOptions});

      expect(pool.availableCount()).toBe(poolOptions.min);
      expect(pool.getPoolSize()).toBe(poolOptions.min);
      expect(pool.pendingCount()).toBe(0);

      return pool.acquire()
        .then((client) => {
          expect(pool.availableCount()).toBe(poolOptions.min);
          expect(pool.getPoolSize()).toBe(1);
          expect(pool.pendingCount()).toBe(0);
          return pool.release(client);
        })
        .then(() => expect(pool.availableCount()).toBe(1))
        .then(() => pool.acquire())
        .then(() => {
          expect(pool.availableCount()).toBe(0);
          expect(pool.getPoolSize()).toBe(1);
          expect(pool.pendingCount()).toBe(0);
        })
        .then(() => {
          pool.acquire(); // this is hanging op so no return
        })
        .then(() => {
          expect(pool.availableCount()).toBe(0);
          expect(pool.getPoolSize()).toBe(1);
          expect(pool.pendingCount()).toBe(1);
        });
    });

    test('should not fail with many higher min connections', () => {
      const poolOptions = {
        min: 5,
        max: 10,
      };
      const pool = new RedisPool({ ...options, poolOptions: poolOptions});

      expect(pool.acquire()).toBeTruthy();
    });

    test('should invalid host fail acquire connection', () => {
      const redisOptions = { ...options.redisOptions, host: "UNAVAILABLE_HOST"};
      const pool = new RedisPool({ ...options, redisOptions: redisOptions});

      return expect(pool.acquire()).toBe.rejectedWith(Error, { name: 'CONN_FAILED'});
    });

    test('should conn timeout fail acquire connection', () => {
      const poolOptions = {
        min: 1,
        acquireTimeoutMillis: 1,
      };
      const pool = new RedisPool({ ...options, poolOptions: poolOptions});

      // make the conn is inuse
      pool.acquire()
        .then((conn) => pool.release(conn));

      expect(pool.acquire()).toBe.rejectedWith(Error, { name: 'TimeoutError'});
    });
  });

  describe('release', () => {
    const poolOptions = {
      min: 2,
      max: 4,
    };
    const pool = new RedisPool({ ...options, poolOptions: poolOptions});

    test('should release connection with valid host', () => {
      expect(pool.availableCount()).toBe(poolOptions.min);
      expect(pool.getPoolSize()).toBe(poolOptions.min);
      expect(pool.pendingCount()).toBe(0);

      return pool.acquire()
        .then((client) => {
          expect(pool.availableCount()).toBe(poolOptions.min - 1);
          return pool.release(client);
        })
        .then(() => expect(pool.availableCount()).toBe(poolOptions.min));
    });

    test('should release connection with invalid host', () => {
      const redisOptions = { ...options.redisOptions, host: "UNAVAILABLE_HOST"};
      const pool = new RedisPool({ ...options, redisOptions: redisOptions});

      return pool.acquire()
        .catch(() => expect(pool.release()).toBe.rejectedWith(/Resource not currently part of this pool/));
    });
  });

  describe('destroy', () => {
    const poolOptions = {
      min: 2,
      max: 4,
    };
    const pool = new RedisPool({ ...options, poolOptions: poolOptions});

    test('should destroy connection with valid host', () => {
      expect(pool.availableCount()).toBe(poolOptions.min);
      expect(pool.getPoolSize()).toBe(poolOptions.min);
      expect(pool.pendingCount()).toBe(0);

      return pool.acquire()
        .then((client) => {
          expect(pool.availableCount()).toBe(poolOptions.min - 1);
          return pool.destroy(client);
        })
        .then(() => Bluebird.delay(100)) // remove bluebird use await async
        .then(() => expect(pool.availableCount()).toBe(poolOptions.min));
    });
  });

  describe('drain', () => {
    const poolOptions = {
      min: 2,
      max: 4,
    };
    const pool = new RedisPool({ ...options, poolOptions: poolOptions});

    test('should drain all the coonections', (done) => {
      expect(pool.availableCount()).toBe(poolOptions.min);
      expect(pool.getPoolSize()).toBe(poolOptions.min);
      expect(pool.pendingCount()).toBe(0);

      return pool.drain()
        .then(() => {
          console.log('***********************test');
          expect(pool.availableCount()).toBe(poolOptions.min);
          expect(pool.getPoolSize()).toBe(poolOptions.min);
          done();
        });
    });
  });

  describe('getName', () => {
    test('should set given name', () => {
      const name = 'testPool';
      const pool = new RedisPool({ ...options, name: name});

      expect(pool.getName()).toBe(name);
    });

    test('should set random name if not set', () => {
      const pool = new RedisPool(options);

      expect(pool.getName()).not.toHaveLength(0);
    });
  });

  describe('getRedisOptions', () => {
    test('should set given redis options', () => {
      const pool = new RedisPool(options);

      expect(pool.getRedisOptions()).toBe(options.redisOptions);
    });
  });

  describe('getPoolOptions', () => {
    test('should set given pool options', () => {
      const poolOptions = {
        min: 2,
        max: 4,
      };
      const pool = new RedisPool({ ...options, poolOptions: poolOptions});

      expect(pool.getPoolOptions()).toBe(poolOptions);
    });
  });

  describe('status', () => {
    test('should get pool stats', () => {
      const name = 'testPool';
      const poolOptions = {
        min: 2,
        max: 4,
      };
      const pool = new RedisPool({ ...options, name: name,
        poolOptions: poolOptions});

      const status = pool.status();
      expect(status.name).toBe(name);
      expect(status.size).toBe(poolOptions.min);
      expect(status.available).toBe(0);
      expect(status.pending).toBe(0);
    });
  });

  describe('sendCommand', () => {
    const key = 'MyNameIs';
    const value = 'RealSlimShady';
    const pool = new RedisPool(options);

    beforeEach(() => pool.sendCommand('del', '*'));

    test(
      'should execute given command',
      () => expect(pool.sendCommand("set", [key, value])
          .then(() => pool.sendCommand("get", [key]))).toBe(value)
    );

    test(
      'should reject when cmd failed',
      () => expect(pool.sendCommand("keys")).toBe.rejectedWith(/ERR wrong number of arguments for 'keys' command/)
    );
  });
});
