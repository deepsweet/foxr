import test from 'blue-tape'
import foxr from '../../src/api/foxr'
import { testWithFirefox } from '../helpers/firefox'
import { createSpy, getSpyCalls } from 'spyfn'

test('browser: `close()` + `disconnected` event', testWithFirefox(async (t) => {
  const browser = await foxr.connect()
  const onDisconnectSpy = createSpy(() => {})

  browser.on('disconnected', onDisconnectSpy)

  // TODO: figure out how to test this for real
  await browser.close()

  t.deepEqual(
    getSpyCalls(onDisconnectSpy),
    [[]],
    'should emit `disconnected` event'
  )
}))

test('browser: multiple sessions + `disconnect()` + `disconnected` events', testWithFirefox(async (t) => {
  const browser1 = await foxr.connect()
  const onDisconnectSpy1 = createSpy(() => {})

  browser1.on('disconnected', onDisconnectSpy1)

  // TODO: figure out how to test this for real
  await browser1.disconnect()

  const browser2 = await foxr.connect()
  const onDisconnectSpy2 = createSpy(() => {})

  browser2.on('disconnected', onDisconnectSpy2)

  await browser2.disconnect()

  t.deepEqual(
    getSpyCalls(onDisconnectSpy1),
    [[]],
    'should emit `disconnected` event from the 1st session'
  )

  t.deepEqual(
    getSpyCalls(onDisconnectSpy2),
    [[]],
    'should emit `disconnected` event from the 2nd session'
  )
}))

test('browser: `pages()`', testWithFirefox(async (t) => {
  const browser = await foxr.connect()
  const pages = await browser.pages()

  t.equal(
    typeof pages[0].$,
    'function',
    'should return array of Pages'
  )
}))

test('browser: `newPage()`', testWithFirefox(async (t) => {
  const browser = await foxr.connect()
  const pagesBefore = await browser.pages()

  const page1 = await browser.newPage()
  const page2 = await browser.newPage()

  const pagesAfter = await browser.pages()

  t.equal(
    pagesBefore.length + 2,
    pagesAfter.length,
    'should create 2 pages'
  )

  t.equal(
    typeof page1.$,
    'function',
    'should create real page 1'
  )

  t.equal(
    typeof page2.$,
    'function',
    'should create real page 2'
  )
}))
