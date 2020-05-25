export default class NotInitialisedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NotInitialisedError'
  }
}
