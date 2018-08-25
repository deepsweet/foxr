import Marionette from '../Marionette'
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

    const marionette = new Marionette()

    await marionette.connect(host, port)
    await marionette.send('WebDriver:NewSession', { capabilities: {} })

    const browser = new Browser({ send: marionette.send })

    marionette.once('close', async ({ isManuallyClosed }) => {
      if (!isManuallyClosed) {
        browser.emit('disconnected')
      }
    })

    browser.once('disconnected', () => {
      marionette.disconnect()
    })

    return browser
  }
}

export default Foxr
