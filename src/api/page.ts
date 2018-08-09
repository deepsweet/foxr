/* eslint-disable no-use-before-define */
import { writeFile } from 'fs'
import { promisify } from 'util'
import { TJsonValue } from 'typeon'

import { TSend } from '../protocol'
import createElement from './element'

const pWriteFile = promisify(writeFile)

type TScreenshotOptions = {
  path?: string
}

type TStringifiableFunction = (...args: TJsonValue[]) => TJsonValue

const createPage = (send: TSend) => ({
  $: async (selector: string) => {
    type TResult = {
      value: {
        ELEMENT: string
      }
    }

    const { value }: TResult = await send('WebDriver:FindElement', {
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
      value: selector,
      using: 'css selector'
    })

    return values.map((value) => createElement(send, value.ELEMENT))
  },

  close: (): Promise<void> => {
    return send('WebDriver:ExecuteScript', {
      script: 'window.close()'
    })
  },

  evaluate: async (target: TStringifiableFunction | string, ...args: TJsonValue[]): Promise<TJsonValue> => {
    type TResult = {
      value: TJsonValue
    }

    if (typeof target === 'function') {
      const { value }: TResult = await send('WebDriver:ExecuteAsyncScript', {
        script: `
        const args = Array.prototype.slice.call(arguments, 0, arguments.length - 1)
        const resolve = arguments[arguments.length - 1]
        const result = (${target.toString()})(args)

        Promise.resolve(result)
          .then(resolve)
          .catch((error) => {
            throw error
          })
      `,
        args
      })

      return value
    }

    const { value }: TResult = await send('WebDriver:ExecuteAsyncScript', {
      script: `
        Promise.resolve(${target})
          .then(arguments[0])
          .catch((error) => {
            throw error
          })
      `
    })

    return value
  },

  goto: (url: string): Promise<void> => {
    return send('WebDriver:Navigate', { url })
  },

  screenshot: async (options: TScreenshotOptions = {}): Promise<Buffer> => {
    const result = await send('WebDriver:TakeScreenshot', {
      full: true,
      hash: false
    })
    const buffer = Buffer.from(result.value, 'base64')

    if (typeof options.path === 'string') {
      await pWriteFile(options.path, buffer)
    }

    return buffer
  },

  setContent: (html: string) => {
    return send('WebDriver:ExecuteScript', {
      script: 'document.documentElement.innerHTML = arguments[0]',
      args: [html]
    })
  },

  title: async (): Promise<string> => {
    const result = await send('WebDriver:GetTitle')

    return result.value
  }
})

export default createPage
