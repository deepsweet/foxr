import EventEmitter from 'events'
import Marionette from '../Marionette'
import { pWriteFile } from '../utils'
import Page from './Page'
import { TElementId } from './types'

const cache = new Map<string, JSHandle>()

class JSHandle extends EventEmitter {
  // private _page: Page
  public _id: TElementId | null
  // private _send: Marionette['send']

  constructor (params: { page: Page, id: TElementId, send: Marionette['send'] }) {
    super()

    // this._page = params.page
    this._id = params.id
    // this._send = params.send

    if (cache.has(params.id.ELEMENT)) {
      return cache.get(params.id.ELEMENT) as JSHandle
    }

    cache.set(params.id.ELEMENT, this)

    params.page.on('close', () => {
      cache.clear()
    })
  }

  dispose () {
    this._id = null
  }
}

export default JSHandle
