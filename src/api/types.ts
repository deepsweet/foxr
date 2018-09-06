import { TJsonValue } from 'typeon'
import JSHandle from './JSHandle'
import ElementHandle from './ElementHandle'

export type TStringifiableFunction = (...args: Array<TJsonValue | Element>) => TJsonValue | Promise<TJsonValue> | void

export type TJSHandleId = {
  [key: string]: string,
  ELEMENT: string
}

export type TEvaluateArg = TJsonValue | JSHandle | ElementHandle

export type TEvaluateResult = {
  error: string | null,
  value: TJsonValue | void
}

export type TEvaluateHandleResult = {
  error: string | null,
  value: TJSHandleId | null
}

export type TEvaluateResults = {
  error: string | null,
  value: TJsonValue[] | void[]
}

export type TMouseButton = 'left' | 'middle' | 'right'

export type TClickOptions = {
  button?: TMouseButton,
  clickCount?: number
}
