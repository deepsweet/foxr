/* eslint-disable no-use-before-define */
import EventEmitter from 'events'
import { TJsonValue } from 'typeon'
import Marionette from '../Marionette'
import { pWriteFile } from '../utils'
import Browser from './Browser'
import ElementHandle from './ElementHandle'
import {
  TElementHandleResult,
  TElementHandlesResult,
  TEvaluateResult,
  TStringifiableFunction,
  TStringResult,
  TEvaluateHandleResult,
  TEvaluateResults
} from './types'
import JSHandle from './JSHandle'

const cache = new Map<string, Page>()

const mapJSHandleArgs = (args: Array<TJsonValue | JSHandle>) => args.map((arg) => {
  if (arg instanceof JSHandle) {
    return arg._id
  }

  return arg
})

class Page extends EventEmitter {
  private _browser: Browser
  private _id: string
  private _send: Marionette['send']

  constructor (params: { browser: Browser, id: string, send: Marionette['send'] }) {
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

  async $ (selector: string) {
    try {
      const { value } = await this._send('WebDriver:FindElement', {
        value: selector,
        using: 'css selector'
      }) as TElementHandleResult

      return new ElementHandle({
        page: this,
        id: value,
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
    const values = await this._send('WebDriver:FindElements', {
      value: selector,
      using: 'css selector'
    }) as TElementHandlesResult

    return values.map((value) => new ElementHandle({
      page: this,
      id: value,
      send: this._send
    }))
  }

  async $eval (selector: string, func: TStringifiableFunction, ...args: Array<TJsonValue | JSHandle>): Promise<TJsonValue | void> {
    const { value: result } = await this._send('WebDriver:ExecuteAsyncScript', {
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
      args: [selector, ...mapJSHandleArgs(args)]
    }) as TEvaluateResult

    if (result.error !== null) {
      throw new Error(`Evaluation failed: ${result.error}`)
    }

    return result.value
  }

  async $$eval (selector: string, func: TStringifiableFunction, ...args: TJsonValue[]): Promise<Array<TJsonValue | void>> {
    const { value: result } = await this._send('WebDriver:ExecuteAsyncScript', {
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
      args: [selector, ...mapJSHandleArgs(args)]
    }) as TEvaluateResults

    if (result.error !== null) {
      throw new Error(`Evaluation failed: ${result.error}`)
    }

    return result.value
  }

  async bringToFront () {
    await this._send('WebDriver:SwitchToWindow', {
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

    this.emit('close')
    cache.delete(this._id)
  }

  async content (): Promise<string> {
    const { value } = await this._send('WebDriver:GetPageSource') as TStringResult

    return value
  }

  async evaluate (target: TStringifiableFunction | string, ...args: Array<TJsonValue | JSHandle>): Promise<TJsonValue | void> {
    let marionetteResult = null

    if (typeof target === 'function') {
      marionetteResult = await this._send('WebDriver:ExecuteAsyncScript', {
        script: `
          const args = Array.prototype.slice.call(arguments, 0, arguments.length - 1)
          const resolve = arguments[arguments.length - 1]

          Promise.resolve()
            .then(() => (${target.toString()})(...args))
            .then((value) => resolve({ error: null, value }))
            .catch((error) => resolve({ error: error instanceof Error ? error.message : error }))
        `,
        args: mapJSHandleArgs(args)
      }) as TEvaluateResult
    } else {
      marionetteResult = await this._send('WebDriver:ExecuteAsyncScript', {
        script: `
          const resolve = arguments[0]

          Promise.resolve()
            .then(() => ${target})
            .then((value) => resolve({ error: null, value }))
            .catch((error) => resolve({ error: error instanceof Error ? error.message : error }))
        `
      }) as TEvaluateResult
    }

    const result = marionetteResult.value

    if (result.error !== null) {
      throw new Error(`Evaluation failed: ${result.error}`)
    }

    return result.value
  }

  async evaluateHandle (target: TStringifiableFunction | string, ...args: Array<TJsonValue | JSHandle>): Promise<JSHandle> {
    let marionetteResult = null

    if (typeof target === 'function') {
      marionetteResult = await this._send('WebDriver:ExecuteAsyncScript', {
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
        args: mapJSHandleArgs(args)
      }) as TEvaluateHandleResult
    } else {
      marionetteResult = await this._send('WebDriver:ExecuteAsyncScript', {
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
      }) as TEvaluateHandleResult
    }

    const result = marionetteResult.value

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

  async focus (selector: string) {
    return this.evaluate(`{
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

  async goto (url: string) {
    await this._send('WebDriver:Navigate', { url })
  }

  async screenshot (options: { path?: string } = {}): Promise<Buffer> {
    const result = await this._send('WebDriver:TakeScreenshot', {
      full: true,
      hash: false
    }) as TStringResult
    const buffer = Buffer.from(result.value, 'base64')

    if (typeof options.path === 'string') {
      await pWriteFile(options.path, buffer)
    }

    return buffer
  }

  async setContent (html: string) {
    return this._send('WebDriver:ExecuteScript', {
      script: 'document.documentElement.innerHTML = arguments[0]',
      args: [html]
    })
  }

  async setViewport ({ width, height }: { width: number, height: number }) {
    type TResult = {
      widthDelta: number,
      heightDelta: number
    }

    const { widthDelta, heightDelta } = await this.evaluate(`
      ({
        widthDelta: window.outerWidth - window.innerWidth,
        heightDelta: window.outerHeight - window.innerHeight
      })
    `) as TResult

    await this._send('WebDriver:SetWindowRect', {
      width: width + widthDelta,
      height: height + heightDelta
    })
  }

  async title (): Promise<string> {
    const result = await this._send('WebDriver:GetTitle') as TStringResult

    return result.value
  }

  async url (): Promise<string> {
    const result = await this._send('WebDriver:GetCurrentURL') as TStringResult

    return result.value
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
