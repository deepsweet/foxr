import EventEmitter from 'events'
import { TSend } from '../protocol'
import { Page } from './page'

export class Browser {
  private readonly eventEmitter = new EventEmitter()
  constructor(private send: TSend) {
  }

  on(event: string, callback: () => void) {
    this.eventEmitter.on(event, callback);
  }

  once(event: string, callback: () => void) {
    this.eventEmitter.on(event, callback);
  }

  removeListener(event: string, callback: () => void) {
    this.eventEmitter.off(event, callback)
  }

  async close() {
    await this.send('Marionette:AcceptConnections', { value: false })
    await this.send('Marionette:Quit')

    this.eventEmitter.emit('disconnected')
  }

  async disconnect() {
    await this.send('WebDriver:DeleteSession')

    this.eventEmitter.emit('disconnected')
  }

  async newPage() {
    await this.send('WebDriver:ExecuteScript', {
      script: 'window.open()'
    })

    const pages: number[] = await this.send('WebDriver:GetWindowHandles')

    return new Page(this.send, pages[pages.length - 1])
  }

  async pages() {
    const ids: number[] = await this.send('WebDriver:GetWindowHandles')

    return ids.map((id) => new Page(this.send, id))
  }
}
