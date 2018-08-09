import connectToMarionette from '../protocol'
import createBrowser from './browser'

const DEFAULT_HOST = 'localhost'
const DEFAULT_PORT = 2828

type TConnectOptions = {
  host?: string,
  port?: number
}

const foxr = {
  connect: async (options?: TConnectOptions) => {
    const { host, port } = {
      ...options,
      host: DEFAULT_HOST,
      port: DEFAULT_PORT
    }
    const { send, disconnect } = await connectToMarionette(host, port)

    await send('WebDriver:NewSession', { capabilities: {} })

    return createBrowser(send, disconnect)
  }
}

export default foxr
