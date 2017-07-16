import React, { Component } from 'react';

class Fetch extends Component {
  static defaultProps = {
    as: 'json'
  }

  state = {
    fetch: this.fetch.bind(this),
    loading: null,
  };
  cache = {};
  promises = [];

  getRequestProps() {
    const { url, options } = this.props;
    // Do not evaluate options here or it removes the benefits of passing it as a function (lazy evaluation)
    return { url, options };
  }

  getOptions() {
    const { options } = this.props;
    return (typeof options === 'function') ? options() : options;
  }

  componentDidMount() {
    const { url, manual, onChange } = this.props;
    this.mounted = true;

    if (typeof onChange === 'function') {
      onChange({ request: this.getRequestProps(), ...this.state });
    }

    if (url && !manual) {
      this.fetch();
    }
  }

  componentDidUpdate(prevProps) {
    const { url, manual } = this.props;
    if (url !== prevProps.url && !manual) {
      this.fetch();
    }
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  fetch() {
    let { url, options, as, cache } = this.props;

    if (cache && this.cache[url]) {
      // Restore cached state
      const promise = this.cache[url];
      promise.then(cachedState => this.update({ ...cachedState }, null, promise));
      this.promises.push(promise);
    } else {
      this.update({
        loading: true,
      });

      const promise = fetch(url, this.getOptions())
        .then(response => {
          return response[as]()
            .then(data   => ({ response, data }))
            .catch(error => ({ response, data: error }))
        })
        .then(({ response, data }) => {
          const newState = {
            loading: false,
            [response.ok ? 'error' : 'data' ]: undefined, // Clear last response
            [response.ok ? 'data'  : 'error']: data,
            response
          }

          this.update(newState, null, promise);

          return newState;
        })
        .catch(error => {
          // Catch request errors with no response (CORS issues, etc)
          const newState = {
            data: undefined,
            error,
            loading: false
          }

          this.update(newState, null, promise);

          // Rethrow so not to swallow errors, especially from errors within handlers (children func / onChange)
          throw(error);

          return newState
        });

        this.promises.push(promise);

      if (cache) {
        this.cache[url] = promise;
      }
    }
  }

  update(nextState, callback, currentPromise) {
    if (currentPromise) {
      const index = this.promises.indexOf(currentPromise);
      if (index === -1) {
        // Ignore update as a later request/promise has already been processed
        return;
      }
      
      // Remove currently resolved promise and any outstanding promises
      // (which will cause them to be ignored when they do return)
      this.promises.splice(0, index + 1);
    }

    // Always call onChange even if unmounted.  Useful for `POST` requests with a redirect
    const { onChange } = this.props;
    let onChangeResult = undefined;
    if (typeof onChange === 'function') {
      onChangeResult = onChange({ request: this.getRequestProps(), ...this.state, ...nextState });
    }

    // Ignore passing state down if no longer mounted
    if (this.mounted) {
      // If `onChange` prop returned a value, we use it for data passed down to the children function
      this.setState(onChangeResult === undefined ? nextState : { ...nextState, data: onChangeResult }, callback);
    }
  }

  renderChildren(children, fetchProps) {
    if (typeof(children) === 'function') {
      const childrenResult = children(fetchProps);
      if (typeof childrenResult === 'function') {
        return this.renderChildren(childrenResult, fetchProps)
      } else {
        return childrenResult;
      }
    } else if (React.Children.count(children) === 0) {
      return null
    } else {
      // TODO: Better to check if children count === 1 and return null otherwise (like react-router)?
      //       Currently not possible to support multiple children components/elements (until React fiber)
      return React.Children.only(children)
    }
  }

  render() {
    const { children } = this.props;
    const fetchProps = { request: this.getRequestProps(), ...this.state };
    return this.renderChildren(children, fetchProps);
  }
}

export default Fetch;