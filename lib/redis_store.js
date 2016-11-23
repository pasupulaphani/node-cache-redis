const RedisPool = require("./redis_pool");

const debug = require("debug")("simpleRedisStore");

const RedisStore = module.exports = function (name, redisOptions, poolOptions) {

  // set default pool options
  poolOptions = Object.assign({
    acquireTimeoutMillis: 50,
    autostart: true
  }, poolOptions || {});

  this.name = name;
  this.redisOptions = redisOptions;
  this.poolOptions = poolOptions;
  this.pool = new RedisPool(name, redisOptions, poolOptions);

  // verify if the connection is successful or not
  this.executeCmd(conn => conn.pingAsync())
    .then(resp => {
      if (resp === "PONG") {
        debug("Redis store created.", this.pool.status());
      }
    })
    .catch(e => console.log("##############################", e))
};


RedisStore.prototype.getName = function () {
  return this.pool.getName();
};

RedisStore.prototype.getRedisOptions = function () {
  return this.pool.getRedisOptions();
};

RedisStore.prototype.getPoolOptions = function () {
  return this.pool.getPoolOptions();
};

RedisStore.prototype.executeCmd = function (cmd) {
  return this.pool.acquire()
    .then(conn => cmd(conn)
        .then(result => {
          this.pool.release(conn);
          return result;
        })
        .catch(err => {
          this.pool.release(conn);
          throw err;
        }));
};

RedisStore.prototype.get = function (key) {
  return this.executeCmd(conn => conn.getAsync(key));
};

RedisStore.prototype.set = function (key, value, ttlInSeconds) {

  if (ttlInSeconds) {
    return this.executeCmd(conn => conn.setexAsync(key, ttlInSeconds, value));
  } else {
    return this.executeCmd(conn => conn.setAsync(key, value));
  }
};

RedisStore.prototype.del = function (keys) {
  return this.executeCmd(conn => conn.delAsync(keys));
};

RedisStore.prototype.expire = function (key, ttlInSeconds) {
  return this.executeCmd(conn => conn.expireAsync(key, ttlInSeconds));
};

RedisStore.prototype.ttlInSeconds = function (key) {
  return this.executeCmd(conn => conn.ttlAsync(key));
};

RedisStore.prototype.keys = function (pattern) {
  if (!pattern || pattern === "") {
    pattern = "*";
  }

  return this.executeCmd(conn => conn.keysAsync(pattern));
};

RedisStore.prototype.deleteAll = function (pattern) {
  if (!pattern || pattern === "") {
    pattern = "*";
  }
  debug("clearing redis keys: ", pattern);

  return this.keys(pattern)
    .then(keys => {

      if (keys.length > 0) {
        debug("deleting keys ", keys);
        return this.del(keys);
      } else {
        debug("no keys exists with pattern: ", pattern);
        return Promise.resolve(true);
      }
    });
};
