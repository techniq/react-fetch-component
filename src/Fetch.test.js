import React from 'react';
import ReactDOM from 'react-dom';
import Fetch from './Fetch';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<Fetch />, div);
});
