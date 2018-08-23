/* eslint-disable no-use-before-define */
import EventEmitter from 'events'
import { writeFile } from 'fs'
import makethen from 'makethen'

import { TSend } from '../protocol'

// FIXME: set minimum Node.js version to 8 and use `util.promisify()`?
type TWriteFile = (path: string, data: Buffer, options: { encoding: string | null }, cb: (err: any) => void) => void
const pWriteFile = makethen(writeFile as TWriteFile)

export type TElementId = {
  [key: string]: string,
  ELEMENT: string
}

class Element extends EventEmitter {
  private _id: TElementId
  private _send: TSend

  constructor (params: { id: TElementId, send: TSend }) {
    super()

    this._id = params.id
    this._send = params.send
  }

  async $ (selector: string) {
    try {
      type TResult = {
        value: TElementId
      }

      const { value } = await this._send('WebDriver:FindElement', {
        element: this._id.ELEMENT,
        value: selector,
        using: 'css selector'
      }) as TResult

      return new Element({
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
    }) as TElementId[]

    return values.map((value) => new Element({
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
    type TResult = {
      value: string
    }

    const result = await this._send('WebDriver:TakeScreenshot', {
      id: this._id.ELEMENT,
      full: false,
      hash: false
    }) as TResult
    const buffer = Buffer.from(result.value, 'base64')

    if (typeof options.path === 'string') {
      await pWriteFile(options.path, buffer, { encoding: null })
    }

    return buffer
  }
}

export default Element
