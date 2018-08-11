import test from 'blue-tape'
import createBrowser from '../../src/api/browser'
import foxr from '../../src/api/foxr'
import { testWithFirefox } from '../helpers/firefox'
import { createSpy, getSpyCalls } from 'spyfn'

test('createBrowser', (t) => {
  t.true(
    typeof createBrowser === 'function',
    'is a function'
  )
  t.end()
})

test('browser: close + `disconnected` event', testWithFirefox(async (t) => {
  const browser = await foxr.connect()
  const onDisconnectSpy = createSpy(() => {})

  browser.once('disconnected', onDisconnectSpy)

  // TODO: figure out how to test this for real
  await browser.close()

  t.deepEqual(
    getSpyCalls(onDisconnectSpy),
    [[]],
    'should emit `disconnected` event'
  )
}))
