import test from 'blue-tape'
import foxr from '../../src/api/foxr'
import { testWithFirefox } from '../helpers/firefox'

test('foxr: `connect()`', testWithFirefox(async (t) => {
  const browser = await foxr.connect()

  // TODO: check `browser` for real
  t.ok(browser, 'should connect')
}))
