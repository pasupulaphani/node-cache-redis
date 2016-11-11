"use strict";

const genericPool = require("generic-pool");
const redis = require("./redis");
const logger = require("./logger");

const debug = require("debug")("simpleRedisPool");

function RedisPool (name, redisOptions, poolOptions) {

  this.name = name;
  this._redisDb = redisOptions.db || 0;
  let _pool = null;

  const factory = {
    create: () => {
      return new Promise((resolve, reject) => {

        const client = redis.createClient(redisOptions);

        if (["undefined", null, ""].indexOf(this._redisDb) !== -1) {
          logger.info("Selected Redis DB: ", this._redisDb);
          debug("Selected Redis DB: ", this._redisDb);
          client.select(this._redisDb);
        }

        // Handle client connection errors.
        client.on("error", err => {
          logger.error("Redis pool: ", name, err);
          reject(err);
        });

        // Register the authentication password if needed.
        if (redisOptions.auth_pass) {
          client.auth(redisOptions.auth_pass);
        }

        resolve(client);
      });
    },
    destroy: (client) => {
      return new Promise((resolve) => {

        try {
          // Flush when closing.
          client.end(true);
          logger.info("Checking pool info after client destroyed. Available count : %s. Pool size: %s", _pool.availableObjectsCount(), _pool.getPoolSize());
          resolve();
        } catch (err) {
          throw new Error("error", "Error destroying redis client.");
        }
      });
    }
  };

  // Now that the pool settings are ready create a pool instance.
  _pool = genericPool.createPool(factory, poolOptions);

  // Acquire a database connection and use an optional priority.
  this.acquire = (priority) => {
    return _pool.acquire(priority);
  };

  this.acquireDb = (db, priority) => {
    return _pool.acquire(priority)
      .then(client => {
        if (client._db_selected !== db) {
          client["_db_selected"] = db;
          client.select(db);
        }
        debug("DB selected: ", client._db_selected);
      });
  };

  // Release a database connection to the pool.
  this.release = (client) => {
    // Always reset the DB to the default. This prevents issues
    // if a user used the select command to change the DB.

    if (client._db_selected !== this._redisDb) {
      debug("Releasing client. Reset the DB to the given: ", this._redisDb);
      client.select(this._redisDb);
    }
    _pool.release(client);
  };

  // Drains the connection pool and call the callback id provided.
  this.drain = (cb) => {
    _pool.drain(() => {
      _pool.destroyAllNow();
      if (cb) {
        cb();
      }
    });
  };

  // Returns factory.name for this pool
  this.getName = () => {
    return this.name;
  };

  this.getDB = () => {
    return this._redisDb;
  };

  this.getPoolSize = () => {
    return _pool.size;
  };

  this.availableObjectsCount = () => {
    return _pool.available;
  };

  this.waitingClientsCount = () => {
    return _pool.pending;
  };

  this.status = () => {
    return {
      name: this.name,
      size: _pool.size,
      db: this._redisDb,
      avail: _pool.available,
      waiting: _pool.pending
    };
  };
}

module.exports = RedisPool;
