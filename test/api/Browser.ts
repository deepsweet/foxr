import test from 'blue-tape'
import foxr from '../../src/'
import Page from '../../src/api/Page'
import { testWithFirefox, stopFirefox, containerExtPath } from '../helpers/firefox'
import { createSpy, getSpyCalls } from 'spyfn'

test('Browser: `close()` + `disconnected` event', testWithFirefox(async (t) => {
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

test('Browser: socket close + `disconnected` event', testWithFirefox(async (t) => {
  const browser = await foxr.connect()
  const onDisconnectSpy = createSpy(() => {})

  browser.on('disconnected', onDisconnectSpy)

  await stopFirefox()

  t.deepEqual(
    getSpyCalls(onDisconnectSpy),
    [[]],
    'should emit `disconnected` event'
  )
}))

test('Browser: multiple sessions + `disconnect()` + `disconnected` events', testWithFirefox(async (t) => {
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

test('Browser: `newPage()`', testWithFirefox(async (t) => {
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

  t.true(
    page1 instanceof Page,
    'should create real page 1'
  )

  t.true(
    page2 instanceof Page,
    'should create real page 2'
  )
}))

test('Browser: `pages()`', testWithFirefox(async (t) => {
  const browser = await foxr.connect()
  const pages = await browser.pages()

  t.true(
    pages.every((page) => page instanceof Page),
    'should return array of pages'
  )

  t.deepEqual(
    pages,
    await browser.pages(),
    'should return the same pages twice'
  )
}))

test('Browser: `install()` + `uninstall()`', testWithFirefox(async (t) => {
  const browser = await foxr.connect()
  const id = await browser.install(containerExtPath, true)

  t.true(
    typeof id === 'string' && id !== '',
    'should install test extension'
  )

  if (id === null) {
    return t.fail('unable to install test extension')
  }

  try {
    await browser.install('impossible_path', true)
    t.fail()
  } catch (err) {
    t.pass('should fail to install invalid extension')
  }

  try {
    await browser.uninstall(id)
    t.pass('should uninstall test extension')
  } catch (err) {
    t.fail(err)
  }

  try {
    await browser.uninstall(id)
    t.fail()
  } catch (err) {
    t.true(
      err.message.includes('candidate is null'),
      'should fail to uninstall already uninstalled test extension'
    )
  }
}))
