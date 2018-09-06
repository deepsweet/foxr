import Marionette from '../Marionette'
import { pWriteFile, MOUSE_BUTTON } from '../utils'
import Page from './Page'
import {
  TJSHandleId,
  TClickOptions,
  TMouseButton
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

  private async _scrollIntoView (): Promise<void> {
    /* istanbul ignore next */
    await this._page.evaluate((el) => {
      (el as Element).scrollIntoView()
    }, this._handleId)
  }

  async $ (selector: string): Promise<ElementHandle | null> {
    try {
      const id = await this._send('WebDriver:FindElement', {
        element: this._handleId.ELEMENT,
        value: selector,
        using: 'css selector'
      }, 'value') as TJSHandleId

      return new ElementHandle({
        page: this._page,
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
      element: this._handleId.ELEMENT,
      value: selector,
      using: 'css selector'
    }) as TJSHandleId[]

    return ids.map((id) => new ElementHandle({
      page: this._page,
      id,
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

    await this._scrollIntoView()

    const id = await this._send('Marionette:ActionChain', {
      chain: [
        ['click', this._handleId.ELEMENT, mouseButton, options.clickCount]
      ],
      nextId: this._actionId
    }) as number

    this._actionId = id
  }

  async focus (): Promise<void> {
    await this._send('WebDriver:ExecuteScript', {
      'script': 'arguments[0].focus()',
      args: [this._id]
    })
  }

  async hover (): Promise<void> {
    await this._scrollIntoView()

    const id = await this._send('Marionette:ActionChain', {
      chain: [
        ['move', this._handleId.ELEMENT]
      ],
      nextId: this._actionId
    }) as number

    this._actionId = id
  }

  async screenshot (options: { path?: string } = {}): Promise<Buffer> {
    const result = await this._send('WebDriver:TakeScreenshot', {
      id: this._handleId.ELEMENT,
      full: false,
      hash: false
    }, 'value') as string
    const buffer = Buffer.from(result, 'base64')

    if (typeof options.path === 'string') {
      await pWriteFile(options.path, buffer)
    }

    return buffer
  }
}

export default ElementHandle
