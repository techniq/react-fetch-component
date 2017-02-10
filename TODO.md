## Tests
- Does not cache if not `cache` not set

## Features
- License (add to README, etc)
- Setup CI
- PropTypes (include children as function) and/or Flow
- Only cache on success?
- Support user supplied caches (prefilled cache objects, LRU cache, etc)
  - Maybe handle a function for the `cache` prop
- Do not allow multiple inflight fetch requests?
  - Debounce / throttle

## Document
- Default 'as' to 'json', other available options (text, arraybuffer, etc)
- `cache` prop
- More examples