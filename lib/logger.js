module.exports = function (logger) {
  if (!logger) {
    logger = {};
  }

  return Object.assign({
    debug: function () {},
    log: function () {},
    info: function () {},
    warn: function () {},
    error: function () {}
  }, logger);
};
