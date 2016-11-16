const should = require("should");
const RedisCache = require("../lib/redis_cache");

describe("cache", function () {

  const redisOptions = Object.assign({
    host: process.env.REDIS_HOST || "127.0.0.1"
  });
  const cache = new RedisCache("testStore", redisOptions);

  describe("set", function () {

    const key = "captain-america";
    const value = "daddyIssues";

    beforeEach(function (done) {
      cache.deleteAll()
        .then(function (v) {
          v.should.be.ok();
          done();
        });
    });

    it("should set value without expiry if ttl is not provided", function (done) {

      cache.set(key, value)
        .then(function (test) {
          test.should.be.ok();
        })
        .then(function () {
          return cache.get(key);
        })
        .then(function (v) {
          v.should.be.equal(value);
          done();
        });
    });

    it("should set value with expiry if ttl is provided", function (done) {

      cache.set("key", "value", 1)
        .then(function (test) {
          test.should.be.ok();
          done();
        });
    });
  });

  describe("get", function () {

    const key = "chuck-norris";
    const value = "superman";

    before(function (done) {
      cache.set(key, value)
        .then(function () {
          done();
        });
    });

    it("should get the existing key", function (done) {

      cache.get(key)
        .then(function (v) {
          v.should.be.equal(value);
          done();
        });
    });

    it("should not get the non-existing key", function (done) {

      cache.get("nonExistingKey")
        .then(function (v) {
          should(v).not.be.ok();
          done();
        });
    });
  });

  describe("wrap", function () {

    const key = "chuck-norris";
    const value = "superman";

    it("should set if key not exists", function (done) {

      cache.wrap(key, value)
        .then(function (v) {
          v.should.be.equal(value);
        })
        .then(function () {
          return cache.get(key);
        })
        .then(function (v) {
          v.should.be.equal(value);
          done();
        });
    });

    it("should get if key exists", function (done) {

      cache.set(key, value)
        .then(function (v) {
          v.should.be.ok();
        })
        .then(function () {
          return cache.wrap(key);
        })
        .then(function (v) {
          v.should.be.equal(value);
          done();
        });
    });
  });


    describe("keys", function () {

      const keyValues = {key1: "value1", key2: "value2"};

      before(function (done) {
        cache.deleteAll()
          .then(() => done());
      });

      beforeEach(function (done) {
        Promise.all(Object.keys(keyValues)
          .map(key => cache.set(key, keyValues[key]))
        ).then(() => done());
      });

      it("should return all the keys", function (done) {

        cache.keys()
          .then(keys => {
            keyValues.should.have.keys(keys[0], keys[1]);
            done();
          });
      });

      it("should return all the keys matches pattern", function (done) {

        cache.keys("key[2]")
          .then(keys => {
            keys.should.containEql("key2");
            done();
          });
      });
    });

    describe("deleteAll", function () {

      beforeEach(function (done) {
        const keyValues = {key1: "value1", key2: "value2"};

        Promise.all(Object.keys(keyValues)
          .map(key => cache.set(key, keyValues[key]))
        ).then(() => done());
      });

      it("should delete all the keys", function (done) {

        cache.deleteAll()
          .then(function (v) {
            v.should.be.ok();
          })
          .then(cache.keys)
          .then(function (keys) {
            keys.should.be.empty();
            done();
          });
      });
    });
});
