const RedisStore = require("./redis_store");

const debug = require("debug")("simpleRedisCache");

const RedisCache = module.exports = function (name, redisOptions, poolOptions) {

  this.name = name;
  this.redisOptions = redisOptions;
  this.poolOptions = poolOptions;
  this.store = new RedisStore(name, redisOptions, poolOptions);
};

RedisCache.prototype.set = function (key, value, ttlInSeconds) {
  if (!this.store || ttlInSeconds === 0) return Promise.resolve(value);

  return this.store.set(key, value, ttlInSeconds);
};

RedisCache.prototype.get = function (key) {
  if (!this.store) return;

  return this.store.get(key);
};

RedisCache.prototype.keys = function () {
  if (!this.store) return;

  return this.store.keys();
};

RedisCache.prototype.deleteAll = function () {
  if (!this.store) return;

  return this.store.deleteAll();
};

RedisCache.prototype.wrap = function (key, promise, ttlInSeconds) {

  if (!this.store || ttlInSeconds === 0) {
    return Promise.resolve(promise);
  }

  return this.store.get(key)
    .then(value => {
      if (!value) {
        debug("MISS", {key: key});
        return Promise.resolve(promise)
          .then(value => this.set(key, value, ttlInSeconds).then(() => value));
      } else {
        debug("HIT", {key: key});
        return Promise.resolve(value);
      }
    });
};
