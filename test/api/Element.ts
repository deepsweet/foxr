import fs from 'fs'
import test from 'blue-tape'
import foxr from '../../src/'
import Element from '../../src/api/Element'
import { testWithFirefox } from '../helpers/firefox'
import { getSpyCalls, createSpy } from 'spyfn'
import { mock, unmock } from 'mocku'

test('Element: `$()`', testWithFirefox(async (t) => {
  const browser = await foxr.connect()
  const page = await browser.newPage()

  await page.setContent('<div><h1>hello</h1></div>')

  const div = await page.$('div')

  if (div === null) {
    t.fail('There should be div')
    return
  }

  t.equal(
    await div.$('h2'),
    null,
    'should return null if nothing has been found'
  )

  t.true(
    (await div.$('h1')) instanceof Element,
    'should return a single Element'
  )

  try {
    await div.$('(')
    t.fail()
  } catch (err) {
    t.true(
      err.message.startsWith('Given css selector expression'),
      'should throw'
    )
  }
}))

test('Element: `$$()`', testWithFirefox(async (t) => {
  const browser = await foxr.connect()
  const page = await browser.newPage()

  await page.setContent('<div><h2>hello</h2><h2>world</h2></div>')

  const div = await page.$('div')

  if (div === null) {
    t.fail('There should be div')
    return
  }

  t.deepEqual(
    await div.$$('h1'),
    [],
    'should return empty array if nothing has been found'
  )

  const elements = await div.$$('h2')

  t.true(
    elements.length === 2 && elements.every((el) => el instanceof Element),
    'should return multiple Elements'
  )
}))

test('Element: `screenshot()`', testWithFirefox(async (t) => {
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

  await page.setContent('<div><h1>hello</h1></div>')

  const div = await page.$('div')

  if (div === null) {
    t.fail('There should be div')
    return
  }

  const screenshot1 = await div.screenshot()

  t.true(
    Buffer.isBuffer(screenshot1) && screenshot1.length > 0,
    'should return non-empty Buffer'
  )

  const screenshot2 = await div.screenshot({ path: 'test.png' })
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
