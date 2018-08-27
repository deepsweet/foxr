import EventEmitter from 'events'
import Marionette from '../Marionette'
import { pWriteFile } from '../utils'
import Page from './Page'
import { TJSHandleId } from './types'

const cache = new Map<string, JSHandle>()

class JSHandle extends EventEmitter {
  public _id: TJSHandleId | null

  constructor (params: { page: Page, id: TJSHandleId, send: Marionette['send'] }) {
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

  // 🤔
  dispose () {
    this._id = null
  }
}

export default JSHandle
