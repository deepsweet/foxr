/* eslint-disable no-use-before-define */
import { writeFile } from 'fs'
import { promisify } from 'util'

import { TSend } from '../protocol'

const pWriteFile = promisify(writeFile)

type TScreenshotOptions = {
  path?: string
}

export const createElement = (send: TSend, id: string) => ({
  $: async (selector: string) => {
    type TResult = {
      value: {
        ELEMENT: string
      }
    }

    const { value }: TResult = await send('WebDriver:FindElement', {
      element: id,
      value: selector,
      using: 'css selector'
    })

    return createElement(send, value.ELEMENT)
  },

  $$: async (selector: string) => {
    type TResult = {
      ELEMENT: string
    }

    const values: TResult[] = await send('WebDriver:FindElements', {
      element: id,
      value: selector,
      using: 'css selector'
    })

    return values.map((value) => createElement(send, value.ELEMENT))
  },

  screenshot: async (options: TScreenshotOptions = {}): Promise<Buffer> => {
    const result = await send('WebDriver:TakeScreenshot', {
      id,
      full: false,
      hash: false
    })
    const buffer = Buffer.from(result.value, 'base64')

    if (typeof options.path === 'string') {
      await pWriteFile(options.path, buffer)
    }

    return buffer
  }
})
