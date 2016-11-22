require("should");
const RedisPool = require("../lib/redis_pool");

describe("redisPool", () => {

  const redisOptions = {
    host: process.env.REDIS_HOST || "127.0.0.1"
  };

  describe("constructor", () => {

    it("should set db when sent as constructor option", () => {

      redisOptions.db = 1;

      const pool = new RedisPool("testPool", redisOptions);

      return pool.acquire(0)
        .then(c => c.selected_db)
        .should.eventually.be.equal(redisOptions.db);
    });
  });

  describe("acquire", () => {

    it("should acquire connection with valid host", () => {

      const pool = new RedisPool("testPool", redisOptions);

      return pool.acquire()
        .should.eventually.be.ok();
    });

    it("should acquire connection to db when set", () => {

      const pool = new RedisPool("testPool", redisOptions);
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
      const pool = new RedisPool("testPool", redisOptions);

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

    it("should not acquire connection with invalid host", () => {
      redisOptions.host = "UNAVAILABLE_HOST";

      const pool = new RedisPool("testCache", redisOptions);

      // this is due to the limitation of node-pool ATM
      return pool.acquire().should.eventually.be.instanceOf(Error);
    });
  });

  describe("release", () => {

    const poolOptions = {
      min: 2,
      max: 4
    };
    const pool = new RedisPool("testPool", redisOptions, poolOptions);

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

  describe("drain", () => {

    const poolOptions = {
      min: 2,
      max: 4
    };
    const pool = new RedisPool("testPool", redisOptions, poolOptions);

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
      const pool = new RedisPool(name, redisOptions);

      pool.getName().should.be.equal(name);
    });
  });

  describe("getRedisOptions", () => {

    it("should set given redis options", () => {

      const name = "testPool";
      const pool = new RedisPool(name, redisOptions);

      pool.getRedisOptions().should.be.equal(redisOptions);
    });
  });

  describe("getPoolOptions", () => {

    it("should set given pool options", () => {

      const name = "testPool";
      const poolOptions = {
        min: 2,
        max: 4
      };
      const pool = new RedisPool(name, redisOptions, poolOptions);

      pool.getPoolOptions().should.be.equal(poolOptions);
    });
  });

  describe("status", () => {

    it("should set given pool options", () => {

      const name = "testPool";
      const poolOptions = {
        min: 2,
        max: 4
      };
      const pool = new RedisPool(name, redisOptions, poolOptions);

      const status = pool.status();
      status.name.should.be.equal(name);
      status.size.should.be.equal(poolOptions.min);
      // status.avail.should.be.equal(poolOptions.min); // todo debug
      status.waiting.should.be.equal(0);
    });
  });
});
