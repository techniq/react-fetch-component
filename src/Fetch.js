import React, { Component } from 'react';

class Fetch extends Component {
  state = { loading: null };
  cache = {};

  componentDidMount() {
    this.update();
  }

  componentDidUpdate(prevProps) {
    if (this.props.url !== prevProps.url) {
      this.update();
    }
  }

  update() {
    let { url, options, as='json', cache } = this.props;

    if (cache && this.cache[url]) {
      // Restore cached state
      this.promise = this.cache[url];
      this.promise.then(cachedState => this.setState({
        request: { ...this.props },
        ...cachedState
      }));
    } else {
      this.setState({
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
            [response.ok ? 'data' : 'error']: data,
            response
          }

          this.setState(newState);
          return newState;
      })

      if (cache) {
        this.cache[url] = this.promise;
      }
    }
  }

  render() {
    return this.props.children(this.state);
  }
}

export default Fetch;