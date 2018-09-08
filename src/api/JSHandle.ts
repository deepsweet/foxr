import EventEmitter from 'events'
import Page from './Page'
import { TJSHandleId, TSend } from './types'

const cache = new Map<string, JSHandle>()

class JSHandle extends EventEmitter {
  public _id: TJSHandleId | null

  constructor (params: { page: Page, id: TJSHandleId, send: TSend }) {
    super()

    this._id = params.id

    if (cache.has(params.id.ELEMENT)) {
      return cache.get(params.id.ELEMENT) as JSHandle
    }

    cache.set(params.id.ELEMENT, this)

    params.page.on('close', () => {
      cache.clear()
    })
  }
}

export default JSHandle
