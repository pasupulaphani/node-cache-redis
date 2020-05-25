class InvalidTtlError extends Error {
  constructor(message: string) {
    super(message)
    Object.setPrototypeOf(this, InvalidTtlError.prototype)
    this.name = 'InvalidTtlError'
  }
}

export default InvalidTtlError
