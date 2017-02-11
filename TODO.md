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

## Document
- Example wrapping <Fetch /> in own data component
- More examples