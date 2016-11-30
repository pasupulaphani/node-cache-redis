require("should");
const Bluebird = require("bluebird");
const RedisPool = require("../lib/redis_pool");

describe("redisPool", () => {

  const options = {
    redisOptions: {
      host: process.env.REDIS_HOST || "127.0.0.1"
    }
  };

  describe("constructor", () => {

    it("should set db when sent as constructor option", () => {

      const redisDb = 1;
      const redisOptions = Object.assign({}, options.redisOptions, {
        db: redisDb
      });
      const pool = new RedisPool(Object.assign({}, options, {
        redisOptions: redisOptions
      }));

      return pool.acquire()
        .then(c => c.selected_db)
        .should.eventually.be.equal(redisDb);
    });
  });

  describe("acquire", () => {

    it("should acquire connection with valid host", () => {

      const pool = new RedisPool(options);

      return pool.acquire()
        .should.eventually.be.ok();
    });

    it("should acquire connection to db when set", () => {

      const pool = new RedisPool(options);
      const db = 1;

      return pool.acquire(0, db)
        .then(c => c.selected_db)
        .should.eventually.be.equal(db);
    });

    it("should wait to acquire if all used up", () => {
      const poolOptions = {
        min: 0,
        max: 1
      };
      const pool = new RedisPool(Object.assign({}, options, {
        poolOptions: poolOptions
      }));

      pool.availableObjectsCount().should.be.equal(poolOptions.min);
      pool.getPoolSize().should.be.equal(poolOptions.min);
      pool.waitingClientsCount().should.be.equal(0);

      return pool.acquire()
        .then(client => {
          pool.availableObjectsCount().should.be.equal(poolOptions.min);
          pool.getPoolSize().should.be.equal(1);
          pool.waitingClientsCount().should.be.equal(0);
          return pool.release(client);
        })
        .then(() => pool.availableObjectsCount().should.be.equal(1))
        .then(() => pool.acquire())
        .then(() => {
          pool.availableObjectsCount().should.be.equal(0);
          pool.getPoolSize().should.be.equal(1);
          pool.waitingClientsCount().should.be.equal(0);
        })
        .then(() => {
          pool.acquire(); // this is hanging op so no return
          return;
        })
        .then(() => {
          pool.availableObjectsCount().should.be.equal(0);
          pool.getPoolSize().should.be.equal(1);
          pool.waitingClientsCount().should.be.equal(1);
        });
    });

    it("should invalid host fail acquire connection", () => {
      const redisOptions = Object.assign({}, options.redisOptions, {
        host: "UNAVAILABLE_HOST"
      });
      const pool = new RedisPool(Object.assign({}, options, {
        redisOptions: redisOptions
      }));

      return pool.acquire().should.be.rejectedWith(Error, { message: "CONN_FAILED" });
    });

    it("should conn timeout fail acquire connection", () => {
      const poolOptions = {
        acquireTimeoutMillis: 1
      };
      const pool = new RedisPool(Object.assign({}, options, {
        poolOptions: poolOptions
      }));

      return pool.acquire().should.be.rejectedWith(Error, { name: "TimeoutError" });
    });
  });

  describe("release", () => {

    const poolOptions = {
      min: 2,
      max: 4
    };
    const pool = new RedisPool(Object.assign({}, options, {
      poolOptions: poolOptions
    }));

    it("should release connection with valid host", () => {

      pool.availableObjectsCount().should.be.equal(poolOptions.min);
      pool.getPoolSize().should.be.equal(poolOptions.min);
      pool.waitingClientsCount().should.be.equal(0);

      return pool.acquire()
        .then(client => {
          pool.availableObjectsCount().should.be.equal(poolOptions.min - 1);
          return pool.release(client);
        })
        .then(() => pool.availableObjectsCount().should.be.equal(poolOptions.min));
    });
  });

  describe("destroy", () => {

    const poolOptions = {
      min: 2,
      max: 4
    };
    const pool = new RedisPool(Object.assign({}, options, {
      poolOptions: poolOptions
    }));

    it("should destroy connection with valid host", () => {

      pool.availableObjectsCount().should.be.equal(poolOptions.min);
      pool.getPoolSize().should.be.equal(poolOptions.min);
      pool.waitingClientsCount().should.be.equal(0);

      return pool.acquire()
        .then(client => {
          pool.availableObjectsCount().should.be.equal(poolOptions.min - 1);
          return pool.destroy(client);
        })
        .then(() => Bluebird.delay(100))
        .then(() => pool.availableObjectsCount().should.be.equal(poolOptions.min));
    });
  });

  describe("drain", () => {

    const poolOptions = {
      min: 2,
      max: 4
    };
    const pool = new RedisPool(Object.assign({}, options, {
      poolOptions: poolOptions
    }));

    it("should drain all the coonections", () => {

      pool.availableObjectsCount().should.be.equal(poolOptions.min);
      pool.getPoolSize().should.be.equal(poolOptions.min);
      pool.waitingClientsCount().should.be.equal(0);

      return pool.drain()
        .then(() => {
          pool.availableObjectsCount().should.be.equal(poolOptions.min);
          pool.getPoolSize().should.be.equal(poolOptions.min);
        });
      });
  });

  describe("getName", () => {

    it("should set given name", () => {

      const name = "testPool";
      const pool = new RedisPool(Object.assign({}, options, {
        name: name
      }));

      pool.getName().should.be.equal(name);
    });

    it("should set random name if not set", () => {

      const pool = new RedisPool(options);

      pool.getName().should.not.be.empty();
    });
  });

  describe("getRedisOptions", () => {

    it("should set given redis options", () => {

      const pool = new RedisPool(options);

      pool.getRedisOptions().should.be.equal(options.redisOptions);
    });
  });

  describe("getPoolOptions", () => {

    it("should set given pool options", () => {

      const poolOptions = {
        min: 2,
        max: 4
      };
      const pool = new RedisPool(Object.assign({}, options, {
        poolOptions: poolOptions
      }));

      pool.getPoolOptions().should.be.equal(poolOptions);
    });
  });

  describe("status", () => {

    it("should get pool stats", () => {

      const name = "testPool";
      const poolOptions = {
        min: 2,
        max: 4
      };
      const pool = new RedisPool(Object.assign({}, options, {
        name: name,
        poolOptions: poolOptions
      }));

      const status = pool.status();
      status.name.should.be.equal(name);
      status.size.should.be.equal(poolOptions.min);
      // status.avail.should.be.equal(poolOptions.min); // todo debug
      status.waiting.should.be.equal(0);
    });
  });
});
