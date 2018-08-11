import test from 'blue-tape'
import createElement from '../../src/api/element'

test('element: createElement', (t) => {
  t.true(
    typeof createElement === 'function',
    'is a function'
  )
  t.end()
})
