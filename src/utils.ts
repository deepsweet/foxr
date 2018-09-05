import { writeFile } from 'fs'
import { promisify } from 'util'

export const pWriteFile = promisify(writeFile)

export const MOUSE_BUTTON = {
  left: 0,
  middle: 1,
  right: 2
}
