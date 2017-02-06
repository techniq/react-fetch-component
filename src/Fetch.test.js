import React from 'react';
import { shallow, mount } from 'enzyme';
import fetchMock from 'fetch-mock';

import Fetch from './Fetch';

it('renders data on success', () => {
  const data = { hello: 'world' };
  fetchMock.once('*', data);

  const mockHandler = jest.fn();
  mockHandler.mockReturnValue(<div />)

  const wrapper = mount(<Fetch url="http://example.com">{mockHandler}</Fetch>);

  return wrapper.instance().promise.then(() => {
    // Once for initial, once for loading, and once for response
    expect(mockHandler.mock.calls.length).toBe(3);

    // Initial state
    expect(mockHandler.mock.calls[0][0]).toEqual({ loading:null });

    // Loading...
    expect(mockHandler.mock.calls[1][0]).toMatchObject({ loading:true, request: {} });

    // Data loaded
    expect(mockHandler.mock.calls[2][0]).toMatchObject({ loading:false, data, request: {}, response: {} });

    expect(fetchMock.called('*')).toBe(true);
  });
});

it('renders error on failure', () => {
  const error = { Error: 'BOOM!' };
  fetchMock.once('*', { status: 500, body: error });

  const mockHandler = jest.fn();
  mockHandler.mockReturnValue(<div />)

  const wrapper = mount(<Fetch url="http://example.com">{mockHandler}</Fetch>);

  return wrapper.instance().promise.then(() => {
    // Once for initial, once for loading, and once for response
    expect(mockHandler.mock.calls.length).toBe(3);

    // Initial state
    expect(mockHandler.mock.calls[0][0]).toEqual({ loading:null });

    // Loading...
    expect(mockHandler.mock.calls[1][0]).toMatchObject({ loading:true, request: {} });

    // Error returned
    expect(mockHandler.mock.calls[2][0]).toMatchObject({ loading:false, error, request: {}, response: {} });

    expect(fetchMock.called('*')).toBe(true);
  });
});
