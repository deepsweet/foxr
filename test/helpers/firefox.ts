import execa from 'execa'
import { Test } from 'blue-tape'
import waitForMarionette from './wait-for-marionette'

export const runFirefox = () => execa('docker',
  'run -id --rm --shm-size 2g -p 2828:2828 --name foxr-firefox deepsweet/firefox-headless-remote:61'.split(' ')
)

export const stopFirefox = () => execa('docker',
  'stop --time 5 foxr-firefox'.split(' ')
)

export const testWithFirefox = (test: (t: Test) => Promise<void>) => async (t: Test) => {
  await runFirefox()
  await waitForMarionette(2828)

  try {
    await test(t)
  } finally {
    await stopFirefox()
  }
}
