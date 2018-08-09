import { TJsonMap, TJsonValue } from 'typeon'

import { createParseStream, stringify } from './transport'

type TResult = [number, number, null | Error, TJsonValue]

export type TSend = (name: string, params?: TJsonMap) => Promise<any>

export const handleStream = (socket: NodeJS.Socket): TSend => {
  type TQueueItem = {
    id: number,
    resolve: (arg: any) => void,
    reject: (error: any) => void
  }
  let globalId = 0
  let queue: TQueueItem[] = []
  const parseStream = createParseStream()

  parseStream.on('data', (data: TResult) => {
    const [type, id, error, result] = data

    if (type === 1) {
      queue = queue.filter((item) => {
        if (item.id === id) {
          if (error !== null) {
            item.reject(error)
          } else {
            item.resolve(result)
          }

          return false
        }

        return true
      })
    }
  })

  socket.pipe(parseStream)

  return (name, params = {}) => {
    return new Promise((resolve, reject) => {
      const data: string = stringify([0, globalId, name, params])

      socket.write(data, 'utf8', () => {
        queue.push({ id: globalId, resolve, reject })
        globalId += 1
      })
    })
  }
}
