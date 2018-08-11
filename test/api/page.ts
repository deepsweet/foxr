import test from 'blue-tape'
import createPage from '../../src/api/page'

test('page: createPage', (t) => {
  t.true(
    typeof createPage === 'function',
    'is a function'
  )
  t.end()
})
