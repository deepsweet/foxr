import execa from 'execa'
import onExit from 'signal-exit'
import Marionette from '../Marionette'
import Browser from './Browser'
import { waitForPort } from '../utils'

const DEFAULT_HOST = 'localhost'
const DEFAULT_PORT = 2828

export type TConnectOptions = {
  host?: string,
  port?: number
}

export type TLaunchOptions = {
  args?: string[],
  dumpio?: boolean,
  executablePath: string,
  headless?: boolean
}

class Foxr {
  async connect (options?: TConnectOptions): Promise<Browser> {
    const { host, port } = {
      host: DEFAULT_HOST,
      port: DEFAULT_PORT,
      ...options
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

  async launch (userOptions: TLaunchOptions): Promise<Browser> {
    const options = {
      headless: true,
      dumpio: false,
      ...userOptions
    } as TLaunchOptions

    if (typeof options.executablePath !== 'string') {
      throw new Error('`executablePath` option is required, Foxr doesn\'t download Firefox automatically')
    }

    const args = ['-marionette', '-safe-mode', '-no-remote']

    if (options.headless === true) {
      args.push('-headless')
    }

    if (Array.isArray(options.args)) {
      args.push(...options.args)
    }

    const firefoxProcess = execa(options.executablePath, args, {
      detached: true,
      stdio: options.dumpio ? 'inherit' : 'ignore'
    })

    onExit(() => {
      firefoxProcess.kill()
    })

    firefoxProcess.unref()

    await waitForPort(DEFAULT_HOST, DEFAULT_PORT)

    return this.connect()
  }
}

export default Foxr
