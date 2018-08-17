import EventEmitter from 'events'
import { TSend } from '../protocol'
import createPage from './page'

class Browser extends EventEmitter {
  _send: TSend

  constructor (send: TSend) {
    super()

    this._send = send
  }

  async close () {
    await this._send('Marionette:AcceptConnections', { value: false })
    await this._send('Marionette:Quit')

    this.emit('disconnected')
  }

  async disconnect () {
    await this._send('WebDriver:DeleteSession')

    this.emit('disconnected')
  }

  async newPage () {
    await this._send('WebDriver:ExecuteScript', {
      script: 'window.open()'
    })

    const pages: number[] = await this._send('WebDriver:GetWindowHandles')

    return createPage(this._send, pages[pages.length - 1])
  }

  async pages () {
    const ids: number[] = await this._send('WebDriver:GetWindowHandles')

    return ids.map((id) => createPage(this._send, id))
  }
}

export default Browser
