class NotInitialisedError extends Error {
  constructor(message: string) {
    super(message)
    Object.setPrototypeOf(this, NotInitialisedError.prototype)
    this.name = 'NotInitialisedError'
  }
}

export default NotInitialisedError
