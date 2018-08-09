import * as React from 'react'

export interface RequestProps {
  cache: 'default' | 'reload' | 'no-cache'
  credentials: 'omit' | 'same-origin' | 'include'
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  mode: 'cors' | 'no-cors' | 'same-origin' | 'navigate'
  redirect: 'follow' | 'error' | 'manual'
  referrer: 'client' | 'no-referrer' | string
  referrerPolicy:
    | 'no-referrer'
    | 'no-referrer-when-downgrade'
    | 'origin'
    | 'origin-when-cross-origin'
    | 'same-origin'
    | 'strict-origin'
    | 'strict-origin-when-cross-origin'
    | 'unsafe-url'
  url: string
}

export interface Request {
  url: string
  options?: Partial<RequestProps>
}

export interface FetchResult<TData> {
  data?: TData
  loading: boolean | null
  error?: Error
  request: Request
}

export type BodyMethods = 'arrayBuffer' | 'blob' | 'formData' | 'json' | 'text'

export interface FetchProps<TData> {
  url: string
  options?: Partial<RequestProps> | (() => Partial<RequestProps>)
  manual?: boolean
  cache?: boolean | object
  as?:
    | 'auto'
    | BodyMethods
    | ((response) => void)
    | { [type: string]: (res) => Promise<any> }
  fetchFunction?: (url: string, options: object) => Promise<any>
  onDataChange?: (newData, data) => any
  onChange?: (result: FetchResult<TData>) => void
  children: (result: FetchResult<TData>) => React.ReactNode | React.ReactNode
}

export default class Fetch<TData = any> extends React.Component<
  FetchProps<TData>
> {
  // Passing any to FetchResult as unable to use TData
  static Consumer: React.Consumer<FetchResult<any>>
}
