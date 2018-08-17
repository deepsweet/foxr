/* eslint-disable no-use-before-define */
import { writeFile } from 'fs'
import makethen from 'makethen'

import { TSend } from '../protocol'

const pWriteFile = makethen(writeFile)

type TScreenshotOptions = {
  path?: string
}

export class Element {
  constructor(private send: TSend, private id: string) {
  }

  async $(selector: string) {
    type TResult = {
      value: {
        ELEMENT: string
      }
    }

    const { value }: TResult = await this.send('WebDriver:FindElement', {
      element: this.id,
      value: selector,
      using: 'css selector'
    })

    return new Element(this.send, value.ELEMENT)
  }

  async $$(selector: string) {
    type TResult = {
      ELEMENT: string
    }

    const values: TResult[] = await this.send('WebDriver:FindElements', {
      element: this.id,
      value: selector,
      using: 'css selector'
    })

    return values.map((value) => new Element(this.send, value.ELEMENT))
  }

  async screenshot(options: TScreenshotOptions = {}): Promise<Buffer> {
    const result = await this.send('WebDriver:TakeScreenshot', {
      id: this.id,
      full: false,
      hash: false
    })
    const buffer = Buffer.from(result.value, 'base64')

    if (typeof options.path === 'string') {
      await pWriteFile(options.path, buffer)
    }

    return buffer
  }
}
