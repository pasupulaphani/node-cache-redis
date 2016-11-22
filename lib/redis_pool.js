"use strict";

const genericPool = require("generic-pool");
const retry = require("retry-as-promised");
const redis = require("./redis");

const debug = require("debug")("simpleRedisPool");

let createAttempts = 0;
const create = function (redisOptions) {

  // this is due to the limitation of node-pool ATM
  // https://github.com/coopernurse/node-pool/issues/161#issuecomment-261109882
  createAttempts++;
  if (createAttempts > 3) {
    createAttempts = 0;
    return Promise.resolve(new Error("Conn failed"));
  }

  return new Promise((resolve, reject) => {

    const client = redis.createClient(redisOptions);

    client.on("error", err => reject(err));
    client.on("connect", () => resolve(client));
  });
};

const selectDB = function (client, db) {
  return new Promise((resolve, reject) => {
    client.select(db, function (err) {
      if (err) reject(err);
      debug("DB selected: ", db);
      resolve(client);
    });
  });
};

const RedisPool = module.exports = function (name, redisOptions, poolOptions) {

  this.name = name;
  this.redisOptions = redisOptions;
  this.poolOptions = poolOptions;

  const factory = {
    create: () => {
      return retry(function () {
        return create(redisOptions);
      }, {
        max: 10,
        name: "factory.create",
        report: function (msg) {
          console.log(msg);
        }
      });
    },
    destroy: (client) => {
      return new Promise((resolve) => {

        try {
          // Flush when closing.
          client.end(true);
          debug("Client conn closed. Available count : %s. Pool size: %s", this.pool.availableObjectsCount(), this.pool.getPoolSize());
          resolve();
        } catch (err) {
          throw new Error("error", "Error destroying redis client.");
        }
      });
    }
  };

  // Now that the pool settings are ready create a pool instance.
  this.pool = genericPool.createPool(factory, poolOptions);

  this.pool.on("factoryCreateError", e => debug("Errored connecting Redis", e));
  this.pool.on("factoryDestroyError", e => debug("Errored destroying Redis conn", e));
};

// Acquire a database connection and use an optional priority.
RedisPool.prototype.acquire = function (priority, db) {
  return this.pool.acquire(priority)
    .then(client => {
      if (db) {
        return selectDB(client, db);
      } else {
        return client;
      }
    });
};

// Release a database connection to the pool.
RedisPool.prototype.release = function (client) {
  return this.pool.release(client);
};

// Drains the connection pool and call the callback id provided.
RedisPool.prototype.drain = function () {
  return this.pool.drain(() => {
    this.pool.clear();
  });
};

// Returns factory.name for this pool
RedisPool.prototype.getName = function () {
  return this.name;
};

RedisPool.prototype.getRedisOptions = function () {
  return this.redisOptions;
};

RedisPool.prototype.getPoolOptions = function () {
  return this.poolOptions;
};

RedisPool.prototype.getPoolSize = function () {
  return this.pool.size;
};

RedisPool.prototype.availableObjectsCount = function () {
  return this.pool.available;
};

RedisPool.prototype.waitingClientsCount = function () {
  return this.pool.pending;
};

RedisPool.prototype.status = function () {
  return {
    name: this.name,
    size: this.pool.size,
    avail: this.pool.available,
    waiting: this.pool.pending
  };
};
