require("should");
const RedisPool = require("../lib/redis_pool");

describe("redisPool", () => {

  describe("acquire", () => {

    it("should acquire connection with valid host", () => {
      const redisOptions = Object.assign({
        host: process.env.REDIS_HOST || "127.0.0.1"
      });
      const pool = new RedisPool("testPool", redisOptions);

      return pool.acquire()
        .should.be.ok();
    });

    it("should not acquire connection with invalid host", () => {
      const redisOptions = Object.assign({
        host: "UNAVAILABLE_HOST"
      });

      const pool = new RedisPool("testCache", redisOptions);

      // this is due to the limitation of node-pool ATM
      return pool.acquire().should.eventually.be.instanceOf(Error);
    });
  });
});
