import { EventEmitter } from 'events'
import Page from './Page'
import { TJSHandleId, TSend } from './types'
import { getElementId } from '../utils'

const cache = new Map<string, JSHandle>()

class JSHandle extends EventEmitter {
  public _handleId: TJSHandleId | null
  public _elementId: string

  constructor (params: { page: Page, id: TJSHandleId, send: TSend }) {
    super()

    this._handleId = params.id
    this._elementId = getElementId(params.id)

    if (cache.has(this._elementId)) {
      return cache.get(this._elementId) as JSHandle
    }

    cache.set(this._elementId, this)

    params.page.on('close', () => {
      cache.clear()
    })
  }
}

export default JSHandle
