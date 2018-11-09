import Foxr from './api/Foxr'
import Browser from './api/Browser'
import Page from './api/Page'
import JSHandle from './api/JSHandle'
import ElementHandle from './api/ElementHandle'

export default new Foxr()

export type TBrowser = Browser
export type TPage = Page
export type TJSHandle = JSHandle
export type TElementHandle = ElementHandle
