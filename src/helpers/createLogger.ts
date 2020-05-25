// tslint:disable-next-line:no-empty
const noop = () => {}

/**
 * @alias Logger
 */
export interface Logger {
  debug?: Function
  log?: Function
  info?: Function
  warn?: Function
  error?: Function
}

export default (
  logger: Logger = {}
): {
  debug: Function
  log: Function
  info: Function
  warn: Function
  error: Function
} => ({
  debug: noop,
  log: noop,
  info: noop,
  warn: noop,
  error: noop,
  ...logger
})
