import test from 'blue-tape'
import { createParseStream, parse, stringify } from '../src/transport'

test('transport: createParseStream', (t) => {
  t.true(
    typeof createParseStream === 'function',
    'is a function'
  )
  t.end()
})

test('transport: parse', (t) => {
  t.true(
    typeof parse === 'function',
    'is a function'
  )
  t.end()
})

test('transport: stringify', (t) => {
  t.true(
    typeof stringify === 'function',
    'is a function'
  )
  t.end()
})
