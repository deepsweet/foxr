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
