## Tests
- Does not cache if `cache` not set

## Features
- Setup CI
- PropTypes (include children as function) and/or Flow
- Only cache on success?
- Support user supplied caches (prefilled cache objects, LRU cache, etc)
  - Maybe handle a function for the `cache` prop
- Do not allow multiple inflight fetch requests?
  - Add `debounce` / `throttle`
- Setup UMD build
- Provide lots of examples


## Document
- Examples
  - Wrapping <Fetch /> in own data component
  - How to use wtih `react-select` / material-ui's `AutoComplete`
  - POST/PATCH examples (passing `body`, setting headers (`Content-Type`, etc))
    - `manual` with button to trigger
  - http://visionmedia.github.io/superagent/