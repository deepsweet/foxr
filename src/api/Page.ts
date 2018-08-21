/* eslint-disable no-use-before-define */
import EventEmitter from 'events'
import { writeFile } from 'fs'
import makethen from 'makethen'
import { TJsonValue } from 'typeon'

import Browser from './Browser'
import { TSend } from '../protocol'
import Element from './Element'

// FIXME: set minimum Node.js version to 8 and use `util.promisify()`?
type TWriteFile = (path: string, data: Buffer, options: { encoding: string | null }, cb: (err: any) => void) => void
const pWriteFile = makethen(writeFile as TWriteFile)

type TStringifiableFunction = (...args: TJsonValue[]) => TJsonValue | Promise<TJsonValue>

class Page extends EventEmitter {
  private _browser: Browser
  private _id: number
  private _send: TSend

  constructor (arg: { browser: Browser, id: number, send: TSend }) {
    super()

    this._browser = arg.browser
    this._id = arg.id
    this._send = arg.send
  }

  async $ (selector: string) {
    try {
      type TResult = {
        value: {
          ELEMENT: string
        }
      }

      const { value }: TResult = await this._send('WebDriver:FindElement', {
        value: selector,
        using: 'css selector'
      })

      return new Element({
        id: value.ELEMENT,
        send: this._send
      })
    } catch (err) {
      if (err.message.startsWith('Unable to locate element')) {
        return null
      }

      throw err
    }
  }

  async $$ (selector: string) {
    type TResult = {
      ELEMENT: string
    }

    const values: TResult[] = await this._send('WebDriver:FindElements', {
      value: selector,
      using: 'css selector'
    })

    return values.map((value) => new Element({
      id: value.ELEMENT,
      send: this._send
    }))
  }

  async bringToFront () {
    return this._send('WebDriver:SwitchToWindow', {
      name: this._id,
      focus: true
    })
  }

  browser () {
    return this._browser
  }

  async close () {
    await this._send('WebDriver:ExecuteScript', {
      script: 'window.close()'
    })
  }

  async content (): Promise<string> {
    type TResult = {
      value: string
    }

    const { value }: TResult = await this._send('WebDriver:GetPageSource')

    return value
  }

  async evaluate (target: TStringifiableFunction | string, ...args: TJsonValue[]): Promise<TJsonValue> {
    type TResult = {
      value: {
        error: string | null,
        value: TJsonValue
      }
    }

    if (typeof target === 'function') {
      const { value: result }: TResult = await this._send('WebDriver:ExecuteAsyncScript', {
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

    const { value: result }: TResult = await this._send('WebDriver:ExecuteAsyncScript', {
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

  async goto (url: string) {
    await this._send('WebDriver:Navigate', { url })
  }

  async screenshot (options: { path?: string } = {}): Promise<Buffer> {
    const result = await this._send('WebDriver:TakeScreenshot', {
      full: true,
      hash: false
    })
    const buffer = Buffer.from(result.value, 'base64')

    if (typeof options.path === 'string') {
      await pWriteFile(options.path, buffer, { encoding: null })
    }

    return buffer
  }

  async setContent (html: string) {
    return this._send('WebDriver:ExecuteScript', {
      script: 'document.documentElement.innerHTML = arguments[0]',
      args: [html]
    })
  }

  async title (): Promise<string> {
    const result = await this._send('WebDriver:GetTitle')

    return result.value
  }

  async url (): Promise<string> {
    const result = await this._send('WebDriver:GetCurrentURL')

    return result.value
  }
}

export default Page
