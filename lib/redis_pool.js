"use strict";

const genericPool = require("generic-pool");
const redis = require("./redis");

const debug = require("debug")("simpleRedisPool");

var RedisPool = module.exports = function (name, redisOptions, poolOptions) {

  this.name = name;
  this.redisOptions = redisOptions;
  this.poolOptions = poolOptions;
  this._redisDb = redisOptions.db || 0;

  const factory = {
    create: () => {
      return new Promise((resolve, reject) => {

        const client = redis.createClient(redisOptions);

        if (["undefined", null, ""].indexOf(this._redisDb) !== -1) {
          debug("Selected Redis DB: ", this._redisDb);
          client.select(this._redisDb);
        }

        // Register the authentication password if needed.
        if (redisOptions.auth_pass) {
          client.auth(redisOptions.auth_pass);
        }

        client.on("error", err => reject(err));
        client.on("connect", () => resolve(client));
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

  this.pool.on("factoryCreateError", e => {
    debug("Errored connecting Redis", e);
  });

  this.pool.on("factoryDestroyError", e => {
    debug("Errored destroying Redis conn", e);
  });

  // test connectivity by acquiring a conn
  // this.pool.acquire()
  //   .then(client => this.pool.release(client));

};

// Acquire a database connection and use an optional priority.
RedisPool.prototype.acquire = function (priority) {
  return this.pool.acquire(priority);
};

RedisPool.prototype.acquireDb = function (db, priority) {
  return this.pool.acquire(priority)
    .then(client => {
      if (client._db_selected !== db) {
        client["_db_selected"] = db;
        client.select(db);
      }
      debug("DB selected: ", client._db_selected);
    });
};

// Release a database connection to the pool.
RedisPool.prototype.release = function (client) {

  // Always reset the DB to the default. This prevents issues
  // if a user used the select command to change the DB.
  if (client._db_selected !== this._redisDb) {
    debug("Releasing client. Reset the DB to the given: ", this._redisDb);
    client.select(this._redisDb);
  }
  this.pool.release(client);
};

// Drains the connection pool and call the callback id provided.
RedisPool.prototype.drain = (cb) => {
  this.pool.drain(() => {
    this.pool.destroyAllNow();
    if (cb) {
      cb();
    }
  });
};

// Returns factory.name for this pool
RedisPool.prototype.getName = function () {
  return this.name;
};

RedisPool.prototype.getRedisDB = function () {
  return this._redisDb;
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
    db: this._redisDb,
    avail: this.pool.available,
    waiting: this.pool.pending
  };
};
