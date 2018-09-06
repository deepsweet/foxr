import EventEmitter from 'events'
import { Socket } from 'net'
import { TJsonArray, TJsonMap, TJsonValue } from 'typeon'
import FoxrError from './Error'
import { createParseStream, parse, stringify } from './json-protocol'

const CONNECTION_TIMEOUT = 10000

export type TMarionetteError = {
  error: string,
  message: string,
  stacktrace: string
}

class Marionette extends EventEmitter {
  private globalId: number
  private queue: {
    id: number,
    key?: string,
    resolve: (arg: TJsonValue) => void,
    reject: (error: Error) => void
  }[]
  private socket: Socket
  private isManuallyClosed: boolean

  constructor () {
    super()

    this.globalId = 0
    this.queue = []
    this.socket = new Socket()
    this.isManuallyClosed = false

    this.send = this.send.bind(this)
  }

  async connect (host: string, port: number) {
    // TODO: extract everything about socket as separate "transport" module
    await new Promise((resolve, reject) => {
      const rejectAndDestroy = (error: Error) => {
        reject(error)
        this.socket.destroy()
      }

      this.socket
        .setTimeout(CONNECTION_TIMEOUT)
        .once('connect', () => {
          this.socket.once('data', (rawData) => {
            const data = parse(rawData)

            if (data.applicationType === 'gecko') {
              if (data.marionetteProtocol === 3) {
                return resolve()
              }

              return rejectAndDestroy(new FoxrError('Foxr works only with Marionette protocol v3'))
            }

            rejectAndDestroy(new FoxrError('Unsupported Marionette protocol'))
          })
        })
        .once('timeout', () => rejectAndDestroy(new Error('Socket connection timeout')))
        .once('error', (err) => rejectAndDestroy(err))
        .once('end', () => {
          this.emit('close', { isManuallyClosed: this.isManuallyClosed })
        })
        .connect(port, host)
    })

    const parseStream = createParseStream()

    parseStream.on('data', (data: [number, number, TMarionetteError | null, TJsonMap | TJsonArray]) => {
      const [type, id, error, result] = data

      if (type === 1) {
        this.queue = this.queue.filter((item) => {
          if (item.id === id) {
            if (error !== null) {
              item.reject(new FoxrError(error.message))
            } else if (typeof item.key === 'string') {
              item.resolve((result as TJsonMap)[item.key])
            } else {
              item.resolve(result)
            }

            return false
          }

          return true
        })
      }
    })

    this.socket.pipe(parseStream)
  }

  disconnect () {
    this.isManuallyClosed = true

    this.socket.end()
  }

  async send (name: string, params: TJsonMap = {}, key?: string) {
    return new Promise<TJsonValue>((resolve, reject) => {
      const data = stringify([0, this.globalId, name, params])

      this.socket.write(data, 'utf8', () => {
        this.queue.push({ id: this.globalId, key, resolve, reject })
        this.globalId += 1
      })
    })
  }
}

export default Marionette
