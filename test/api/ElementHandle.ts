import fs from 'fs'
import test from 'blue-tape'
import foxr from '../../src/'
import ElementHandle from '../../src/api/ElementHandle'
import { testWithFirefox } from '../helpers/firefox'
import { getSpyCalls, createSpy } from 'spyfn'
import { mock, unmock } from 'mocku'

test('ElementHandle `$()`', testWithFirefox(async (t) => {
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

  const element = await div.$('h1')

  t.true(
    element instanceof ElementHandle,
    'should return a single Element'
  )

  t.equal(
    element,
    await div.$('h1'),
    'should return the same element twice'
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

test('ElementHandle `$$()`', testWithFirefox(async (t) => {
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
    elements.length === 2 && elements.every((el) => el instanceof ElementHandle),
    'should return multiple Elements'
  )

  t.deepEqual(
    elements,
    await div.$$('h2'),
    'should return the same elements twice'
  )
}))

test('ElementHandle `focus()`', testWithFirefox(async (t) => {
  const browser = await foxr.connect()
  const page = await browser.newPage()

  await page.setContent('<input/>')

  const target = await page.$('input')

  if (target === null) {
    t.fail('There should be element')
    return
  }

  const activeElementBefore = await page.evaluate('document.activeElement.tagName')

  await target.focus()

  const activeElementAfter = await page.evaluate('document.activeElement.tagName')

  t.true(
    activeElementBefore !== activeElementAfter && activeElementAfter === 'INPUT',
    'should focus element'
  )
}))

test('ElementHandle `screenshot()`', testWithFirefox(async (t) => {
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
