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

test('page: `setContent` + `content`', testWithFirefox(async (t) => {
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
