import React from 'react';
import { shallow, mount } from 'enzyme';
import fetchMock from 'fetch-mock';

import Fetch from './Fetch';

afterEach(fetchMock.restore);

it('sets data on success', async () => {
  const data = { hello: 'world' };
  fetchMock.once('*', data);

  const mockHandler = jest.fn();
  mockHandler.mockReturnValue(<div />)

  const wrapper = mount(<Fetch url="http://localhost">{mockHandler}</Fetch>);
  const instance = wrapper.instance();

  await instance.promise;
  // Once for initial, once for loading, and once for response
  expect(mockHandler.mock.calls.length).toBe(3);

  // Initial state
  expect(mockHandler.mock.calls[0][0]).toMatchObject({ loading: null });

  // Loading...
  expect(mockHandler.mock.calls[1][0]).toMatchObject({ loading: true, request: {} });

  // Data loaded
  expect(mockHandler.mock.calls[2][0]).toMatchObject({ loading: false, data, request: {}, response: {} });

  expect(fetchMock.called('*')).toBe(true);
});

it('sets error on failure', async () => {
  const error = { Error: 'BOOM!' };
  fetchMock.once('*', { status: 500, body: error });

  const mockHandler = jest.fn();
  mockHandler.mockReturnValue(<div />)

  const wrapper = mount(<Fetch url="http://localhost">{mockHandler}</Fetch>);
  const instance = wrapper.instance();

  await instance.promise;

  // Once for initial, once for loading, and once for response
  expect(mockHandler.mock.calls.length).toBe(3);

  // Initial state
  expect(mockHandler.mock.calls[0][0]).toMatchObject({ loading: null });

  // Loading...
  expect(mockHandler.mock.calls[1][0]).toMatchObject({ loading: true, request: {} });

  // Error returned
  expect(mockHandler.mock.calls[2][0]).toMatchObject({ loading: false, error, request: {}, response: {} });

  expect(fetchMock.called('*')).toBe(true);
});

it('sets error if exception during request (ex. CORS issue)', async () => {
  const error = new TypeError('Failed to fetch');
  fetchMock.once('*', { status: 500, throws: error });

  const mockHandler = jest.fn();
  mockHandler.mockReturnValue(<div />)

  const wrapper = mount(<Fetch url="http://localhost">{mockHandler}</Fetch>);
  const instance = wrapper.instance();

  await instance.promise;

  // Once for initial, once for loading, and once for response
  expect(mockHandler.mock.calls.length).toBe(3);

  // Initial state
  expect(mockHandler.mock.calls[0][0]).toMatchObject({ loading: null });

  // Loading...
  expect(mockHandler.mock.calls[1][0]).toMatchObject({ loading: true, request: {} });

  // Error returned
  expect(mockHandler.mock.calls[2][0]).toMatchObject({ loading: false, error, request: {}});

  expect(fetchMock.called('*')).toBe(true);
});

it('clears error after successful response', async () => {
  const error = { Error: 'BOOM!' };
  fetchMock.once('*', { status: 500, body: error });
  const data = { hello: 'world' };
  fetchMock.once('*', data);

  let savedProps = null;

  const mockHandler = jest.fn(props => {
    savedProps = props;
    return <div></div>
  });

  const wrapper = mount(<Fetch url="http://localhost">{mockHandler}</Fetch>);
  const instance = wrapper.instance();
  const promise = instance.promise;

  await promise;
  savedProps.reload();
  const promise2 = instance.promise;
  await promise2;

  // Once for initial and once for loading, but should not be called when the response is returned 
  expect(mockHandler.mock.calls.length).toBe(5);

  // Initial state
  expect(mockHandler.mock.calls[0][0]).toMatchObject({ loading: null });

  // Loading...
  expect(mockHandler.mock.calls[1][0]).toMatchObject({ loading: true, request: {} });
  
  // Error returned
  expect(mockHandler.mock.calls[2][0]).toMatchObject({ loading: false, error, request: {}, response: {} });

  // Reloading...
  expect(mockHandler.mock.calls[3][0]).toMatchObject({ loading: true, request: {} });

  // Data returned
  expect(mockHandler.mock.calls[4][0]).toMatchObject({ loading: false, data, request: {}, response: {} });
  expect(mockHandler.mock.calls[4][0].error).toBeUndefined();

  expect(fetchMock.called('*')).toBe(true);
});

it('returns cached result if set', async () => {
  const fooData = { name: 'foo' };
  fetchMock.get('http://localhost/foo', fooData);
  const barData = { name: 'bar' };
  fetchMock.get('http://localhost/bar', barData);

  const mockHandler = jest.fn();
  mockHandler.mockReturnValue(<div />)

  // First request
  const wrapper = mount(<Fetch url="http://localhost/foo" cache>{mockHandler}</Fetch>);
  const instance = wrapper.instance();
  const promise1 = instance.promise;

  // Second request
  wrapper.setProps({url: 'http://localhost/bar'});
  const promise2 = instance.promise;
  expect(promise2).not.toBe(promise1);

  // Third, should be pulled from cache
  wrapper.setProps({url: 'http://localhost/foo'});
  const promise3 = instance.promise;

  expect(promise3).toBe(promise1);
  expect(promise3).not.toBe(promise2);

  expect(fetchMock.calls('http://localhost/foo').length).toBe(1);
  expect(fetchMock.calls('http://localhost/bar').length).toBe(1);

  const state = await promise3;
  expect(state.data).toEqual(fooData)
});

it('does not call setState if unmounted', async () => {
  const data = { hello: 'world' };
  fetchMock.once('*', data);

  const mockHandler = jest.fn();
  mockHandler.mockReturnValue(<div />)

  const wrapper = mount(<Fetch url="http://localhost">{mockHandler}</Fetch>);
  const instance = wrapper.instance();
  const promise = instance.promise;
  wrapper.unmount();

  await promise;

  // Once for initial and once for loading, but should not be called when the response is returned 
  expect(mockHandler.mock.calls.length).toBe(2);

  // Initial state
  expect(mockHandler.mock.calls[0][0]).toMatchObject({ loading: null });

  // Loading...
  expect(mockHandler.mock.calls[1][0]).toMatchObject({ loading: true, request: {} });

  expect(fetchMock.called('*')).toBe(true);
});

it('supports reloading data if "reload" called', async () => {
  const error = { Error: 'BOOM!' };
  fetchMock.once('*', { status: 500, body: error });
  const data = { hello: 'world' };
  fetchMock.once('*', data);

  let savedProps = null;

  const mockHandler = jest.fn(props => {
    savedProps = props;
    return <div></div>
  });

  const wrapper = mount(<Fetch url="http://localhost">{mockHandler}</Fetch>);
  const instance = wrapper.instance();
  const promise = instance.promise;

  await promise;
  savedProps.reload();
  const promise2 = instance.promise;
  await promise2;

  // Once for initial and once for loading, but should not be called when the response is returned 
  expect(mockHandler.mock.calls.length).toBe(5);

  // Initial state
  expect(mockHandler.mock.calls[0][0]).toMatchObject({ loading: null });

  // Loading...
  expect(mockHandler.mock.calls[1][0]).toMatchObject({ loading: true, request: {} });
  
  // Error returned
  expect(mockHandler.mock.calls[2][0]).toMatchObject({ loading: false, error, request: {}, response: {} });

  // Reloading...
  expect(mockHandler.mock.calls[3][0]).toMatchObject({ loading: true, request: {} });

  // Data returned
  expect(mockHandler.mock.calls[4][0]).toMatchObject({ loading: false, data, request: {}, response: {} });

  expect(fetchMock.called('*')).toBe(true);
});

it('does not fetch if url is undefined', async () => {
  const data = { hello: 'world' };
  fetchMock.once('*', data);

  const mockHandler = jest.fn();
  mockHandler.mockReturnValue(<div />)

  const wrapper = mount(<Fetch>{mockHandler}</Fetch>);
  const instance = wrapper.instance();

  expect(instance.promise).toBe(undefined);
  
  // // Once for initial, once for loading, and once for response
  expect(mockHandler.mock.calls.length).toBe(1);

  // // Initial state
  expect(mockHandler.mock.calls[0][0]).toMatchObject({ loading: null });

  expect(fetchMock.called('*')).toBe(false);
});

it('does not fetch if url is false', async () => {
  const data = { hello: 'world' };
  fetchMock.once('*', data);

  const mockHandler = jest.fn();
  mockHandler.mockReturnValue(<div />)

  const wrapper = mount(<Fetch url={false}>{mockHandler}</Fetch>);
  const instance = wrapper.instance();

  expect(instance.promise).toBe(undefined);
  
  // // Once for initial, once for loading, and once for response
  expect(mockHandler.mock.calls.length).toBe(1);

  // // Initial state
  expect(mockHandler.mock.calls[0][0]).toMatchObject({ loading: null });

  expect(fetchMock.called('*')).toBe(false);
});

it('does not fetch if url is an empty string', async () => {
  const data = { hello: 'world' };
  fetchMock.once('*', data);

  const mockHandler = jest.fn();
  mockHandler.mockReturnValue(<div />)

  const wrapper = mount(<Fetch url="">{mockHandler}</Fetch>);
  const instance = wrapper.instance();

  expect(instance.promise).toBe(undefined);
  
  // // Once for initial, once for loading, and once for response
  expect(mockHandler.mock.calls.length).toBe(1);

  // // Initial state
  expect(mockHandler.mock.calls[0][0]).toMatchObject({ loading: null });

  expect(fetchMock.called('*')).toBe(false);
});

it('supports delaying the initial fetch', async () => {
  const data = { hello: 'world' };
  fetchMock.once('*', data);

  const mockHandler = jest.fn();
  mockHandler.mockReturnValue(<div />)

  // Mount component but should not issue request
  const wrapper = mount(<Fetch>{mockHandler}</Fetch>);
  const instance = wrapper.instance();
  expect(instance.promise).toBe(undefined);

  // Set url to issue request
  wrapper.setProps({url: 'http://localhost'});
  await instance.promise;

  // Once for mount, once for the delayed setting of url, once for loading, and once for response
  expect(mockHandler.mock.calls.length).toBe(4);

  // Initial state
  expect(mockHandler.mock.calls[0][0]).toMatchObject({ loading: null });

  // Setting the url but no fetch issued yet
  expect(mockHandler.mock.calls[1][0]).toMatchObject({ loading: null });

  // Loading...
  expect(mockHandler.mock.calls[2][0]).toMatchObject({ loading: true, request: {} });

  // Data loaded
  expect(mockHandler.mock.calls[3][0]).toMatchObject({ loading: false, data, request: {}, response: {} });

  expect(fetchMock.called('*')).toBe(true);
});