require("should");
const RedisPool = require("../lib/redis_pool");

describe("redisPool", () => {

  const redisOptions = Object.assign({
    host: process.env.REDIS_HOST || "127.0.0.1"
  });
  const pool = new RedisPool("testPool", redisOptions);

  describe("acquire", () => {

    it("should acquire connection", () => {

      return pool.acquire()
        .should.be.ok();
    });
  });
});
