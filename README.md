# react-fetch-component

React component to declaratively [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) data

## Install
```
yarn add react-fetch-component
```
or
```
npm install --save react-fetch-component
```

## Usage
You supply a single function as a child of `<Fetch />` which receives a single argument as an object.  The function will be called anytime the state of the fetch request changes (for example, before a request has been made, while the request is in flight, and after the request returned a response).

While you can pass a single property to the function (for example, `(fetchProps) => ...`), it is common to instead use object destructuring to peel off the properties on the object you plan to use.

An example of destructing and using the most common properties `loading`, `error`, and `data`.

```js
<Fetch url="someUrl">
  { ({ loading, error, data }) => (
    <div>
      { loading && {/* handle loading here */} }
      { error && {/* handle error here */} }
      { data && {/* handle data here */}}
    </div>
  )}
</Fetch>
```

## Props
- `url` (string) - address of the request.  Initial fetch will only be created when it's a non-empty string.  You can initially set this to `undefined`, `false`, or an empty string to delay the fetch to a later render.
- `options` (object|function) - request options such as `method`, `headers`, `credentials`, etc.  If passed as a function, it will not be evaluated until the request is sent, which is useful when calling expensive methods like `JSON.stringify` for `options.body` for example.
  - see [Request properties](https://developer.mozilla.org/en-US/docs/Web/API/Request#Properties) for all available options.
- `as` - declare how to handle the response body
  - default: `json`
  - can be set to any [body method](https://developer.mozilla.org/en-US/docs/Web/API/Body#Methods) including:
    - `arrayBuffer`
    - `blob`
    - `formData`
    - `json`
    - `text`
- `cache` (boolean) - If true, will cache responses by `url` and return from cache without issuing another request.  Useful for typeahead features, etc.
  - default: `false`
- `manual` (boolean) - If `true`, requires calling `fetch` explicitly to initiate requests.  Useful for better control of POST/PUT/PATCH requests.
  - default: `false`
- `onDataChange` (function) - Function called only when data is changed.  It is called before `onChange`, and if a result is returned (i.e. not `undefined`), this value will be used as `data` passed to `onChange` and the child function instead of the original data.  `onDataChange` also receives the current data as the second parameter, which allows for concatenating data (ex. infinity scroll).
- `onChange` (function) - Function called with same props as child function.  Useful to call `setState` (or dispatch a redux action) since this is not allowed within `render`.  `onChange` will always be called even if `<Fetch />` component has been unmounted.
  - default: `undefined`

## Object properties passed to child function
- `loading`
  - Set to `true` while request is pending
  - Set to `false` once response has returned
- `error`
  - Is `undefined` while request is pending
  - Will be set to the parsed response body (`json` by default) if `!response.ok` (i.e. status < 200 || status >= 300)
  - Will be set to an `Error` instance if thrown during the request (ex. CORS issue) or if thrown while attemping to parse the response body, such as returning text/html when `json` was expected (which is the default parser)
  - Will remain `undefined` if neither of the previous occur
- `data`
  - Is `undefined` while request is pending
  - Set to parsed response body (`json` by default) unless one of the `error` conditions occur
- `request`
  - Set to an object containing the props passed to the component (`url`, `options`, etc) when request is sent.
  - Added for convenience when `<Fetch />` is wrapped by your own data component (ex. `<UserData />`)
- `response`
  - Set to the [response](https://developer.mozilla.org/en-US/docs/Web/API/Response) of the `fetch` call
  - Useful to check the status code/text, headers, etc
- `fetch`
  - Function that can be called to create a new fetch request (useful when last request had an error or you want to manually refresh the data (see `manual` prop))


  
## Examples
### Include credentials
```js
<Fetch url="someUrl" options={{ credentials: 'include' }}>
  {/* ... */}
</Fetch>
```

More interactive examples on [CodeSandbox](https://codesandbox.io/s/Z6R7OrOgQ)

## See also
- [react-odata](https://github.com/techniq/react-odata) - uses `<Fetch />` for OData endpoints
