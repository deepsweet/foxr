/* eslint-disable no-use-before-define */
import EventEmitter from 'events'
import { TJsonValue } from 'typeon'
import { pWriteFile, mapEvaluateArgs } from '../utils'
import Browser from './Browser'
import ElementHandle from './ElementHandle'
import {
  TEvaluateResult,
  TStringifiableFunction,
  TEvaluateHandleResult,
  TEvaluateResults,
  TEvaluateArg,
  TJSHandleId,
  TSend
} from './types'
import JSHandle from './JSHandle'

const cache = new Map<string, Page>()

class Page extends EventEmitter {
  private _browser: Browser
  private _id: string
  private _send: TSend

  constructor (params: { browser: Browser, id: string, send: TSend }) {
    super()

    this._browser = params.browser
    this._id = params.id
    this._send = params.send

    if (cache.has(params.id)) {
      return cache.get(params.id) as Page
    }

    cache.set(params.id, this)

    params.browser.on('disconnected', async () => {
      this.emit('close')
      cache.clear()
    })
  }

  async $ (selector: string): Promise<ElementHandle | null> {
    try {
      const id = await this._send('WebDriver:FindElement', {
        value: selector,
        using: 'css selector'
      }, 'value') as TJSHandleId

      return new ElementHandle({
        page: this,
        id,
        send: this._send
      })
    } catch (err) {
      if (err.message.startsWith('Unable to locate element')) {
        return null
      }

      throw err
    }
  }

  async $$ (selector: string): Promise<ElementHandle[]> {
    const ids = await this._send('WebDriver:FindElements', {
      value: selector,
      using: 'css selector'
    }) as TJSHandleId[]

    return ids.map((id) => new ElementHandle({
      page: this,
      id,
      send: this._send
    }))
  }

  async $eval (selector: string, func: TStringifiableFunction, ...args: TEvaluateArg[]): Promise<TJsonValue | void> {
    const result = await this._send('WebDriver:ExecuteAsyncScript', {
      script: `
        const resolve = arguments[arguments.length - 1]
        const el = document.querySelector(arguments[0])
        const args = Array.prototype.slice.call(arguments, 1, arguments.length - 1)

        if (el === null) {
          return resolve({ error: 'unable to find element' })
        }

        Promise.resolve()
          .then(() => (${func.toString()})(el, ...args))
          .then((value) => resolve({ error: null, value }))
          .catch((error) => resolve({ error: error instanceof Error ? error.message : error }))
      `,
      args: [selector, ...mapEvaluateArgs(args)]
    }, 'value') as TEvaluateResult

    if (result.error !== null) {
      throw new Error(`Evaluation failed: ${result.error}`)
    }

    return result.value
  }

  async $$eval (selector: string, func: TStringifiableFunction, ...args: TEvaluateArg[]): Promise<Array<TJsonValue | void>> {
    const result = await this._send('WebDriver:ExecuteAsyncScript', {
      script: `
        const resolve = arguments[arguments.length - 1]
        const els = Array.from(document.querySelectorAll(arguments[0]))
        const args = Array.prototype.slice.call(arguments, 1, arguments.length - 1)

        Promise.all(
          els.map((el) => Promise.resolve().then(() => (${func.toString()})(el, ...args)))
        )
        .then((value) => resolve({ error: null, value }))
        .catch((error) => resolve({ error: error instanceof Error ? error.message : error }))
      `,
      args: [selector, ...mapEvaluateArgs(args)]
    }, 'value') as TEvaluateResults

    if (result.error !== null) {
      throw new Error(`Evaluation failed: ${result.error}`)
    }

    return result.value
  }

  async bringToFront (): Promise<void> {
    await this._send('WebDriver:SwitchToWindow', {
      name: this._id,
      focus: true
    })
  }

  browser (): Browser {
    return this._browser
  }

  async close (): Promise<void> {
    await this._send('WebDriver:ExecuteScript', {
      script: 'window.close()'
    })

    this.emit('close')
    cache.delete(this._id)
  }

  content (): Promise<string> {
    return this._send('WebDriver:GetPageSource', {}, 'value') as Promise<string>
  }

  async evaluate (target: TStringifiableFunction | string, ...args: TEvaluateArg[]): Promise<TJsonValue | void> {
    let result = null

    if (typeof target === 'function') {
      result = await this._send('WebDriver:ExecuteAsyncScript', {
        script: `
          const args = Array.prototype.slice.call(arguments, 0, arguments.length - 1)
          const resolve = arguments[arguments.length - 1]

          Promise.resolve()
            .then(() => (${target.toString()})(...args))
            .then((value) => resolve({ error: null, value }))
            .catch((error) => resolve({ error: error instanceof Error ? error.message : error }))
        `,
        args: mapEvaluateArgs(args)
      }, 'value') as TEvaluateResult
    } else {
      result = await this._send('WebDriver:ExecuteAsyncScript', {
        script: `
          const resolve = arguments[0]

          Promise.resolve()
            .then(() => ${target})
            .then((value) => resolve({ error: null, value }))
            .catch((error) => resolve({ error: error instanceof Error ? error.message : error }))
        `
      }, 'value') as TEvaluateResult
    }

    if (result.error !== null) {
      throw new Error(`Evaluation failed: ${result.error}`)
    }

    return result.value
  }

  async evaluateHandle (target: TStringifiableFunction | string, ...args: TEvaluateArg[]): Promise<JSHandle> {
    let result = null

    if (typeof target === 'function') {
      result = await this._send('WebDriver:ExecuteAsyncScript', {
        script: `
          const args = Array.prototype.slice.call(arguments, 0, arguments.length - 1)
          const resolve = arguments[arguments.length - 1]

          Promise.resolve()
            .then(() => (${target.toString()})(...args))
            .then((value) => {
              if (value instanceof Element) {
                resolve({ error: null, value })
              } else {
                resolve({ error: null, value: null })
              }
            })
            .catch((error) => resolve({ error: error instanceof Error ? error.message : error }))
        `,
        args: mapEvaluateArgs(args)
      }, 'value') as TEvaluateHandleResult
    } else {
      result = await this._send('WebDriver:ExecuteAsyncScript', {
        script: `
          const resolve = arguments[0]

          Promise.resolve()
            .then(() => ${target})
            .then((value) => {
              if (value instanceof Element) {
                resolve({ error: null, value })
              } else {
                resolve({ error: null, value: null })
              }
            })
            .catch((error) => resolve({ error: error instanceof Error ? error.message : error }))
        `
      }, 'value') as TEvaluateHandleResult
    }

    if (result.error !== null) {
      throw new Error(`Evaluation failed: ${result.error}`)
    }

    if (result.value === null) {
      throw new Error('Unable to get a JSHandle')
    }

    return new JSHandle({
      page: this,
      id: result.value,
      send: this._send
    })
  }

  async focus (selector: string): Promise<void> {
    await this.evaluate(`{
      const el = document.querySelector('${selector}')

      if (el === null) {
        throw new Error('unable to find element')
      }

      if (!(el instanceof HTMLElement)) {
        throw new Error('Found element is not HTMLElement and not focusable')
      }

      el.focus()
    }`)
  }

  async goto (url: string): Promise<void> {
    await this._send('WebDriver:Navigate', { url })
  }

  async screenshot (options: { path?: string } = {}): Promise<Buffer> {
    const result = await this._send('WebDriver:TakeScreenshot', {
      full: true,
      hash: false
    }, 'value') as string
    const buffer = Buffer.from(result, 'base64')

    if (typeof options.path === 'string') {
      await pWriteFile(options.path, buffer)
    }

    return buffer
  }

  async setContent (html: string): Promise<void> {
    await this._send('WebDriver:ExecuteScript', {
      script: 'document.documentElement.innerHTML = arguments[0]',
      args: [html]
    })
  }

  title (): Promise<string> {
    return this._send('WebDriver:GetTitle', {}, 'value') as Promise<string>
  }

  url (): Promise<string> {
    return this._send('WebDriver:GetCurrentURL', {}, 'value') as Promise<string>
  }

  async viewport (): Promise<{ width: number, height: number }> {
    type TResult = {
      width: number,
      height: number
    }

    return await this.evaluate(`
      ({
        width: window.innerWidth,
        height: window.innerHeight
      })
    `) as TResult
  }
}

export default Page
