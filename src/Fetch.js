import React, { Component } from 'react';

class Fetch extends Component {
  state = { loading: null };

  componentDidMount() {
    this.update();
  }

  componentDidUpdate(prevProps) {
    if (this.props.url !== prevProps.url) {
      this.update();
    }
  }

  update() {
    let { url, options, as='json' } = this.props;
    this.setState({
      loading: true,
      request: { ...this.props },
    });

    this.promise = fetch(url, options)
      .then(response => {
        return response[as]()
          .then(data => {
            return { response, data }
          })
          .catch(error => {
            return { response, data: error }
          })
      })
      .then(({ response, data }) => {
          this.setState({
            loading: false,
            [response.ok ? 'data' : 'error']: data,
            response
          })
        }
      )
  }

  render() {
    return this.props.children(this.state);
  }
}

export default Fetch;