import test from 'blue-tape'
import connectToMarionette from '../src/protocol'

test('protocol: connectToMarionette', (t) => {
  t.true(
    typeof connectToMarionette === 'function',
    'is a function'
  )
  t.end()
})
