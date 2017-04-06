import React, { Component } from 'react';

class Fetch extends Component {
  state = {
    fetch: this.fetch.bind(this),
    loading: null 
  };
  cache = {};

  componentDidMount() {
    const { url, manual, onChange } = this.props;
    this.mounted = true;
    if (url && !manual) {
      this.fetch();
    }

    if (typeof onChange === 'function') {
      onChange(this.state);
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
    let { url, options, as='json', cache } = this.props;

    if (cache && this.cache[url]) {
      // Restore cached state
      this.promise = this.cache[url];
      this.promise.then(cachedState => this.setStateIfMounted({
        request: { ...this.props },
        ...cachedState
      }));
    } else {
      this.setStateIfMounted({
        loading: true,
        request: { ...this.props },
      });

      this.promise = fetch(url, options)
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

          this.setStateIfMounted(newState);
          return newState;
        })
        .catch(error => {
          // Catch request errors with no response (CORS issues, etc)
          const newState = {
            data: undefined,
            error,
            loading: false
          }
          this.setStateIfMounted(newState)
          return newState
        });

      if (cache) {
        this.cache[url] = this.promise;
      }
    }
  }

  setStateIfMounted(nextState, callback) {
    // Ignore passing state down if no longer mounted
    if (this.mounted) {
      this.setState(nextState, callback);
    }
  }

  render() {
    const { children } = this.props;
    if (typeof(children) === 'function') {
      return children(this.state);
    } else if(React.Children.count(children) === 0) {
      return null
    } else {
      // TODO: Better to check if children count === 1 and return null otherwise (like react-router)?
      //       Currently not possible to support multiple children components/elements (until React fiber)
      return React.Children.only(children)
    }
  }
}

export default Fetch;