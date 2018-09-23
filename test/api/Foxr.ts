import test from 'blue-tape'
import Foxr from '../../src/api/Foxr'
import Browser from '../../src/api/Browser'
import { testWithFirefox } from '../helpers/firefox'

test('Foxr: `connect()`', testWithFirefox(async (t) => {
  const foxr = new Foxr()
  const browser = await foxr.connect()

  t.true(
    browser instanceof Browser,
    'should return `browser`'
  )
}))

test.skip('Foxr: `launch()`', async (t) => {
  // TODO: download Firefox for real
  const firefoxPath = '/Applications/Firefox.app/Contents/MacOS/firefox'

  const foxr = new Foxr()

  const browser1 = await foxr.launch({
    executablePath: firefoxPath
  })

  t.true(
    browser1 instanceof Browser,
    'should return `browser`'
  )

  await browser1.close()

  try {
    // @ts-ignore
    await foxr.launch()
    t.fail('should not get here')
  } catch (err) {
    t.equal(
      err.message,
      '`executablePath` option is required, Foxr doesn\'t download Firefox automatically',
      'should throw if there is no `executablePath` option'
    )
  }
})
