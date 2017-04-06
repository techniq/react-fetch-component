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

### Import
```js
import Fetch from 'react-fetch-component'
```

### Basic
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

Function supplied as a child of `<Fetch />` will receive a single argument as an object with the following properties
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


### Include credentials
```js
<Fetch url="someUrl" options={{ credentials: 'include' }}>
  {/* ... */}
</Fetch>
```

## Props
- `url` (string) - address of the request.  Initial fetch will only be created when it's a non-empty string.  You can initially set this to `undefined`, `false`, or an empty string to delay the fetch to a later render.
- `options` (object) - request options such as `method`, `headers`, `credentials`, etc.
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
- `manual` (boolean) - If `true`, requires calling `fetch` explicitly to initiate requests.  Useful for better control of POST/PUT/PATCH requests
  - default: `false`
- `onChange` (function) - Function called with same props as child function.  Useful to call `setState` (or dispatch a redux action) since this is not allowed within `render`.
  - default: `undefined`

## See also
- [react-odata](https://github.com/techniq/react-odata) - uses `<Fetch />` for OData endpoints
