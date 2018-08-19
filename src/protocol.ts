import { TJsonMap, TJsonValue } from 'typeon'
import { Socket } from 'net'

import { createParseStream, parse, stringify } from './transport'
import { MarionetteError, ConnectionError } from './Error'

const CONNECTION_TIMEOUT = 10000

export type TSend = (name: string, params?: TJsonMap) => Promise<any>

const connectToMarionette = async (host: string, port: number) => {
  type TQueueItem = {
    id: number,
    resolve: (arg: any) => void,
    reject: (error: any) => void
  }
  let globalId = 0
  let queue: TQueueItem[] = []
  const socket = new Socket()

  await new Promise((resolve, reject) => {
    const rejectAndDestroy = (message: string) => {
      reject(new ConnectionError(message))
      socket.destroy()
    }

    socket
      .setTimeout(CONNECTION_TIMEOUT)
      .once('connect', () => {
        socket.once('data', (rawData) => {
          const data = parse(rawData)

          if (data.applicationType === 'gecko') {
            if (data.marionetteProtocol === 3) {
              return resolve()
            }

            return rejectAndDestroy('Foxr works only with Marionette protocol v3')
          }

          rejectAndDestroy('Unsupported Marionette protocol')
        })
      })
      .once('timeout', () => rejectAndDestroy('Socket connection timeout'))
      .once('error', (err) => rejectAndDestroy(err.message))
      .connect(port, host)
  })

  const parseStream = createParseStream()

  type TMarionetteError = {
    error: string,
    message: string,
    stacktrace: string
  }

  parseStream.on('data', (data: [number, number, TMarionetteError | null, TJsonValue]) => {
    const [type, id, error, result] = data

    if (type === 1) {
      queue = queue.filter((item) => {
        if (item.id === id) {
          if (error !== null) {
            item.reject(new MarionetteError(error.message))
          } else {
            item.resolve(result)
          }

          return false
        }

        return true
      })
    }
  })

  socket.pipe(parseStream)

  return {
    disconnect: (): void => {
      socket.end()
    },

    send: (name: string, params: TJsonMap = {}): Promise<any> => {
      return new Promise((resolve, reject) => {
        const data: string = stringify([0, globalId, name, params])

        socket.write(data, 'utf8', () => {
          queue.push({ id: globalId, resolve, reject })
          globalId += 1
        })
      })
    }
  }
}

export default connectToMarionette
