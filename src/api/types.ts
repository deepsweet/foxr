import { TJsonValue } from 'typeon'

export type TStringifiableFunction = (...args: TJsonValue[]) => TJsonValue | Promise<TJsonValue> | void

export type TEvaluateResult = {
  value: {
    error: string | null,
    value: TJsonValue
  }
}

export type TJSHandleId = {
  [key: string]: string,
  ELEMENT: string
}

export type TElementHandleResult = {
  value: TJSHandleId
}

export type TElementHandlesResult = TJSHandleId[]

export type TStringResult = {
  value: string
}
