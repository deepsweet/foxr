export default class FoxrError extends Error {
  constructor (message: string) {
    super(message)
    Error.captureStackTrace(this, FoxrError)

    this.name = 'FoxrError'
  }
}
