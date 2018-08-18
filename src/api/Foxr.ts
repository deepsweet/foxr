import connectToMarionette from '../protocol'
import Browser from './Browser'

const DEFAULT_HOST = 'localhost'
const DEFAULT_PORT = 2828

class Foxr {
  async connect (options?: { host?: string, port?: number }) {
    const { host, port } = {
      ...options,
      host: DEFAULT_HOST,
      port: DEFAULT_PORT
    }

    const { send, disconnect } = await connectToMarionette(host, port)

    await send('WebDriver:NewSession', { capabilities: {} })

    const browser = new Browser({ send })

    browser.once('disconnected', disconnect)

    return browser
  }
}

export default Foxr
