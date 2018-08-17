/* eslint-disable no-use-before-define */
import { writeFile } from 'fs'
import makethen from 'makethen'
import { TJsonValue } from 'typeon'

import { TSend } from '../protocol'
import { Element } from './element'

const pWriteFile = makethen(writeFile)

type TScreenshotOptions = {
  path?: string
}

type TStringifiableFunction = (...args: TJsonValue[]) => TJsonValue | Promise<TJsonValue>

export class Page {
  constructor(private send: TSend, private id: number) {
  }

  switchToPage() {
    return this.send('WebDriver:SwitchToWindow', { name: this.id })
  }

  async $(selector: string) {
    await this.switchToPage();
    try {
      type TResult = {
        value: {
          ELEMENT: string
        }
      }

      const { value }: TResult = await this.send('WebDriver:FindElement', {
        value: selector,
        using: 'css selector'
      })

      return new Element(this.send, value.ELEMENT)
    } catch (err) {
      if (err.error === 'no such element') {
        return null
      }

      throw err
    }
  }

  async $$(selector: string) {
    await this.switchToPage()

    type TResult = {
      ELEMENT: string
    }

    const values: TResult[] = await this.send('WebDriver:FindElements', {
      value: selector,
      using: 'css selector'
    })

    return values.map(value => new Element(this.send, value.ELEMENT))
  }

  async close() {
    await this.switchToPage()
    await this.send('WebDriver:ExecuteScript', {
      script: 'window.close()'
    })
  }

  async content(): Promise<string> {
    await this.switchToPage()

    type TResult = {
      value: string
    }
    const { value }: TResult = await this.send('WebDriver:GetPageSource')

    return value
  }

  async evaluate(target: TStringifiableFunction | string, ...args: TJsonValue[]): Promise<TJsonValue> {
    await this.switchToPage()

    type TResult = {
      value: {
        error: string | null,
        value: TJsonValue
      }
    }

    if (typeof target === 'function') {
      const { value: result }: TResult = await this.send('WebDriver:ExecuteAsyncScript', {
        script: `
        const args = Array.prototype.slice.call(arguments, 0, arguments.length - 1)
        const resolve = arguments[arguments.length - 1]

        Promise.resolve()
          .then(() => (${target.toString()})(...args))
          .then((value) => resolve({ error: null, value }))
          .catch((error) => resolve({ error: error instanceof Error ? error.message : error }))
      `,
        args
      })

      if (result.error !== null) {
        throw new Error(`Evaluation failed: ${result.error}`)
      }

      return result.value
    }

    const { value: result }: TResult = await this.send('WebDriver:ExecuteAsyncScript', {
      script: `
        const resolve = arguments[0]

        Promise.resolve()
          .then(() => ${target})
          .then((value) => resolve({ error: null, value }))
          .catch((error) => resolve({ error: error instanceof Error ? error.message : error }))
      `
    })

    if (result.error !== null) {
      throw new Error(`Evaluation failed: ${result.error}`)
    }

    return result.value
  }

  async goto(url: string) {
    await this.switchToPage()
    await this.send('WebDriver:Navigate', { url })
  }

  async screenshot(options: TScreenshotOptions = {}): Promise<Buffer> {
    await this.switchToPage()

    const result = await this.send('WebDriver:TakeScreenshot', {
      full: true,
      hash: false
    })
    const buffer = Buffer.from(result.value, 'base64')

    if (typeof options.path === 'string') {
      await pWriteFile(options.path, buffer)
    }

    return buffer
  }

  async setContent(html: string) {
    await this.switchToPage()

    return this.send('WebDriver:ExecuteScript', {
      script: 'document.documentElement.innerHTML = arguments[0]',
      args: [html]
    })
  }

  async title() {
    await this.switchToPage()

    type TResult = { value: string }

    const result: TResult = await this.send('WebDriver:GetTitle')

    return result.value
  }
}
