import React, { Component } from 'react';

class Fetch extends Component {
  state = {
    reload: this.fetch.bind(this),
    loading: null 
  };
  cache = {};

  componentDidMount() {
    this.mounted = true;
    if (this.props.url) {
      this.fetch();
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.url !== prevProps.url) {
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
            [response.ok ? 'error' : 'data']: undefined, // Clear last response
            [response.ok ? 'data' : 'error']: data,
            response
          }

          this.setStateIfMounted(newState);
          return newState;
      })

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
    return this.props.children(this.state);
  }
}

export default Fetch;