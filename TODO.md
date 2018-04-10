## Features
- PropTypes (include children as function) and/or Flow
- Do not allow multiple inflight fetch requests?
  - Add `debounce` / `throttle`
- Setup UMD build

## Documentation
- Examples
  - Wrapping <Fetch /> in own data component
  - How to use wtih `react-select` / material-ui's `AutoComplete`
  - Show setting `manual` but using URL generated to create a link (download button).  Maybe better to add to react-odata
  - POST/PATCH examples (passing `body`, setting headers (`Content-Type`, etc))
    - `manual` with button to trigger
  - Compositon
    - Fetching items at the same time (peers or nested components)
    - Fetching after another completes (needs info from first query) - `data && <Fetch />`
    - Using `onChange` to call `this.setState()` or dispatch a redux action.
      - `this.setState()` within render (children function) will raise:
        - "Warning: setState(...): Cannot update during an existing state transition (such as within `render` or another component's constructor side-effects are an anti-pattern, but can be moved to `componentWillMount`)"
    - Pagination
      - concating new results to previous using `onDataChange`
    - Loading more (at bottom)
    - Interceptors / Middleware
      - Request (setting Authorization header, other default headers, etc)
      - Response (handling 401 to redirect to login, etc)
  - Reload button on error
  - http://visionmedia.github.io/superagent/
  - http://aurelia.io/hub.html#/doc/article/aurelia/fetch-client/latest/http-services/2