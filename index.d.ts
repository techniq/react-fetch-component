import * as React from 'react';

export interface FetchRequestProps {
  url: string;
  options?: RequestInit;
}

export interface FetchUpdateOptions {
  ignorePreviousData: boolean;
}

export interface FetchResult<TData = any, TError = Error> {
  data?: TData;
  loading: boolean | null;
  error?: TError;
  request: FetchRequestProps;
  response: Response;
  fetch(
    url?: string | null,
    options?: RequestInit,
    updateOptions?: Partial<FetchUpdateOptions>
  ): Promise<any>;
  clearData(): void;
}

export type BodyMethods = 'arrayBuffer' | 'blob' | 'formData' | 'json' | 'text';

export interface FetchProps<TData = any, TError = Error> {
  url: string;
  options?: RequestInit | (() => RequestInit);
  manual?: boolean;
  cache?: boolean | object;
  as?:
    | 'auto'
    | BodyMethods
    | ((response: TData) => void)
    | { [type: string]: (res: TData) => Promise<any> };
  fetchFunction?: (url: string, options: RequestInit) => Promise<any>;
  onDataChange?: (newData: TData, data: TData) => any;
  onChange?: (result: FetchResult<TData, TError>) => void;
  deps?: [any];
}

export function useFetch<TData = any, TError = Error>(
  props: FetchProps<TData, TError>
): FetchResult<TData, TError>;

export default class Fetch<TData = any, TError = Error> extends React.Component<
  FetchProps<TData, TError> & {
    children?: (
      result: FetchResult<TData, TError>
    ) => React.ReactNode | React.ReactNode;
  }
> {
  // Passing any to FetchResult as unable to use TData
  static Consumer: React.Consumer<FetchResult<any>>;
}

export const FetchContext: React.Context<FetchResult<TData, TError>>;
