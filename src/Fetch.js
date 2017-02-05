import React, { Component } from 'react';

class Fetch extends Component {
  state = { loading: true };

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
      error: null,
      request: { ...this.props }
    });

    fetch(url, options)
      .then(r => r[as]())
      .then(
        data  => this.setState({ loading: false, data }),
        error => this.setState({ loading: false, error })
      )
  }

  render() {
    return this.props.children(this.state);
  }
}

export default Fetch;