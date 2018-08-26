import EventEmitter from 'events'
import Marionette from '../Marionette'
import { pWriteFile } from '../utils'
import Page from './Page'
import { TElementId, TElementResult, TElementsResult, TStringResult } from './types'

const cache = new Map<string, Element>()

class Element extends EventEmitter {
  private _page: Page
  private _id: TElementId
  private _send: Marionette['send']

  constructor (params: { page: Page, id: TElementId, send: Marionette['send'] }) {
    super()

    this._page = params.page
    this._id = params.id
    this._send = params.send

    if (cache.has(params.id.ELEMENT)) {
      return cache.get(params.id.ELEMENT) as Element
    }

    cache.set(params.id.ELEMENT, this)

    params.page.on('close', () => {
      cache.clear()
    })
  }

  async $ (selector: string) {
    try {
      const { value } = await this._send('WebDriver:FindElement', {
        element: this._id.ELEMENT,
        value: selector,
        using: 'css selector'
      }) as TElementResult

      return new Element({
        page: this._page,
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
      element: this._id.ELEMENT,
      value: selector,
      using: 'css selector'
    }) as TElementsResult

    return values.map((value) => new Element({
      page: this._page,
      id: value,
      send: this._send
    }))
  }

  async focus () {
    await this._send('WebDriver:ExecuteScript', {
      'script': 'arguments[0].focus()',
      args: [this._id]
    })
  }

  async screenshot (options: { path?: string } = {}): Promise<Buffer> {
    const result = await this._send('WebDriver:TakeScreenshot', {
      id: this._id.ELEMENT,
      full: false,
      hash: false
    }) as TStringResult
    const buffer = Buffer.from(result.value, 'base64')

    if (typeof options.path === 'string') {
      await pWriteFile(options.path, buffer)
    }

    return buffer
  }
}

export default Element
