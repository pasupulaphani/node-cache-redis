export default class InvalidTtlError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidTtlError'
  }
}
