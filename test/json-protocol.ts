import test from 'blue-tape'
import { createParseStream, parse, stringify } from '../src/json-protocol'

test('json-protocol: createParseStream', (t) => {
  t.ok(
    createParseStream,
    'test me'
  )
  t.end()
})

test('json-protocol: parse', (t) => {
  t.ok(
    parse,
    'test me'
  )
  t.end()
})

test('json-protocol: stringify', (t) => {
  t.ok(
    stringify,
    'test me'
  )
  t.end()
})
