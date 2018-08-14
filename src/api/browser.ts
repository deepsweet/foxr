import EventEmitter from 'events'
import { TSend } from '../protocol'
import createPage from './page'

const createBrowser = (send: TSend) => {
  const eventEmitter = new EventEmitter()

  return {
    on: (event: string, callback: () => void) => {
      eventEmitter.on(event, callback)
    },

    once: (event: string, callback: () => void) => {
      eventEmitter.once(event, callback)
    },

    removeListener: (event: string, callback: () => void) => {
      eventEmitter.off(event, callback)
    },

    close: async () => {
      await send('Marionette:AcceptConnections', { value: false })
      await send('Marionette:Quit')

      eventEmitter.emit('disconnected')
    },

    disconnect: async () => {
      await send('WebDriver:DeleteSession')

      eventEmitter.emit('disconnected')
    },

    newPage: async () => {
      await send('WebDriver:ExecuteScript', {
        script: 'window.open()'
      })

      const pages: number[] = await send('WebDriver:GetWindowHandles')

      return createPage(send, pages[pages.length - 1])
    },

    pages: async () => {
      const ids: number[] = await send('WebDriver:GetWindowHandles')

      return ids.map((id) => createPage(send, id))
    }
  }
}

export default createBrowser
