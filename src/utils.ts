import { writeFile } from 'fs'
import { promisify } from 'util'

export const pWriteFile = promisify(writeFile)
