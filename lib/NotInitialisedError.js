module.exports = class NotInitialisedError extends Error {
  constructor(message) {
    super(message);
    this.name = "NotInitialisedError";
  }
}
