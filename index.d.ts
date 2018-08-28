import * as React from 'react'

export interface FetchRequestProps {
  url: string
  options?: RequestInit
}

export interface FetchUpdateOptions {
  ignorePreviousData: boolean;
}

export interface FetchResult<TData> {
  data?: TData
  loading: boolean | null
  error?: Error
  request: FetchRequestProps
  response: Response
  fetch(url: string, options?: RequestInit, updateOptions?: Partial<FetchUpdateOptions>): void;
  clearData(): void;
}

export type BodyMethods = 'arrayBuffer' | 'blob' | 'formData' | 'json' | 'text'

export interface FetchProps<TData> {
  url: string
  options?: RequestInit | (() => RequestInit)
  manual?: boolean
  cache?: boolean | object
  as?:
    | 'auto'
    | BodyMethods
    | ((response: TData) => void)
    | { [type: string]: (res: TData) => Promise<any> }
  fetchFunction?: (url: string, options: RequestInit) => Promise<any>
  onDataChange?: (newData: TData, data: TData) => any
  onChange?: (result: FetchResult<TData>) => void
  children: (result: FetchResult<TData>) => React.ReactNode | React.ReactNode
}

export default class Fetch<TData = any> extends React.Component<
  FetchProps<TData>
> {
  // Passing any to FetchResult as unable to use TData
  static Consumer: React.Consumer<FetchResult<any>>
}
