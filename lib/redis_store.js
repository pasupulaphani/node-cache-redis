const RedisPool = require("./redis_pool");
const bind = require("./util/bind");
const logger = require("./logger");

const debug = require("debug")("simpleRedisStore");

function wrapFunc (pool, func) {
  return pool.acquire()
    .then((conn) => func(conn)
        .then((result) => {
          pool.release(conn);
          return result;
        })
        .catch(err => {
          pool.release(conn);
          throw err;
        }));
}

function RedisStore (name, redisOptions, poolOptions) {

  if (!poolOptions) {
    poolOptions = {};
  }
  poolOptions = Object.assign({
    acquireTimeoutMillis: 50
  }, poolOptions);

  const pool = new RedisPool(name, redisOptions, poolOptions);
  logger.info("Redis store created.", pool.status());

  this.getName = bind(pool.getName, pool);
  this.getRedisDB = bind(pool.getDB, pool);
  this.getPoolStatus = bind(pool.status, pool);

  this.get = (key) => wrapFunc(pool, (conn) => conn.getAsync(key));

  this.set = (key, value) => wrapFunc(pool, (conn) => conn.setAsync(key, value));

  this.setex = (key, value, ttlInSeconds) => wrapFunc(pool, (conn) => conn.setexAsync(key, ttlInSeconds, value));

  this.del = (key) => wrapFunc(pool, (conn) => conn.delAsync(key));

  this.expire = (key, ttlInSeconds) => wrapFunc(pool, (conn) => conn.expireAsync(key, ttlInSeconds));

  this.ttlInSeconds = (key) => wrapFunc(pool, (conn) => conn.ttlAsync(key));

  this.keys = (pattern) => {
    if (!pattern || pattern === "") {
      pattern = "*";
    }

    return wrapFunc(pool, (conn) => conn.keysAsync(pattern));
  };

  this.deleteAll = (pattern) => {
    if (!pattern || pattern === "") {
      pattern = "*";
    }
    logger.info("clearing redis keys: ", pattern);

    return pool.acquire()
      .then(conn => conn.keysAsync(pattern)
        .then(keys => {
          if (keys.length > 0) {
            debug("deleting keys ", keys);
            return conn.delAsync(keys)
              .then(result => {
                pool.release(conn);
                return result;
              });
          } else {
            debug("no keys exists with pattern: ", pattern);
            return Promise.resolve(true);
          }
        }));
  };
}

module.exports = RedisStore;
