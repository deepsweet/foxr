import { writeFile } from 'fs'
import { promisify } from 'util'
import { TEvaluateArg } from './api/types'
import JSHandle from './api/JSHandle'

export const pWriteFile = promisify(writeFile)

export const MOUSE_BUTTON = {
  left: 0,
  middle: 1,
  right: 2
}

export const mapEvaluateArgs = (args: TEvaluateArg[]) => args.map((arg) => {
  if (arg instanceof JSHandle) {
    return arg._id
  }

  return arg
})

// ESLint fails to parse this written as arrow function
function hasKey <T> (obj: T, key: any): key is keyof T {
  return key in obj
}

export { hasKey }
