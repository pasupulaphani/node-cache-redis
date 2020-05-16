module.exports = function (logger) {
  if (!logger) {
    logger = {};
  }

  return {debug: function () {
    },
    log: function () {
    },
    info: function () {
    },
    warn: function () {
    },
    error: function () {
    }, ...logger};
};
