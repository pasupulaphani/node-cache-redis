require("should");
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
        });
      cache.get(key)
        .then(function (v) {
          v.should.be.equal(value);
          done();
        });
    });

    it("should set value with expiry if ttl is provided", function (done) {

      cache.set("key", "value")
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

    it("get", function (done) {

      cache.get(key)
        .then(function (v) {
          v.should.be.equal(value);
          done();
        });
    });
  });
});
