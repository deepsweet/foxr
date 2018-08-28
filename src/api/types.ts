import { TJsonValue } from 'typeon'

export type TStringifiableFunction = (...args: TJsonValue[]) => TJsonValue | Promise<TJsonValue> | void

export type TJSHandleId = {
  [key: string]: string,
  ELEMENT: string
}

export type TEvaluateResult = {
  value: {
    error: string | null,
    value: TJsonValue | void
  }
}

export type TEvaluateHandleResult = {
  value: {
    error: string | null,
    value: TJSHandleId | null
  }
}

export type TEvaluateResults = {
  value: {
    error: string | null,
    value: TJsonValue[] | void[]
  }
}

export type TElementHandleResult = {
  value: TJSHandleId
}

export type TElementHandlesResult = TJSHandleId[]

export type TStringResult = {
  value: string
}