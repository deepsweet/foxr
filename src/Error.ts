export class ConnectionError extends Error {
  constructor (message: string) {
    super(message)
    Error.captureStackTrace(this, ConnectionError)

    this.name = 'SocketError'
  }
}

export class MarionetteError extends Error {
  constructor (message: string) {
    super(message)
    Error.captureStackTrace(this, MarionetteError)

    this.name = 'MarionetteError'
  }
}
