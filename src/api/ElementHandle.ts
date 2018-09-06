import Marionette from '../Marionette'
import { pWriteFile, MOUSE_BUTTON } from '../utils'
import Page from './Page'
import {
  TJSHandleId,
  TElementHandleResult,
  TElementHandlesResult,
  TStringResult,
  TClickOptions,
  TMouseButton,
  TNumberResult
} from './types'
import JSHandle from './JSHandle'

class ElementHandle extends JSHandle {
  private _page: Page
  public _handleId: TJSHandleId
  private _send: Marionette['send']
  private _actionId: number | null

  constructor (params: { page: Page, id: TJSHandleId, send: Marionette['send'] }) {
    super(params)

    this._page = params.page
    this._handleId = params.id
    this._send = params.send
    this._actionId = null
  }

  async $ (selector: string): Promise<ElementHandle | null> {
    try {
      const { value } = await this._send('WebDriver:FindElement', {
        element: this._handleId.ELEMENT,
        value: selector,
        using: 'css selector'
      }) as TElementHandleResult

      return new ElementHandle({
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

  async $$ (selector: string): Promise<ElementHandle[]> {
    const values = await this._send('WebDriver:FindElements', {
      element: this._handleId.ELEMENT,
      value: selector,
      using: 'css selector'
    }) as TElementHandlesResult

    return values.map((value) => new ElementHandle({
      page: this._page,
      id: value,
      send: this._send
    }))
  }

  async click (userOptions?: TClickOptions): Promise<void> {
    const options = {
      button: 'left',
      clickCount: 1,
      ...userOptions
    }
    const mouseButton = MOUSE_BUTTON[options.button as TMouseButton]

    /* istanbul ignore next */
    await this._page.evaluate((el) => {
      (el as Element).scrollIntoView()
    }, this._handleId)

    const result = await this._send('Marionette:ActionChain', {
      chain: [
        ['click', this._handleId.ELEMENT, mouseButton, options.clickCount]
      ],
      nextId: this._actionId
    }) as TNumberResult

    this._actionId = result.value
  }

  async focus (): Promise<void> {
    await this._send('WebDriver:ExecuteScript', {
      'script': 'arguments[0].focus()',
      args: [this._id]
    })
  }

  async screenshot (options: { path?: string } = {}): Promise<Buffer> {
    const result = await this._send('WebDriver:TakeScreenshot', {
      id: this._handleId.ELEMENT,
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

export default ElementHandle
