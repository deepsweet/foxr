import fs from 'fs'
import test from 'blue-tape'
import { mock, unmock } from 'mocku'
import { createSpy, getSpyCalls } from 'spyfn'
import foxr from '../../src/'
import ElementHandle from '../../src/api/ElementHandle'
import { testWithFirefox } from '../helpers/firefox'
import JSHandle from '../../src/api/JSHandle'

test('Page: `close` event on browser close', testWithFirefox(async (t) => {
  const browser = await foxr.connect()
  const page = await browser.newPage()
  const onCloseSpy = createSpy(() => {})

  page.on('close', onCloseSpy)

  await browser.close()

  t.deepEqual(
    getSpyCalls(onCloseSpy),
    [[]],
    'should emit `close` event'
  )
}))

test('Page: `close` event on browser disconnect', testWithFirefox(async (t) => {
  const browser = await foxr.connect()
  const page = await browser.newPage()
  const onCloseSpy = createSpy(() => {})

  page.on('close', onCloseSpy)

  await browser.disconnect()

  t.deepEqual(
    getSpyCalls(onCloseSpy),
    [[]],
    'should emit `close` event'
  )
}))

test('Page: `$()`', testWithFirefox(async (t) => {
  const browser = await foxr.connect()
  const page = await browser.newPage()

  await page.setContent('<h2>hello</h2><h2>world</h2>')

  t.equal(
    await page.$('h1'),
    null,
    'should return null if nothing has been found'
  )

  const element = await page.$('h2')

  t.true(
    element !== null && element instanceof ElementHandle,
    'should return a single Element'
  )

  t.equal(
    element,
    await await page.$('h2'),
    'should return the same element twice'
  )

  try {
    await page.$('(')
    t.fail()
  } catch (err) {
    t.true(
      err.message.startsWith('Given css selector expression'),
      'should throw'
    )
  }
}))

test('Page: `$$()`', testWithFirefox(async (t) => {
  const browser = await foxr.connect()
  const page = await browser.newPage()

  await page.setContent('<h2>hello</h2><h2>world</h2>')

  t.deepEqual(
    await page.$$('h1'),
    [],
    'should return empty array if nothing has been found'
  )

  const elements = await page.$$('h2')

  t.true(
    elements.length === 2 && elements.every((el) => el instanceof ElementHandle),
    'should return multiple Elements'
  )

  t.deepEqual(
    elements,
    await page.$$('h2'),
    'should return the same elements twice'
  )
}))

test('Page: `$eval()`', testWithFirefox(async (t) => {
  const browser = await foxr.connect()
  const page = await browser.newPage()

  await page.setContent('<h1>hi</h1>')

  t.equal(
    // @ts-ignore
    await page.$eval('h1', (el) => el.tagName),
    'H1',
    'should evaluate function without arguments'
  )

  t.equal(
    // @ts-ignore
    await page.$eval('h1', (el, foo, bar) => `${el.tagName}-${foo}-${bar}`, 'foo', 'bar'),
    'H1-foo-bar',
    'should evaluate function with arguments'
  )

  const bodyJSHandle = await page.evaluateHandle('document.body')
  const bodyElementHandle = await page.$('body')

  t.equal(
    // @ts-ignore
    await page.$eval('h1', (el, handle) => `${el.tagName}-${handle.tagName}`, bodyJSHandle),
    'H1-BODY',
    'should evaluate function with arguments as JSHandle'
  )

  t.equal(
    // @ts-ignore
    await page.$eval('h1', (el, handle) => `${el.tagName}-${handle.tagName}`, bodyElementHandle),
    'H1-BODY',
    'should evaluate function with arguments as ElementHandle'
  )

  try {
    await page.$eval('h1', () => { throw new Error('oops') })
    t.fail()
  } catch (err) {
    t.equal(
      err.message,
      'Evaluation failed: oops',
      'should evaluate functions that throws'
    )
  }

  t.equal(
    // @ts-ignore
    await page.$eval('h1', (el) => Promise.resolve(el.tagName)),
    'H1',
    'should evaluate function that returns a resolved Promise'
  )

  t.equal(
    // @ts-ignore
    await page.$eval('h1', (el, foo, bar) => Promise.resolve(`${el.tagName}-${foo}-${bar}`), 'foo', 'bar'),
    'H1-foo-bar',
    'should evaluate function with arguments that returns a resolved Promise'
  )

  t.equal(
    // @ts-ignore
    await page.$eval('h1', (el, handle) => Promise.resolve(`${el.tagName}-${handle.tagName}`), bodyJSHandle),
    'H1-BODY',
    'should evaluate function with arguments as JSHandle that returns a resolved Promise'
  )

  t.equal(
    // @ts-ignore
    await page.$eval('h1', (el, handle) => Promise.resolve(`${el.tagName}-${handle.tagName}`), bodyElementHandle),
    'H1-BODY',
    'should evaluate function with arguments as ElementHandle that returns a resolved Promise'
  )

  try {
    await page.$eval('h1', () => Promise.reject(new Error('oops')))
    t.fail()
  } catch (err) {
    t.equal(
      err.message,
      'Evaluation failed: oops',
      'should evaluate functions that returns a rejected Promise'
    )
  }

  try {
    // @ts-ignore
    await page.$eval('h2', (el) => el.tagName)
    t.fail()
  } catch (err) {
    t.equal(
      err.message,
      'Evaluation failed: unable to find element',
      'should throw if there is no such an element'
    )
  }
}))

test('Page: `$$eval()`', testWithFirefox(async (t) => {
  const browser = await foxr.connect()
  const page = await browser.newPage()

  await page.setContent('<div><h2>hi</h2><h2>hello</h2></div>')

  t.deepEqual(
    // @ts-ignore
    await page.$$eval('h2', (el) => el.textContent),
    ['hi', 'hello'],
    'should evaluate function without arguments'
  )

  t.deepEqual(
    // @ts-ignore
    await page.$$eval('h2', (el, foo, bar) => `${el.textContent}-${foo}-${bar}`, 'foo', 'bar'),
    ['hi-foo-bar', 'hello-foo-bar'],
    'should evaluate function with arguments'
  )

  const bodyJSHandle = await page.evaluateHandle('document.body')
  const bodyElementHandle = await page.$('body')

  t.deepEqual(
    // @ts-ignore
    await page.$$eval('h2', (el, handle) => `${el.textContent}-${handle.tagName}`, bodyJSHandle),
    ['hi-BODY', 'hello-BODY'],
    'should evaluate function with JSHandle as arguments'
  )

  t.deepEqual(
    // @ts-ignore
    await page.$$eval('h2', (el, handle) => `${el.textContent}-${handle.tagName}`, bodyElementHandle),
    ['hi-BODY', 'hello-BODY'],
    'should evaluate function with ElementHandle as arguments'
  )

  try {
    await page.$$eval('h2', () => { throw new Error('oops') })
    t.fail()
  } catch (err) {
    t.equal(
      err.message,
      'Evaluation failed: oops',
      'should evaluate functions that throws'
    )
  }

  t.deepEqual(
    // @ts-ignore
    await page.$$eval('h2', (el) => Promise.resolve(el.textContent)),
    ['hi', 'hello'],
    'should evaluate function that returns a resolved Promise'
  )

  t.deepEqual(
    // @ts-ignore
    await page.$$eval('h2', (el, foo, bar) => Promise.resolve(`${el.textContent}-${foo}-${bar}`), 'foo', 'bar'),
    ['hi-foo-bar', 'hello-foo-bar'],
    'should evaluate function with arguments that returns a resolved Promise'
  )

  t.deepEqual(
    // @ts-ignore
    await page.$$eval('h2', (el, handle) => Promise.resolve(`${el.textContent}-${handle.tagName}`), bodyJSHandle),
    ['hi-BODY', 'hello-BODY'],
    'should evaluate function with JSHandle as arguments that returns a resolved Promise'
  )

  t.deepEqual(
    // @ts-ignore
    await page.$$eval('h2', (el, handle) => Promise.resolve(`${el.textContent}-${handle.tagName}`), bodyElementHandle),
    ['hi-BODY', 'hello-BODY'],
    'should evaluate function with ElementHandle as arguments that returns a resolved Promise'
  )

  try {
    await page.$$eval('h2', () => Promise.reject(new Error('oops')))
    t.fail()
  } catch (err) {
    t.equal(
      err.message,
      'Evaluation failed: oops',
      'should evaluate functions that returns a rejected Promise'
    )
  }

  t.deepEqual(
    // @ts-ignore
    await page.$$eval('h1', (el) => el.textContent),
    [],
    'should return an emptry array if nothing has been found'
  )
}))

test('Page: `bringToFront()`', testWithFirefox(async (t) => {
  const browser = await foxr.connect()

  const page1 = await browser.newPage()
  await page1.setContent('<title>page1</title>')

  const page2 = await browser.newPage()
  await page2.setContent('<title>page2</title>')

  t.equal(
    await page1.title(),
    'page2',
    'should perform actions only with current page'
  )

  await page1.bringToFront()

  t.equal(
    await page1.title(),
    'page1',
    'should activate page'
  )
}))

test('Page: `browser()`', testWithFirefox(async (t) => {
  const browser = await foxr.connect()
  const page = await browser.newPage()

  t.strictEqual(
    browser,
    page.browser(),
    'should return an underlying browser instance'
  )
}))

test('Page: `close()` + `close` event', testWithFirefox(async (t) => {
  const browser = await foxr.connect()
  const page = await browser.newPage()
  const onCloseSpy = createSpy(() => {})

  page.on('close', onCloseSpy)

  await page.close()

  const pages = await browser.pages()

  t.equal(
    pages.length,
    1,
    'should close page'
  )

  t.deepEqual(
    getSpyCalls(onCloseSpy),
    [[]],
    'should emit `close` event'
  )
}))

test('Page: `setContent()` + `content()`', testWithFirefox(async (t) => {
  const browser = await foxr.connect()
  const page = await browser.newPage()
  const html = '<h1>hello</h1>'

  t.equal(
    await page.content(),
    '<html><head></head><body></body></html>',
    'content() should return page HTML'
  )

  await page.setContent(html)

  t.equal(
    await page.content(),
    `<html><head></head><body>${html}</body></html>`,
    'setContent() should set page HTML'
  )
}))

test('Page: `evaluate()`', testWithFirefox(async (t) => {
  const browser = await foxr.connect()
  const page = await browser.newPage()

  t.equal(
    await page.evaluate('2 + 2'),
    4,
    'should evaluate strings'
  )

  try {
    await page.evaluate('{ throw 123 }')
    t.fail()
  } catch (err) {
    t.equal(
      err.message,
      'Evaluation failed: 123',
      'should evaluate strings that throws'
    )
  }

  t.equal(
    await page.evaluate('Promise.resolve(2 + 2)'),
    4,
    'should evaluate resolved Promises as string'
  )

  try {
    await page.evaluate('Promise.reject(123)')
    t.fail()
  } catch (err) {
    t.equal(
      err.message,
      'Evaluation failed: 123',
      'should evaluate rejected Promises as string'
    )
  }

  t.equal(
    await page.evaluate(() => 1 + 2),
    3,
    'should evaluate functions without arguments'
  )

  t.equal(
    // @ts-ignore
    await page.evaluate((x, y) => { return x + y }, 1, 2),
    3,
    'should evaluate functions with arguments'
  )

  const bodyJSHandle = await page.evaluateHandle('document.body')
  const bodyElementHandle = await page.$('body')

  t.equal(
    // @ts-ignore
    await page.evaluate((handle) => handle.tagName, bodyJSHandle),
    'BODY',
    'should evaluate functions with JSHandle as arguments'
  )

  t.equal(
    // @ts-ignore
    await page.evaluate((handle) => handle.tagName, bodyElementHandle),
    'BODY',
    'should evaluate functions with ElementHandle as arguments'
  )

  try {
    await page.evaluate(() => { throw new Error('oops') })
    t.fail()
  } catch (err) {
    t.equal(
      err.message,
      'Evaluation failed: oops',
      'should evaluate functions that throws'
    )
  }

  t.equal(
    // @ts-ignore
    await page.evaluate((x, y) => Promise.resolve(x + y), 1, 2),
    3,
    'should evaluate functions with arguments that returns a resolved Promise'
  )

  t.equal(
    // @ts-ignore
    await page.evaluate((handle) => Promise.resolve(handle.tagName), bodyJSHandle),
    'BODY',
    'should evaluate functions with JSHandle as arguments that returns a resolved Promise'
  )

  t.equal(
    // @ts-ignore
    await page.evaluate((handle) => Promise.resolve(handle.tagName), bodyElementHandle),
    'BODY',
    'should evaluate functions with ElementHandle as arguments that returns a resolved Promise'
  )

  try {
    await page.evaluate(() => Promise.reject(new Error('oops')))
    t.fail()
  } catch (err) {
    t.equal(
      err.message,
      'Evaluation failed: oops',
      'should evaluate functions that returns a rejected Promise'
    )
  }
}))

test('Page: `evaluateHandle()`', testWithFirefox(async (t) => {
  const browser = await foxr.connect()
  const page = await browser.newPage()

  t.true(
    (await page.evaluateHandle('document.body')) instanceof JSHandle,
    'should evaluate strings'
  )

  try {
    await page.evaluateHandle('{ throw 123 }')
    t.fail()
  } catch (err) {
    t.equal(
      err.message,
      'Evaluation failed: 123',
      'should evaluate strings that throws'
    )
  }

  try {
    await page.evaluateHandle('window._foo_')
    t.fail()
  } catch (err) {
    t.equal(
      err.message,
      'Unable to get a JSHandle',
      'should throw if no JSHandle has been returned from string'
    )
  }

  t.true(
    (await page.evaluateHandle('Promise.resolve(document.body)')) instanceof JSHandle,
    'should evaluate resolved Promises as string'
  )

  try {
    await page.evaluateHandle('Promise.reject(123)')
    t.fail()
  } catch (err) {
    t.equal(
      err.message,
      'Evaluation failed: 123',
      'should evaluate rejected Promises as string'
    )
  }

  t.true(
    // @ts-ignore
    (await page.evaluateHandle(() => document.body)) instanceof JSHandle,
    'should evaluate functions without arguments'
  )

  t.true(
    // @ts-ignore
    (await page.evaluateHandle((prop) => document[prop], 'body')) instanceof JSHandle,
    'should evaluate functions with arguments'
  )

  const bodyJSHandle = await page.evaluateHandle('document.body')
  const bodyElementHandle = await page.$('body')

  t.true(
    // @ts-ignore
    (await page.evaluateHandle((handle) => handle, bodyJSHandle)) instanceof JSHandle,
    'should evaluate functions with JSHandle as arguments'
  )

  t.true(
    // @ts-ignore
    (await page.evaluateHandle((handle) => handle, bodyElementHandle)) instanceof JSHandle,
    'should evaluate functions with ElementHandle as arguments'
  )

  try {
    // @ts-ignore
    await page.evaluateHandle(() => window.__foo_)
    t.fail()
  } catch (err) {
    t.equal(
      err.message,
      'Unable to get a JSHandle',
      'should throw if no JSHandle has been returned from function'
    )
  }

  try {
    await page.evaluateHandle(() => { throw new Error('oops') })
    t.fail()
  } catch (err) {
    t.equal(
      err.message,
      'Evaluation failed: oops',
      'should evaluate functions that throws'
    )
  }

  t.true(
    // @ts-ignore
    (await page.evaluateHandle((prop) => Promise.resolve(document[prop]), 'body')) instanceof JSHandle,
    'should evaluate functions with arguments that returns a resolved Promise'
  )

  try {
    // @ts-ignore
    await page.evaluateHandle(() => Promise.resolve(window.__foo_))
    t.fail()
  } catch (err) {
    t.equal(
      err.message,
      'Unable to get a JSHandle',
      'should throw if no JSHandle has been returned from function that returns a resolve Promise'
    )
  }

  t.true(
    // @ts-ignore
    (await page.evaluateHandle((handle) => Promise.resolve(handle), bodyJSHandle)) instanceof JSHandle,
    'should evaluate functions with JSHandle arguments that returns a resolved Promise'
  )

  t.true(
    // @ts-ignore
    (await page.evaluateHandle((handle) => Promise.resolve(handle), bodyElementHandle)) instanceof JSHandle,
    'should evaluate functions with ElementHandle arguments that returns a resolved Promise'
  )

  try {
    await page.evaluateHandle(() => Promise.reject(new Error('oops')))
    t.fail()
  } catch (err) {
    t.equal(
      err.message,
      'Evaluation failed: oops',
      'should evaluate functions that returns a rejected Promise'
    )
  }
}))

test('Page: `focus()`', testWithFirefox(async (t) => {
  const browser = await foxr.connect()
  const page = await browser.newPage()

  await page.setContent('<div><input/><svg></svg></div>')

  const activeElementBefore = await page.evaluate('document.activeElement.tagName')

  await page.focus('input')

  const activeElementAfter = await page.evaluate('document.activeElement.tagName')

  t.true(
    activeElementBefore !== activeElementAfter && activeElementAfter === 'INPUT',
    'should focus element'
  )

  try {
    await page.focus('foo')
    t.fail()
  } catch (err) {
    t.equal(
      err.message,
      'Evaluation failed: unable to find element',
      'should throw if there is no such an element'
    )
  }

  try {
    await page.focus('svg')
    t.fail()
  } catch (err) {
    t.equal(
      err.message,
      'Evaluation failed: Found element is not HTMLElement and not focusable',
      'should throw if found element is not focusable'
    )
  }
}))

test('Page: `goto()` + `url()`', testWithFirefox(async (t) => {
  const browser = await foxr.connect()
  const page = await browser.newPage()

  await page.goto('data:text/html,<title>hi</title>')

  t.equal(
    await page.url(),
    'data:text/html,<title>hi</title>',
    'should change page url'
  )

  await page.goto('data:text/html,<title>hello</title>')

  t.equal(
    await page.url(),
    'data:text/html,<title>hello</title>',
    'should change page url again'
  )
}))

test('Page: `screenshot()`', testWithFirefox(async (t) => {
  const writeFileSpy = createSpy(({ args }) => args[args.length - 1](null))

  mock('../../src/', {
    fs: {
      ...fs,
      writeFile: writeFileSpy
    }
  })

  const { default: foxr } = await import('../../src/')
  const browser = await foxr.connect()
  const page = await browser.newPage()

  await page.setContent('<h1>hello</h1>')

  const screenshot1 = await page.screenshot()

  t.true(
    Buffer.isBuffer(screenshot1) && screenshot1.length > 0,
    'should return non-empty Buffer'
  )

  const screenshot2 = await page.screenshot({ path: 'test.png' })
  const spyArgs = getSpyCalls(writeFileSpy)[0]

  t.equal(
    spyArgs[0],
    'test.png',
    'path: should handle `path` option'
  )

  t.true(
    Buffer.isBuffer(spyArgs[1]) && spyArgs[1].length > 0,
    'path: should write screenshot to file'
  )

  t.true(
    Buffer.isBuffer(screenshot2) && screenshot2.length > 0,
    'path: should return non-empty buffer'
  )

  unmock('../../src/')
}))

test('Page: `setViewport()` + `viewport()`', testWithFirefox(async (t) => {
  const browser = await foxr.connect()
  const page = await browser.newPage()

  const { width: widthBefore, height: heightBefore } = await page.viewport()

  await page.setViewport({ width: 501, height: 502 })

  const { width: widthAfter, height: heightAfter } = await page.viewport()

  t.true(
    widthBefore !== widthAfter && widthAfter === 501,
    'should change width'
  )

  t.true(
    heightBefore !== heightAfter && heightAfter === 502,
    'should change height'
  )
}))

test('Page: `title()`', testWithFirefox(async (t) => {
  const browser = await foxr.connect()
  const page = await browser.newPage()

  await page.setContent('<title>hi</title>')

  const title = await page.title()

  t.equal(
    title,
    'hi',
    'should get page title'
  )
}))
