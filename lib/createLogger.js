const noop = () => {}

module.exports = (logger = {}) => ({
  debug: noop,
  log: noop,
  info: noop,
  warn: noop,
  error: noop,
  ...logger
})
