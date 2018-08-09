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

    off: (event: string, callback: () => void) => {
      eventEmitter.off(event, callback)
    },

    close: async (): Promise<void> => {
      await send('Marionette:Quit')

      eventEmitter.emit('disconnected')
    },

    disconnect: async (): Promise<void> => {
      await send('WebDriver:DeleteSession')

      eventEmitter.emit('disconnected')
    },

    newPage: async () => {
      await send('WebDriver:ExecuteScript', {
        script: 'window.open()'
      })

      const windows = await send('WebDriver:GetWindowHandles')

      await send('WebDriver:SwitchToWindow', {
        focus: true,
        name: windows[windows.length - 1]
      })

      return createPage(send)
    },

    pages: (): Promise<number[]> => {
      return send('WebDriver:GetWindowHandles')
    }
  }
}

export default createBrowser
