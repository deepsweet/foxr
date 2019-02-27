import execa from 'execa'
import { Test } from 'blue-tape'
import waitForMarionette from './wait-for-marionette'
import { join } from 'path'

const localExtPath = join(process.cwd(), 'test', 'extension')
export const containerExtPath = '/home/firefox/extension'

export const runFirefox = () => execa('docker',
  `run -v ${localExtPath}:${containerExtPath} -id --rm --shm-size 2g -p 2828:2828 --name foxr-firefox deepsweet/firefox-headless-remote:63`.split(' ')
)

export const stopFirefox = () => execa('docker',
  'stop --time 5 foxr-firefox'.split(' '),
  { reject: false }
)

export const testWithFirefox = (test: (t: Test) => Promise<void>) => async (t: Test) => {
  try {
    // await stopFirefox()
    await runFirefox()
    await waitForMarionette(2828)
    await test(t)
  } finally {
    await stopFirefox()
  }
}
