module.exports = function (logger) {
  if (!logger) {
    logger = {};
  }

  return Object.assign({
    log: function () {},
    info: function () {},
    warn: function () {},
    error: function () {}
  }, logger);
};
