require("should");
var RedisCache = require("../lib/redis_cache");

describe("cache", function () {

  var cache = new RedisCache("testStore");

  describe("set", function () {
    it("set", function (done) {

      cache.set("key", "value")
        .then(function (test) {
          test.should.be.ok();
          done();
        });
    });
  });

  describe("get", function () {

    var key = "chuck-norris";
    var value = "superman";

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
