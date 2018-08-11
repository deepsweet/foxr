import { Socket } from 'net'

const checkForMarionette = (port: number, host: string) => {
  return new Promise((resolve, reject) => {
    const socket = new Socket()
    let isAvailablePort = false

    socket
      .setTimeout(200)
      .once('connect', () => {
        socket.once('data', () => {
          isAvailablePort = true

          socket.destroy()
        })
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
      .connect(port, host)
  })
}

const sleep = (timeout: number) => new Promise((resolve) => setTimeout(resolve, timeout))

export default async (port: number, host = 'localhost') => {
  while (!(await checkForMarionette(port, host))) {
    await sleep(100)
  }
}
