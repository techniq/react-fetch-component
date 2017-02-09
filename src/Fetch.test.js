import React from 'react';
import { shallow, mount } from 'enzyme';
import fetchMock from 'fetch-mock';

import Fetch from './Fetch';

afterEach(fetchMock.restore);

it('renders data on success', () => {
  const data = { hello: 'world' };
  fetchMock.once('*', data);

  const mockHandler = jest.fn();
  mockHandler.mockReturnValue(<div />)

  const wrapper = mount(<Fetch url="http://localhost">{mockHandler}</Fetch>);

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

  const wrapper = mount(<Fetch url="http://localhost">{mockHandler}</Fetch>);

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

it('returns cached result if set', () => {
  const fooData = { name: 'foo' };
  fetchMock.get('http://localhost/foo', fooData);
  const barData = { name: 'bar' };
  fetchMock.get('http://localhost/bar', barData);

  const mockHandler = jest.fn();
  mockHandler.mockReturnValue(<div />)

  // First request
  const wrapper = mount(<Fetch url="http://localhost/foo" cache>{mockHandler}</Fetch>);
  const promise1 = wrapper.instance().promise;

  // Second request
  wrapper.setProps({url: 'http://localhost/bar'});
  const promise2 = wrapper.instance().promise;
  expect(promise2).not.toBe(promise1);

  // Third, should be pulled from cache
  wrapper.setProps({url: 'http://localhost/foo'});
  const promise3 = wrapper.instance().promise;

  expect(promise3).toBe(promise1);
  expect(promise3).not.toBe(promise2);

  expect(fetchMock.calls('http://localhost/foo').length).toBe(1);
  expect(fetchMock.calls('http://localhost/bar').length).toBe(1);

  return promise3.then((state) => {
    expect(state.data).toEqual(fooData)
  });
});


