import React, { useState, useEffect, useRef } from 'react';

import { parseBody, isFunction, isObject } from './utils';
import SimpleCache from './SimpleCache';

const FetchContext = React.createContext({});

function getOptions(options) {
  return isFunction(options) ? options() : options;
}

function getCache(props) {
  return props.cache === true
    ? new SimpleCache()
    : isObject(props.cache)
    ? props.cache
    : null;
}

function useMountedRef() {
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return mountedRef;
}

function useFetch(props) {
  const [state, setState] = useState({
    request: {
      url: props.url,
      options: props.options
    },
    loading: props.manual ? null : true,
    data: undefined,
    error: undefined
  });
  state.fetch = doFetch;
  state.clearData = () => setState({ ...state, data: undefined });

  const cache = useRef(getCache(props)); // TODO: Update on cache prop change
  const promises = useRef([]);
  const mountedRef = useMountedRef();

  const as = props.as || 'auto';
  const fetchFunction =
    props.fetchFunction || ((url, options) => fetch(url, options));

  useEffect(() => {
    if (isFunction(props.onChange)) {
      // Clear the response even if we do not call doFetch immediately
      props.onChange({ ...state, response: undefined });
    }

    if (props.url && !props.manual) {
      doFetch(props.url, props.options);
    }
  }, [props.url, props.manual, ...(props.deps || [])]);

  function doFetch(url, options, updateOptions) {
    if (url == null) {
      url = props.url;
    }

    options = getOptions(options || props.options);
    const request = { url, options };

    if (cache.current && cache.current.get(url)) {
      // Restore cached state
      const promise = cache.current.get(url);
      promise.then(cachedState => update(cachedState, promise, updateOptions));
      promises.current.push(promise);
    } else {
      update({ request, loading: true }, null, updateOptions);

      const promise = fetchFunction(url, options)
        .then(response => {
          const dataPromise = isFunction(as)
            ? as(response)
            : isObject(as)
            ? parseBody(response, as)
            : as === 'auto'
            ? parseBody(response)
            : response[as]();

          return dataPromise
            .then(data => ({ response, data }))
            .catch(error => ({ response, data: error }));
        })
        .then(({ response, data }) => {
          const newState = {
            request,
            loading: false,
            [response.ok ? 'error' : 'data']: undefined, // Clear last response
            [response.ok ? 'data' : 'error']: data,
            response
          };

          update(newState, promise, updateOptions);

          return newState;
        })
        .catch(error => {
          // Catch request errors with no response (CORS issues, etc)
          const newState = {
            request,
            data: undefined,
            error,
            loading: false
          };

          update(newState, promise, updateOptions);

          // Rethrow so not to swallow errors, especially from errors within handlers (children func / onChange)
          throw error;

          return newState;
        });

      promises.current.push(promise);

      if (cache.current) {
        cache.current.set(url, promise);
      }

      return promise;
    }
  }

  function update(nextState, currentPromise, options = {}) {
    if (currentPromise) {
      // Handle (i.e. ignore) promises resolved out of order from requests
      const index = promises.current.indexOf(currentPromise);
      if (index === -1) {
        // Ignore update as a later request/promise has already been processed
        return;
      }

      // Remove currently resolved promise and any outstanding promises
      // (which will cause them to be ignored when they do resolve/reject)
      promises.current.splice(0, index + 1);
    }

    const { onChange, onDataChange } = props;

    let data = undefined;
    if (
      nextState.data &&
      nextState.data !== state.data &&
      isFunction(onDataChange)
    ) {
      data = onDataChange(
        nextState.data,
        options.ignorePreviousData ? undefined : state.data
      );
    }

    if (isFunction(onChange)) {
      // Always call onChange even if unmounted.  Useful for `POST` requests with a redirect
      onChange({
        ...state,
        ...nextState,
        ...(data !== undefined && { data })
      });
    }

    // Ignore passing state down if no longer mounted
    if (mountedRef.current) {
      // If `onDataChange` prop returned a value, we use it for data passed down to the children function
      setState({ ...state, ...nextState, ...(data !== undefined && { data }) });
    }
  }

  return state;
}

const Fetch = ({ children, ...props }) => (
  <FetchContext.Provider value={useFetch(props)}>
    {isFunction(children) ? (
      <FetchContext.Consumer>{children}</FetchContext.Consumer>
    ) : (
      children
    )}
  </FetchContext.Provider>
);
Fetch.Consumer = FetchContext.Consumer;

export { useFetch, FetchContext };
export default Fetch;
