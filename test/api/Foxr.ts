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
