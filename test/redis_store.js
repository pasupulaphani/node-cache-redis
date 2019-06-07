require("should");
const Bluebird = require("bluebird");
const RedisStore = require("../lib/redis_store");

describe("redisStore", () => {

  const name = "testStore";
  const redisOptions = {
    host: process.env.REDIS_HOST || "127.0.0.1",
    auth_pass: process.env.REDIS_AUTH  || "admin"
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

  describe("getName", () => {

    it("should set given name", () => {

      const store = new RedisStore({
        name: name
      });
      store.getName().should.be.equal(name);
    });

    it("should set random name if not set", () => {

      const store = new RedisStore();

      store.getName().should.not.be.empty();
    });
  });

  describe("getRedisOptions", () => {

    it("should set given redis options", () => {

      const store = new RedisStore({
        redisOptions: redisOptions
      });

      store.getRedisOptions().should.be.equal(redisOptions);
    });
  });

  describe("getPoolOptions", () => {

    it("should set given pool options", () => {

      const poolOptions = {
        min: 2,
        max: 4
      };
      const store = new RedisStore({
        name: name,
        redisOptions: redisOptions,
        poolOptions: poolOptions
      });

      store.getPoolOptions().should.be.equal(poolOptions);
    });
  });

  describe("status", () => {

    it("should get store stats", () => {

      const name = "testStore";
      const poolOptions = {
        min: 2,
        max: 4
      };
      const store = new RedisStore({
        name: name,
        redisOptions: redisOptions,
        poolOptions: poolOptions
      });

      const status = store.status();
      status.name.should.be.equal(name);
      status.size.should.be.equal(poolOptions.min);
      status.available.should.be.equal(0);
      status.pending.should.be.equal(0);
    });
  });

  describe("ping", () => {

    const store = new RedisStore({
      redisOptions: redisOptions
    });

    it("should return 'PONG' if no arg is supplied", () => {

      return store.ping()
        .should.eventually.be.equal("PONG");
    });

    it("should return 'string supplied'", () => {

      const str = "Yello";
      return store.ping(str)
        .should.eventually.be.equal(str);
    });
  });


  describe("get", () => {

    const store = new RedisStore({
      name: name,
      redisOptions: redisOptions
    });

    it("should retrieve an existing key", () => {

      const key = "chuck-norris";
      const value = "superman";

      return store.set(key, value)
        .then(test => {
          test.should.be.ok();
        })
        .then(() => store.get(key))
        .should.eventually.be.equal(value);
    });

    it("should retrieve parsed json", () => {

      const key = "chuck-norris";
      const value = {
        type: "superman"
      };

      return store.set(key, value)
        .then(test => {
          test.should.be.ok();
        })
        .then(() => store.get(key))
        .should.eventually.be.eql(value);
    });

    it("should return null if key doesn't exist", () => {

      return store.get("unknownKey")
        .should.eventually.be.null;
    });
  });

  describe("set", () => {

    const store = new RedisStore({
      name: name,
      redisOptions: redisOptions
    });

    it("should store a value", () => {

      const key = "key";
      const value = "neverExpire";

      return store.set(key, value)
        .then(test => {
          test.should.be.ok();
        })
        .then(() => store.get(key))
        .should.eventually.be.equal(value);
    });

    it("should store json", () => {

      const key = "key";
      const value = {
        type: "json"
      };

      return store.set(key, value)
        .then(test => {
          test.should.be.ok();
        })
        .then(() => store.get(key))
        .should.eventually.be.eql(value);
    });

    it("should store array", () => {

      const key = "key";
      const value = ["json", "node"];

      return store.set(key, value)
        .then(test => {
          test.should.be.ok();
        })
        .then(() => store.get(key))
        .should.eventually.be.eql(value);
    });

    it("should store with an expiry if ttl set", () => {

      const key = "shortLivedKey";
      const value = "expireIn1s";
      const ttlInSeconds = 1;

      store.set(key, value, ttlInSeconds)
        .then(test => {
          test.should.be.ok();
        })
        .then(() => store.get(key))
        .should.eventually.be.equal(value);

      return Bluebird.delay(ttlInSeconds * 1000)
        .done(() => store.get(key)
            .should.eventually.be.null
        );
    });
  });

  describe("del", () => {

    const store = new RedisStore({
      name: name,
      redisOptions: redisOptions
    });

    it("should delete an existing key", () => {

      const key = "key";
      const value = "neverExpire";

      return store.set(key, value)
        .then(test => {
          test.should.be.ok();
        })
        .then(() => store.del(key))
        .then(v => {
          v.should.be.exactly(1);
        })
        .then(() => store.get(key))
        .should.eventually.be.null;
    });

    it("should return null deleting non-existing key", () => {
      return store.del("unknownKey")
          .then(v => {
            v.should.be.exactly(0);
          });
    });
  });

  describe("expire", () => {

    const store = new RedisStore({
      name: name,
      redisOptions: redisOptions
    });

    it("should set a key with expire in seconds", () => {

      const key = "key";
      const value = "make it expire";
      const ttlInSeconds = 1;

      store.set(key, value)
        .then(test => {
          test.should.be.ok();
        })
        .then(() => store.expire(key, ttlInSeconds))
        .should.eventually.be.ok();

      return Bluebird.delay(ttlInSeconds * 1000)
        .done(() => store.get(key)
            .should.eventually.be.null);
    });

    it("should return null expiring non-existing key", () => {
      return store.expire("unknownKey", 10)
        .should.eventually.be.null;
    });
  });

  describe("ttl", () => {

    const store = new RedisStore({
      name: name,
      redisOptions: redisOptions
    });

    before(() => store.deleteAll());

    it("should return ttl left for a key in seconds", () => {

      const key = "key";
      const value = "make it expire";
      const ttlInSeconds = 10;

      return store.set(key, value, ttlInSeconds)
        .then(test => {
          test.should.be.ok();
        })
        .then(() => store.getTtl(key))
        // it should be same as the time elapsed is very vvery small
        .should.eventually.be.equal(ttlInSeconds);
    });

    it("should return null on ttl for a non-existing key", () => {
      return store.getTtl("unknownKey")
        .should.eventually.be.null;
    });
  });

  describe("keys", () => {

    const store = new RedisStore({
      name: name,
      redisOptions: redisOptions
    });

    const keyValues = {key1: "value1", key2: "value2"};

    before(() => store.deleteAll());

    beforeEach(() => Promise.all(Object.keys(keyValues)
        .map(key => store.set(key, keyValues[key]))));

    it("should return all the keys", () => {

      return store.keys()
        .then(keys => keys.map(k => Object.keys(keyValues).should.containEql(k)));
    });

    it("should return all the keys matches pattern", () => {

      return store.keys("key[2]")
        .should.eventually.containEql("key2");
    });
  });

  describe("deleteAll", () => {

    const store = new RedisStore({
      name: name,
      redisOptions: redisOptions
    });

    const keyValues = {key1: "value1", key2: "value2"};

    beforeEach(() => Promise.all(Object.keys(keyValues)
        .map(key => store.set(key, keyValues[key]))));

    it("should delete all the keys", () => {

      return store.deleteAll()
        .then(v => v.should.be.eql(2))
        .then(() => store.keys())
        .should.eventually.be.empty();
    });

    it("should delete all the keys matches pattern", () => {

      return store.deleteAll("key[2]")
        .then(v => {
          v.should.be.eql(1);
        })
        .then(() => store.keys())
        .should.eventually.be.not.empty()
        .and.not.containEql("key2");
    });

    it("should not delete when nothing matches", () => {

      return store.deleteAll()
        .then(v => {
          v.should.be.eql(2);
        })
        .then(() => store.deleteAll("nonExistingKey"))
        .should.eventually.be.eql(0);
    });

    it("should delete if function is deleted from cache", () => {

      return store.deleteAll()
        .then(v => {
          v.should.be.eql(2);
        })
        .then(() => store.sendCommand("script",["flush"]))
        .then(() => store.deleteAll())
        .should.eventually.be.eql(0);
    });
  });
});
