import { TSend } from '../protocol'
import { createPage } from './page'

export const createBrowser = (send: TSend, onEnd: () => void) => ({
  close: async (): Promise<void> => {
    await send('Marionette:Quit')
    onEnd()
  },

  disconnect: async (): Promise<void> => {
    await send('WebDriver:DeleteSession')
    onEnd()
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
})
