import { writeFile } from 'fs'
import { promisify } from 'util'
import { Socket } from 'net'
import { TEvaluateArg, TJSHandleId } from './api/types'
import JSHandle from './api/JSHandle'

export const pWriteFile = promisify(writeFile)

export const MOUSE_BUTTON = {
  left: 0,
  middle: 1,
  right: 2
}

export const mapEvaluateArgs = (args: TEvaluateArg[]) => args.map((arg) => {
  if (arg instanceof JSHandle) {
    return arg._handleId
  }

  return arg
})

export const getElementId = (JSHandleId: TJSHandleId) => Object.values(JSHandleId)[0]

// ESLint fails to parse this written as arrow function
export function hasKey <T> (obj: T, key: any): key is keyof T {
  return key in obj
}

const CHECK_PORT_TIMEOUT = 200

export const checkPort = (host: string, port: number): Promise<boolean> => {
  return new Promise((resolve) => {
    const socket = new Socket()
    let isAvailablePort = false

    socket
      .setTimeout(CHECK_PORT_TIMEOUT)
      .once('connect', () => {
        isAvailablePort = true

        socket.destroy()
      })
      .once('timeout', () => {
        socket.destroy()
      })
      .once('error', () => {
        resolve(false)
      })
      .once('close', () => {
        if (isAvailablePort) {
          resolve(true)
        } else {
          resolve(false)
        }
      })
      .connect(
        port,
        host
      )
  })
}

export const sleep = (timeout: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, timeout))

export const waitForPort = async (host: string, port: number): Promise<void> => {
  while (!(await checkPort(host, port))) {
    await sleep(CHECK_PORT_TIMEOUT)
  }
}
