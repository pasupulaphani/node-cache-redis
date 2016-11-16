const should = require("should");
const Bluebird = require("bluebird");
const RedisStore = require("../lib/redis_store");

describe("redisStore", function () {

  const redisOptions = Object.assign({
    host: process.env.REDIS_HOST || "127.0.0.1"
  });
  const store = new RedisStore("testStore", redisOptions);

  describe("get", function () {
    it("should retrieve an existing key", function (done) {

      const key = "chuck-norris";
      const value = "superman";

      store.set(key, value)
        .then(function (test) {
          test.should.be.ok();
        });

      store.get(key)
        .then(function (v) {
          v.should.be.equal(value);
          done();
        });
    });

    it("should return null if key doesn't exist", function (done) {

      store.get("unknownKey")
        .then(function (v) {
          should(v).be.null;
          done();
        });
    });
  });

  describe("set", function () {
    it("should store a value", function (done) {

      const key = "key";
      const value = "neverExpire";

      store.set(key, value)
        .then(function (test) {
          test.should.be.ok();
        });

      store.get(key)
        .then(function (v) {
          v.should.be.equal(value);
          done();
        });
    });
  });

  describe("setex", function () {
    it("should store with an expiry", function (done) {

      const key = "shortLivedKey";
      const value = "expireIn10ms";
      const ttlInSeconds = 1;

      store.setex(key, value, ttlInSeconds)
        .then(function (test) {
          test.should.be.ok();
        });

      store.get(key)
        .then(function (v) {
          v.should.be.equal(value);
        });

      Bluebird.delay(ttlInSeconds * 1000)
        .done(() => {
          return store.get(key)
            .then(function (v) {
              should(v).be.null;
              done();
            });
        });
    });
  });

  describe("del", function () {
    it("should delete an existing key", function (done) {

      const key = "key";
      const value = "neverExpire";

      store.set(key, value)
        .then(function (test) {
          test.should.be.ok();
        });

      store.del(key)
        .then(function (v) {
          v.should.be.ok();
        });

      store.get(key)
        .then(function (v) {
          should(v).be.null;
          done();
        });
    });

    it("should return null deleting non-existing key", function (done) {
      store.del("unknownKey")
        .then(function (v) {
          should(v).be.null;
          done();
        });
    });
  });

  describe("expire", function () {
    it("should set a key with expire in seconds", function (done) {

      const key = "key";
      const value = "make it expire";
      const ttlInSeconds = 1;

      store.set(key, value)
        .then(function (test) {
          test.should.be.ok();
        });

      store.expire(key, ttlInSeconds)
        .then(function (v) {
          v.should.be.ok();
        });

      Bluebird.delay(ttlInSeconds * 1000)
        .done(() => {
          return store.get(key)
            .then(function (v) {
              should(v).be.null;
              done();
            });
        });
    });

    it("should return null expiring non-existing key", function (done) {
      store.expire("unknownKey", 10)
        .then(function (v) {
          should(v).be.null;
          done();
        });
    });
  });

  describe("ttl", function () {
    it("should return ttl left for a key in seconds", function (done) {

      const key = "key";
      const value = "make it expire";
      const ttlInSeconds = 10;

      store.setex(key, value, ttlInSeconds)
        .then(function (test) {
          test.should.be.ok();
        });

      store.ttlInSeconds(key)
        .then(function (v) {

          // it should be same as the time elapsed is very vvery small
          v.should.be.equal(ttlInSeconds);
          done();
        });

    });

    it("should return null on ttl for a non-existing key", function (done) {
      store.ttlInSeconds("unknownKey")
        .then(function (v) {
          should(v).be.null;
          done();
        });
    });
  });

  describe("keys", function () {

    beforeEach(function (done) {
      store.deleteAll()
        .then(() => done());
    });

    it("should return all the keys", function (done) {

      const keyValues = {key1: "value1", key2: "value2"};

      for (var key in keyValues) {
        store.set(key, keyValues[key]);
      }

      store.keys()
        .then(function (keys) {
          keyValues.should.have.keys(keys[0], keys[1]);
          done();
        });
    });

    it("should return all the keys matches pattern", function (done) {

      const keyValues = {key1: "value1", key2: "value2"};

      for (var key in keyValues) {
        store.set(key, keyValues[key]);
      }

      store.keys("key[2]")
        .then(function (keys) {
          keys.should.containEql("key2");
          done();
        });
    });
  });

  describe("deleteAll", function () {

    beforeEach(function () {
      const keyValues = {key1: "value1", key2: "value2"};

      for (var key in keyValues) {
        store.set(key, keyValues[key]);
      }
    });

    it("should delete all the keys", function (done) {

      store.deleteAll()
        .then(function (v) {
          v.should.be.ok();
        });

      store.keys()
        .then(function (keys) {
          keys.should.be.empty();
          done();
        });
    });

    it("should delete all the keys matches pattern", function (done) {

      store.deleteAll("key[2]")
        .then(function (v) {
          v.should.be.ok();
        });

      store.keys()
        .then(function (keys) {
          keys.should.be.not.empty();
          keys.should.not.containEql("key2");
          done();
        });
    });
  });
});
