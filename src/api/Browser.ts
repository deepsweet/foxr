import EventEmitter from 'events'
import Page from './Page'
import { TSend } from './types'

class Browser extends EventEmitter {
  private _send: TSend

  constructor (arg: { send: TSend }) {
    super()

    this._send = arg.send
  }

  async close (): Promise<void> {
    await this._send('Marionette:AcceptConnections', { value: false })
    await this._send('Marionette:Quit')

    this.emit('disconnected')
  }

  async disconnect (): Promise<void> {
    await this._send('WebDriver:DeleteSession')

    this.emit('disconnected')
  }

  async newPage (): Promise<Page> {
    await this._send('WebDriver:ExecuteScript', {
      script: 'window.open()'
    })

    const pages = await this._send('WebDriver:GetWindowHandles') as string[]
    const newPageId = pages[pages.length - 1]

    await this._send('WebDriver:SwitchToWindow', {
      name: newPageId,
      focus: true
    })

    return new Page({
      browser: this,
      id: newPageId,
      send: this._send
    })
  }

  async pages (): Promise<Page[]> {
    const ids = await this._send('WebDriver:GetWindowHandles') as string[]

    return ids.map((id) => new Page({
      browser: this,
      id,
      send: this._send
    }))
  }
}

export default Browser
