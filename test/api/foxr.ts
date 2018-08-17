import test from 'blue-tape'
import foxr from '../../src/api/foxr'
import Browser from '../../src/api/Browser'
import { testWithFirefox } from '../helpers/firefox'

test('foxr: `connect()`', testWithFirefox(async (t) => {
  const browser = await foxr.connect()

  t.true(
    browser instanceof Browser,
    'should return `browser`'
  )
}))
