/* eslint-disable no-use-before-define */
import EventEmitter from 'events'
import { writeFile } from 'fs'
import makethen from 'makethen'

import { TSend } from '../protocol'

// FIXME: set minimum Node.js version to 8 and use `util.promisify()`?
type TWriteFile = (path: string, data: Buffer, options: { encoding: string | null }, cb: (err: any) => void) => void
const pWriteFile = makethen(writeFile as TWriteFile)

class Element extends EventEmitter {
  private _id: string
  private _send: TSend

  constructor (params: { id: string, send: TSend }) {
    super()

    this._id = params.id
    this._send = params.send
  }

  async $ (selector: string) {
    type TResult = {
       value: {
         ELEMENT: string
       }
     }

    const { value }: TResult = await this._send('WebDriver:FindElement', {
      element: this._id,
      value: selector,
      using: 'css selector'
    })

    return new Element({
      send: this._send,
      id: value.ELEMENT
    })
  }

  async $$ (selector: string) {
    type TResult = {
      ELEMENT: string
    }

    const values: TResult[] = await this._send('WebDriver:FindElements', {
      element: this._id,
      value: selector,
      using: 'css selector'
    })

    return values.map((value) => new Element({
      send: this._send,
      id: value.ELEMENT
    }))
  }

  async screenshot (options: { path?: string } = {}): Promise<Buffer> {
    const result = await this._send('WebDriver:TakeScreenshot', {
      id: this._id,
      full: false,
      hash: false
    })
    const buffer = Buffer.from(result.value, 'base64')

    if (typeof options.path === 'string') {
      await pWriteFile(options.path, buffer, { encoding: null })
    }

    return buffer
  }
}

export default Element
