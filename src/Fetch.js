import React, { Component } from 'react';

export default class Fetch extends Component {
  static defaultProps = {
    as: 'json'
  }

  state = {
    request: {
      url: this.props.url,
      options: this.props.options
    },
    fetch: this.fetch.bind(this),
    clearData: this.clearData.bind(this),
    loading: null,
  };
  cache = {};
  promises = [];

  getOptions(options) {
    return (typeof options === 'function') ? options() : options;
  }

  componentDidMount() {
    const { url, options, manual, onChange } = this.props;
    this.mounted = true;

    if (typeof onChange === 'function') {
      onChange(this.state);
    }

    if (url && !manual) {
      this.fetch(url, options);
    }
  }

  componentDidUpdate(prevProps) {
    const { url, options, manual } = this.props;
    if (url !== prevProps.url && !manual) {
      this.fetch(url, options);
    }
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  fetch(url, options, updateOptions) {
    let { as, cache } = this.props;

    if (url == null) {
      url = this.props.url;
    }

    options = this.getOptions(options || this.props.options)
    const request = { url, options }

    if (cache && this.cache[url]) {
      // Restore cached state
      const promise = this.cache[url];
      promise.then(cachedState => this.update(cachedState, promise, updateOptions));
      this.promises.push(promise);
    } else {
      this.update({ request, loading: true }, null, updateOptions);

      const promise = fetch(url, options)
        .then(response => {
          return response[as]()
            .then(data   => ({ response, data }))
            .catch(error => ({ response, data: error }))
        })
        .then(({ response, data }) => {
          const newState = {
            request,
            loading: false,
            [response.ok ? 'error' : 'data' ]: undefined, // Clear last response
            [response.ok ? 'data'  : 'error']: data,
            response
          }

          this.update(newState, promise, updateOptions);

          return newState;
        })
        .catch(error => {
          // Catch request errors with no response (CORS issues, etc)
          const newState = {
            request,
            data: undefined,
            error,
            loading: false
          }

          this.update(newState, promise, updateOptions);

          // Rethrow so not to swallow errors, especially from errors within handlers (children func / onChange)
          throw(error);

          return newState
        });

      this.promises.push(promise);

      if (cache) {
        this.cache[url] = promise;
      }

      return promise;
    }
  }

  clearData() {
    this.setState({ data: undefined })
  }

  update(nextState, currentPromise, options = {}) {
    if (currentPromise) {
      // Handle (i.e. ignore) promises resolved out of order from requests
      const index = this.promises.indexOf(currentPromise);
      if (index === -1) {
        // Ignore update as a later request/promise has already been processed
        return;
      }
      
      // Remove currently resolved promise and any outstanding promises
      // (which will cause them to be ignored when they do resolve/reject)
      this.promises.splice(0, index + 1);
    }

    const { onChange, onDataChange } = this.props;

    let data = undefined;
    if (nextState.data && nextState.data !== this.state.data && typeof onDataChange === 'function') {
      data = onDataChange(nextState.data, options.ignorePreviousData ? undefined : this.state.data)
    }

    if (typeof onChange === 'function') {
      // Always call onChange even if unmounted.  Useful for `POST` requests with a redirect
      onChange({ ...this.state, ...nextState, ...data && { data } });
    }

    // Ignore passing state down if no longer mounted
    if (this.mounted) {
      // If `onDataChange` prop returned a value, we use it for data passed down to the children function
      this.setState({ ...nextState, ...data && { data } });
    }
  }

  render() {
    const { children } = this.props;
    return renderChildren(children, this.state);
  }
}

export function renderChildren(children, fetchProps) {
  if (typeof(children) === 'function') {
    const childrenResult = children(fetchProps);
    if (typeof childrenResult === 'function') {
      return renderChildren(childrenResult, fetchProps)
    } else {
      return childrenResult;
    }
  } else if (React.Children.count(children) === 0) {
    return null
  } else {
    // DOM/Component children
    // TODO: Better to check if children count === 1 and return null otherwise (like react-router)?
    //       Currently not possible to support multiple children components/elements (until React fiber)
    return React.Children.only(children)
  }
}
