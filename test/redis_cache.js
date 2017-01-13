require("should");
const RedisCache = require("../lib/redis_cache");

describe("redisCache", () => {

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


  describe("API", () => {

    const name = "testCache";
    const redisOptions = {
      host: process.env.REDIS_HOST || "127.0.0.1"
    };
    const cache = new RedisCache({
      name: name,
      redisOptions: redisOptions
    });

    describe("set", () => {

      const key = "captain-america";
      const value = "daddyIssues";

      beforeEach(() => cache.deleteAll());

      it("should set value without expiry if ttl is not provided", () => {

        return cache.set(key, value)
          .then(() => cache.get(key))
          .should.eventually.be.equal(value);
      });

      it("should set value with expiry if ttl is provided", () => {

        return cache.set("key", "value", 1)
          .should.eventually.be.ok();
      });
    });

    describe("get", () => {

      const key = "chuck-norris";
      const value = "superman";

      before(() => cache.set(key, value));

      it("should get the existing key", () => {

        return cache.get(key)
          .should.eventually.be.equal(value);
      });

      it("should not get the non-existing key", () => {

        return cache.get("nonExistingKey")
          .should.eventually.not.be.ok();
      });
    });

    describe("wrap", () => {

      const key = "chuck-norris";
      const value = "superman";

      before(() => cache.deleteAll());

      it("should set if key not exists", () => {

        return cache.wrap(key, value)
          .then(v => v.should.be.equal(value))
          .then(() => cache.get(key))
          .should.eventually.be.equal(value);
      });

      it("should get if key exists", () => {

        return cache.set(key, value)
          .then(v => v.should.be.ok())
          .then(() => cache.wrap(key))
          .should.eventually.be.equal(value);
      });

      it("should do nothing when ttlInSeconds=0", () => {

        return cache.wrap(key, value, 0)
          .should.eventually.be.equal(value);
      });
    });

    describe("keys", () => {

      const keyValues = {key1: "value1", key2: "value2"};

      before(() => cache.deleteAll());
      beforeEach(() => Promise.all(Object.keys(keyValues)
          .map(key => cache.set(key, keyValues[key]))));

      it("should return all the keys", () => {

        return cache.keys()
          .then(keys => keys.map(k => Object.keys(keyValues).should.containEql(k)));
      });

      it("should return all the keys matches pattern", () => {

        return cache.keys("key[2]")
          .should.eventually.containEql("key2");
      });
    });

    describe("deleteAll", () => {

      const keyValues = {key1: "value1", key2: "value2"};

      beforeEach(() => Promise.all(Object.keys(keyValues)
          .map(key => cache.set(key, keyValues[key]))));

      it("should delete all the keys", () => {

        return cache.deleteAll()
          .then(() => cache.keys())
          .should.eventually.be.empty();
      });
    });

    describe("getName", () => {

      it("should set given name", () => {
        cache.getName().should.be.equal(name);
      });

      it("should set random name if not set", () => {

        const cache = new RedisCache({
          redisOptions: redisOptions
        });

        cache.getName().should.not.be.empty();
      });
    });

    describe("getRedisOptions", () => {

      it("should set given redis options", () => {
        cache.getRedisOptions().should.be.equal(redisOptions);
      });
    });

    describe("getPoolOptions", () => {

      it("should set given pool options", () => {

        const poolOptions = {
          min: 2,
          max: 4
        };
        const cache = new RedisCache({
          name: name,
          redisOptions: redisOptions,
          poolOptions: poolOptions
        });

        cache.getPoolOptions().should.be.equal(poolOptions);
      });
    });

    describe("status", () => {

      it("should get store stats", () => {

        const name = "testStore";
        const poolOptions = {
          min: 2,
          max: 4
        };
        const cache = new RedisCache({
          name: name,
          redisOptions: redisOptions,
          poolOptions: poolOptions
        });

        const status = cache.status();
        status.name.should.be.equal(name);
        status.size.should.be.equal(poolOptions.min);
        status.available.should.be.equal(0);
        status.pending.should.be.equal(0);
      });
    });
  });
});
