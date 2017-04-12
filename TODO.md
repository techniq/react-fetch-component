## Tests
- Does not cache if `cache` not set

## Features
- Setup CI
- PropTypes (include children as function) and/or Flow
- Only cache on success?
- Support user supplied caches (prefilled cache objects, LRU cache, etc)
  - Maybe handle a function for the `cache` prop
  - Support Server Worker caches / offline support (might be that we disable our own cache and defer to a Service Worker handling the cache network request)
- Do not allow multiple inflight fetch requests?
  - Add `debounce` / `throttle`
- Setup UMD build
- Support passing `options` as function to be evaluated on demand (useful when calling expensive methods like `JSON.stringify` for `options.body` for example)

## Documentation
- Examples
  - Wrapping <Fetch /> in own data component
  - How to use wtih `react-select` / material-ui's `AutoComplete`
  - Show setting `manual` but using URL generated to create a link (download button).  Maybe better to add to react-odata
  - POST/PATCH examples (passing `body`, setting headers (`Content-Type`, etc))
    - `manual` with button to trigger
  - Show how to set default headers ({ ...options, ...moreOptions })
  - http://visionmedia.github.io/superagent/
  - http://aurelia.io/hub.html#/doc/article/aurelia/fetch-client/latest/http-services/2