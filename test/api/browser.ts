import test from 'blue-tape'
import createBrowser from '../../src/api/browser'

test('browser: createBrowser', (t) => {
  t.true(
    typeof createBrowser === 'function',
    'is a function'
  )
  t.end()
})
