import test from 'blue-tape'
import createPage from '../../src/api/page'
import foxr from '../../src/api/foxr'
import { testWithFirefox } from '../helpers/firefox'

test('createPage', (t) => {
  t.true(
    typeof createPage === 'function',
    'is a function'
  )
  t.end()
})

test('page: `setContent()` + `content()`', testWithFirefox(async (t) => {
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

test('page: `$()`', testWithFirefox(async (t) => {
  const browser = await foxr.connect()
  const page = await browser.newPage()

  await page.setContent('<h2>hello</h2><h2>world</h2>')

  t.equal(
    await page.$('h1'),
    null,
    'should return null if nothing has been found'
  )

  const element = await page.$('h2')

  t.equal(
    element !== null && typeof element.$,
    'function',
    'should return a single Element'
  )
}))

test('page: `$$()`', testWithFirefox(async (t) => {
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
    elements.length === 2,
    'should return multiple Elements'
  )

  t.equal(
    typeof elements[0].$,
    'function',
    'should return first Element'
  )

  t.equal(
    typeof elements[1].$,
    'function',
    'should return second Element'
  )
}))

test('page: `close()`', testWithFirefox(async (t) => {
  const browser = await foxr.connect()
  const page = await browser.newPage()

  await page.close()

  const pages = await browser.pages()

  t.equal(
    pages.length,
    1,
    'should close page'
  )
}))

test('page: `title()`', testWithFirefox(async (t) => {
  const browser = await foxr.connect()
  const page = await browser.newPage()

  await page.setContent('<title>hi</title>')

  const title = await page.title()

  t.equal(
    title,
    'hi',
    'should change page title'
  )
}))

test('page: `evaluate()`', testWithFirefox(async (t) => {
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
    // TODO: explicitly cast args to numbers
    await page.evaluate((x, y) => { return x + y }, 1, 2),
    3,
    'should evaluate functions with arguments'
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
    // TODO: explicitly cast args to numbers
    await page.evaluate((x, y) => Promise.resolve(x + y), 1, 2),
    3,
    'should evaluate functions with arguments that returns a resolved Promise'
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
