import { TJsonValue } from 'typeon'

export type TStringifiableFunction = (...args: TJsonValue[]) => TJsonValue | Promise<TJsonValue> | void

export type TEvaluateResult = {
  value: {
    error: string | null,
    value: TJsonValue
  }
}

export type TElementId = {
  [key: string]: string,
  ELEMENT: string
}

export type TElementResult = {
  value: TElementId
}

export type TElementsResult = TElementId[]

export type TStringResult = {
  value: string
}
