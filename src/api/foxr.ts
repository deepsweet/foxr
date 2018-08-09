import { Socket } from 'net'

import { parse } from '../transport'
import { handleStream } from '../protocol'
import { createBrowser } from './browser'

const DEFAULT_HOST = 'localhost'
const DEFAULT_PORT = 2828
const CONNECTION_TIMEOUT = 10000

type TOptions = {
  host?: string,
  port?: number
}

class TFoxrError extends Error {
  constructor (message: string) {
    super(message)
    Error.captureStackTrace(this, TFoxrError)
    this.name = 'FoxrError'
  }
}

const foxr = {
  connect: async (options?: TOptions) => {
    try {
      const { host, port } = {
        ...options,
        host: DEFAULT_HOST,
        port: DEFAULT_PORT
      }
      const socket = new Socket()

      await new Promise<void>((resolve, reject) => {
        const rejectAndDestroy = (error: Error) => {
          reject(error)
          socket.destroy()
        }

        socket
          .setTimeout(CONNECTION_TIMEOUT)
          .once('ready', () => {
            socket.once('data', (rawData) => {
              const data = parse(rawData)

              if (data.applicationType === 'gecko') {
                if (data.marionetteProtocol === 3) {
                  return resolve()
                }

                return rejectAndDestroy(new Error('Foxr works only with Marionette protocol v3'))
              }

              rejectAndDestroy(new Error('Marionette connection protocol error'))
            })
          })
          .once('timeout', () => rejectAndDestroy(new Error('Socket connection timeout')))
          .once('error', rejectAndDestroy)
          .connect(port, host)
      })

      const send = handleStream(socket)

      // TODO: is the result needed?
      await send('WebDriver:NewSession', { capabilities: {} })

      return createBrowser(send, () => {
        socket.end()
      })
    } catch (err) {
      throw new TFoxrError(
        err.stack.replace(/^Error:\s/, '').replace(/\s\s\s\s\s/, '\n')
      )
    }
  }
}

export default foxr
