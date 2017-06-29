import React from 'react';
import { shallow, mount } from 'enzyme';
import fetchMock from 'fetch-mock';

import Fetch from './Fetch';

afterEach(fetchMock.restore);

it('sets data on success', async () => {
  const data = { hello: 'world' };
  fetchMock.once('*', data);

  const mockChildren = jest.fn();
  mockChildren.mockReturnValue(<div />)

  const wrapper = mount(<Fetch url="http://localhost">{mockChildren}</Fetch>);
  const instance = wrapper.instance();

  await instance.promise;
  // Once for initial, once for loading, and once for response
  expect(mockChildren.mock.calls.length).toBe(3);

  // Initial state
  expect(mockChildren.mock.calls[0][0]).toMatchObject({ loading: null, request: {} });

  // Loading...
  expect(mockChildren.mock.calls[1][0]).toMatchObject({ loading: true, request: {} });

  // Data loaded
  expect(mockChildren.mock.calls[2][0]).toMatchObject({ loading: false, data, request: {}, response: {} });

  expect(fetchMock.called('*')).toBe(true);
});

it('sets error on failure', async () => {
  const error = { Error: 'BOOM!' };
  fetchMock.once('*', { status: 500, body: error });

  const mockChildren = jest.fn();
  mockChildren.mockReturnValue(<div />)

  const wrapper = mount(<Fetch url="http://localhost">{mockChildren}</Fetch>);
  const instance = wrapper.instance();

  await instance.promise;

  // Once for initial, once for loading, and once for response
  expect(mockChildren.mock.calls.length).toBe(3);

  // Initial state
  expect(mockChildren.mock.calls[0][0]).toMatchObject({ loading: null, request: {} });

  // Loading...
  expect(mockChildren.mock.calls[1][0]).toMatchObject({ loading: true, request: {} });

  // Error returned
  expect(mockChildren.mock.calls[2][0]).toMatchObject({ loading: false, error, request: {}, response: {} });

  expect(fetchMock.called('*')).toBe(true);
});

it('sets error if exception during request (ex. CORS issue)', async () => {
  const error = new TypeError('Failed to fetch');
  fetchMock.once('*', { status: 500, throws: error });

  const mockChildren = jest.fn();
  mockChildren.mockReturnValue(<div />)

  const wrapper = mount(<Fetch url="http://localhost">{mockChildren}</Fetch>);
  const instance = wrapper.instance();

  try {
    await instance.promise;
    fail('Promise should have rejected');
  } catch (e) {
    expect(e).not.toBeNull();
  }
  // TODO: Use the following once jest 0.20 is released:
  // https://facebook.github.io/jest/docs/expect.html#rejects
  // await expect(instance.promise).rejects.toEqual('Failed to fetch');

  // Once for initial, once for loading, and once for response
  expect(mockChildren.mock.calls.length).toBe(3);

  // Initial state
  expect(mockChildren.mock.calls[0][0]).toMatchObject({ loading: null, request: {} });

  // Loading...
  expect(mockChildren.mock.calls[1][0]).toMatchObject({ loading: true, request: {} });

  // Error returned
  expect(mockChildren.mock.calls[2][0]).toMatchObject({ loading: false, error, request: {}});

  expect(fetchMock.called('*')).toBe(true);
});

it('clears error after successful response', async () => {
  const error = { Error: 'BOOM!' };
  fetchMock.once('*', { status: 500, body: error });
  const data = { hello: 'world' };
  fetchMock.once('*', data);

  let savedProps = null;

  const mockChildren = jest.fn(props => {
    savedProps = props;
    return <div></div>
  });

  const wrapper = mount(<Fetch url="http://localhost">{mockChildren}</Fetch>);
  const instance = wrapper.instance();
  const promise = instance.promise;

  await promise;
  savedProps.fetch();
  const promise2 = instance.promise;
  await promise2;

  // Once for initial and once for loading, but should not be called when the response is returned 
  expect(mockChildren.mock.calls.length).toBe(5);

  // Initial state
  expect(mockChildren.mock.calls[0][0]).toMatchObject({ loading: null, request: {} });

  // Loading...
  expect(mockChildren.mock.calls[1][0]).toMatchObject({ loading: true, request: {} });
  
  // Error returned
  expect(mockChildren.mock.calls[2][0]).toMatchObject({ loading: false, error, request: {}, response: {} });

  // Refetching...
  expect(mockChildren.mock.calls[3][0]).toMatchObject({ loading: true, request: {} });

  // Data returned
  expect(mockChildren.mock.calls[4][0]).toMatchObject({ loading: false, data, request: {}, response: {} });
  expect(mockChildren.mock.calls[4][0].error).toBeUndefined();

  expect(fetchMock.called('*')).toBe(true);
});

it('returns cached result if set', async () => {
  const fooData = { name: 'foo' };
  fetchMock.get('http://localhost/foo', fooData);
  const barData = { name: 'bar' };
  fetchMock.get('http://localhost/bar', barData);

  const mockChildren = jest.fn();
  mockChildren.mockReturnValue(<div />)

  // First request
  const wrapper = mount(<Fetch url="http://localhost/foo" cache>{mockChildren}</Fetch>);
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

  const mockChildren = jest.fn();
  mockChildren.mockReturnValue(<div />)

  const wrapper = mount(<Fetch url="http://localhost">{mockChildren}</Fetch>);
  const instance = wrapper.instance();
  const promise = instance.promise;
  wrapper.unmount();

  await promise;

  // Once for initial and once for loading, but should not be called when the response is returned 
  expect(mockChildren.mock.calls.length).toBe(2);

  // Initial state
  expect(mockChildren.mock.calls[0][0]).toMatchObject({ loading: null, request: {} });

  // Loading...
  expect(mockChildren.mock.calls[1][0]).toMatchObject({ loading: true, request: {} });

  expect(fetchMock.called('*')).toBe(true);
});

it('supports refetching data if "fetch" called', async () => {
  const error = { Error: 'BOOM!' };
  fetchMock.once('*', { status: 500, body: error });
  const data = { hello: 'world' };
  fetchMock.once('*', data);

  let savedProps = null;

  const mockChildren = jest.fn(props => {
    savedProps = props;
    return <div></div>
  });

  const wrapper = mount(<Fetch url="http://localhost">{mockChildren}</Fetch>);
  const instance = wrapper.instance();
  const promise = instance.promise;

  await promise;
  savedProps.fetch();
  const promise2 = instance.promise;
  await promise2;

  // Once for initial and once for loading, but should not be called when the response is returned 
  expect(mockChildren.mock.calls.length).toBe(5);

  // Initial state
  expect(mockChildren.mock.calls[0][0]).toMatchObject({ loading: null, request: {} });

  // Loading...
  expect(mockChildren.mock.calls[1][0]).toMatchObject({ loading: true, request: {} });
  
  // Error returned
  expect(mockChildren.mock.calls[2][0]).toMatchObject({ loading: false, error, request: {}, response: {} });

  // Refetching...
  expect(mockChildren.mock.calls[3][0]).toMatchObject({ loading: true, request: {} });

  // Data returned
  expect(mockChildren.mock.calls[4][0]).toMatchObject({ loading: false, data, request: {}, response: {} });

  expect(fetchMock.called('*')).toBe(true);
});

it('does not fetch if url is undefined', async () => {
  const data = { hello: 'world' };
  fetchMock.once('*', data);

  const mockChildren = jest.fn();
  mockChildren.mockReturnValue(<div />)

  const wrapper = mount(<Fetch>{mockChildren}</Fetch>);
  const instance = wrapper.instance();

  expect(instance.promise).toBe(undefined);
  
  // // Once for initial, once for loading, and once for response
  expect(mockChildren.mock.calls.length).toBe(1);

  // // Initial state
  expect(mockChildren.mock.calls[0][0]).toMatchObject({ loading: null, request: {} });

  expect(fetchMock.called('*')).toBe(false);
});

it('does not fetch if url is false', async () => {
  const data = { hello: 'world' };
  fetchMock.once('*', data);

  const mockChildren = jest.fn();
  mockChildren.mockReturnValue(<div />)

  const wrapper = mount(<Fetch url={false}>{mockChildren}</Fetch>);
  const instance = wrapper.instance();

  expect(instance.promise).toBe(undefined);
  
  // // Once for initial, once for loading, and once for response
  expect(mockChildren.mock.calls.length).toBe(1);

  // // Initial state
  expect(mockChildren.mock.calls[0][0]).toMatchObject({ loading: null, request: {} });

  expect(fetchMock.called('*')).toBe(false);
});

it('does not fetch if url is an empty string', async () => {
  const data = { hello: 'world' };
  fetchMock.once('*', data);

  const mockChildren = jest.fn();
  mockChildren.mockReturnValue(<div />)

  const wrapper = mount(<Fetch url="">{mockChildren}</Fetch>);
  const instance = wrapper.instance();

  expect(instance.promise).toBe(undefined);
  
  // // Once for initial, once for loading, and once for response
  expect(mockChildren.mock.calls.length).toBe(1);

  // // Initial state
  expect(mockChildren.mock.calls[0][0]).toMatchObject({ loading: null, request: {} });

  expect(fetchMock.called('*')).toBe(false);
});

it('does not initially fetch if "manual" prop is true/set', async () => {
  const data = { hello: 'world' };
  fetchMock.once('*', data);

  const mockChildren = jest.fn();
  mockChildren.mockReturnValue(<div />)

  const wrapper = mount(<Fetch url="http://localhost" manual>{mockChildren}</Fetch>);
  const instance = wrapper.instance();

  expect(instance.promise).toBe(undefined);
  
  // // Once for initial, once for loading, and once for response
  expect(mockChildren.mock.calls.length).toBe(1);

  // // Initial state
  expect(mockChildren.mock.calls[0][0]).toMatchObject({ loading: null, request: {} });

  expect(fetchMock.called('*')).toBe(false);
});

it('does not fetch if "manual" prop is set and url changes', async () => {
  const fooData = { name: 'foo' };
  fetchMock.get('http://localhost/foo', fooData);
  const barData = { name: 'bar' };
  fetchMock.get('http://localhost/bar', barData);

  const mockChildren = jest.fn();
  mockChildren.mockReturnValue(<div />)

  // Initial url
  const wrapper = mount(<Fetch url="http://localhost/foo" manual>{mockChildren}</Fetch>);
  const instance = wrapper.instance();
  const promise1 = instance.promise;

  // Change url
  wrapper.setProps({url: 'http://localhost/bar'});
  const promise2 = instance.promise;
  expect(promise2).toBe(promise1);

  expect(fetchMock.calls('http://localhost/foo').length).toBe(0);
  expect(fetchMock.calls('http://localhost/bar').length).toBe(0);
});

it('supports manually fetching data when "manual" prop set and "fetch" is called', async () => {
  const data = { hello: 'world' };
  fetchMock.once('*', data);

  let savedProps = null;

  const mockChildren = jest.fn(props => {
    savedProps = props;
    return <div></div>
  });

  const wrapper = mount(<Fetch url="http://localhost" manual>{mockChildren}</Fetch>);
  const instance = wrapper.instance();
  const promise = instance.promise;

  await promise; // no request made
  savedProps.fetch();
  const promise2 = instance.promise;
  await promise2;

  // Once for initial and once for loading, but should not be called when the response is returned 
  expect(mockChildren.mock.calls.length).toBe(3);

  // Initial state
  expect(mockChildren.mock.calls[0][0]).toMatchObject({ loading: null, request: {} });

  // Loading...
  expect(mockChildren.mock.calls[1][0]).toMatchObject({ loading: true, request: {} });
  
  // Data returned
  expect(mockChildren.mock.calls[2][0]).toMatchObject({ loading: false, data, request: {}, response: {} });

  expect(fetchMock.called('*')).toBe(true);
});

it('supports delaying the initial fetch', async () => {
  const data = { hello: 'world' };
  fetchMock.once('*', data);

  const mockChildren = jest.fn();
  mockChildren.mockReturnValue(<div />)

  // Mount component but should not issue request
  const wrapper = mount(<Fetch>{mockChildren}</Fetch>);
  const instance = wrapper.instance();
  expect(instance.promise).toBe(undefined);

  // Set url to issue request
  wrapper.setProps({url: 'http://localhost'});
  await instance.promise;

  // Once for mount, once for the delayed setting of url, once for loading, and once for response
  expect(mockChildren.mock.calls.length).toBe(4);

  // Initial state
  expect(mockChildren.mock.calls[0][0]).toMatchObject({ loading: null, request: {} });

  // Setting the url but no fetch issued yet
  expect(mockChildren.mock.calls[1][0]).toMatchObject({ loading: null });

  // Loading...
  expect(mockChildren.mock.calls[2][0]).toMatchObject({ loading: true, request: {} });

  // Data loaded
  expect(mockChildren.mock.calls[3][0]).toMatchObject({ loading: false, data, request: {}, response: {} });

  expect(fetchMock.called('*')).toBe(true);
});

it('supports no children (fire and forget)', async () => {
  const data = { hello: 'world' };
  fetchMock.once('*', data);

  const mockChildren = jest.fn();
  mockChildren.mockReturnValue(<div />)

  const wrapper = mount(<Fetch url="http://localhost" />);
  const instance = wrapper.instance();

  await instance.promise;

  expect(fetchMock.called('*')).toBe(true);
});

it('supports children as single DOM element', async () => {
  const data = { hello: 'world' };
  fetchMock.once('*', data);

  const wrapper = mount(
    <Fetch url="http://localhost">
      <div />
    </Fetch>
  );
  const instance = wrapper.instance();

  await instance.promise;
  // Once for initial, once for loading, and once for response
  expect(wrapper.find('div').length).toBe(1);

  expect(fetchMock.called('*')).toBe(true);
});

it('supports options as function', async () => {
  const data = { hello: 'world' };
  fetchMock.once('*', data);

  const mockChildren = jest.fn();
  mockChildren.mockReturnValue(<div />)

  const mockOptions = jest.fn();
  const options = { headers: { 'Cache-Control': 'no-cache' } };
  mockOptions.mockReturnValue(options);

  const wrapper = mount(<Fetch url="http://localhost" options={mockOptions}>{mockChildren}</Fetch>);
  const instance = wrapper.instance();

  await instance.promise;

  // Once for initial, once for loading, and once for response
  expect(mockChildren.mock.calls.length).toBe(3);

  expect(mockOptions.mock.calls.length).toBe(1);
  expect(fetchMock.calls('*')[0][1]).toMatchObject(options);

  // Initial state
  expect(mockChildren.mock.calls[0][0]).toMatchObject({ loading: null, request: {} });

  // Loading...
  expect(mockChildren.mock.calls[1][0]).toMatchObject({ loading: true, request: {} });

  // Data loaded
  expect(mockChildren.mock.calls[2][0]).toMatchObject({ loading: false, data, request: {}, response: {} });

  expect(fetchMock.called('*')).toBe(true);
});

// TODO: Not possible until React Fiber
/*it('supports children as multiple DOM elements', async () => {
  const data = { hello: 'world' };
  fetchMock.once('*', data);

  const wrapper = mount(
    <Fetch url="http://localhost">
      <div />
      <div />
    </Fetch>
  );
  const instance = wrapper.instance();

  await instance.promise;
  // Once for initial, once for loading, and once for response
  expect(wrapper.find('div').length).toBe(2);

  expect(fetchMock.called('*')).toBe(true);
});*/


it('supports onChange prop', async () => {
  const data = { hello: 'world' };
  fetchMock.once('*', data);

  const mockOnChange = jest.fn();

  const wrapper = mount(<Fetch url="http://localhost" onChange={mockOnChange} />);
  const instance = wrapper.instance();

  await instance.promise;

  expect(mockOnChange.mock.calls.length).toBe(3);

  // // Initial state
  expect(mockOnChange.mock.calls[0][0]).toMatchObject({ loading: null });

  // // Loading...
  expect(mockOnChange.mock.calls[1][0]).toMatchObject({ loading: true, request: {} });

  // // Data loaded
  expect(mockOnChange.mock.calls[2][0]).toMatchObject({ loading: false, data, request: {}, response: {} });

  expect(fetchMock.called('*')).toBe(true);
});

it('onChange is still called even if unmounted (useful for POST with redirect)', async () => {
  // TODO: Update docs to indicate the user is responsible for not calling `setState` if the component is unmounted
  const data = { hello: 'world' };
  fetchMock.once('*', data);

  const mockOnChange = jest.fn();

  const wrapper = mount(<Fetch url="http://localhost" onChange={mockOnChange} />);
  const instance = wrapper.instance();
  const promise = instance.promise;
  wrapper.unmount();

  await promise;

  // // Initial state
  expect(mockOnChange.mock.calls[0][0]).toMatchObject({ loading: null });

  // // Loading...
  expect(mockOnChange.mock.calls[1][0]).toMatchObject({ loading: true, request: {} });

  // // Data loaded
  expect(mockOnChange.mock.calls[2][0]).toMatchObject({ loading: false, data, request: {}, response: {} });

  expect(fetchMock.called('*')).toBe(true);
});

it('supports interceptor / middlware', async () => {
  const data = { hello: 'world' };
  fetchMock.once('*', data);

  // const mockInterceptor = jest.fn();
  // mockChildren.mockReturnValue(<div />)

  const mockChildren = jest.fn();
  mockChildren.mockReturnValue(<div />)

  const middleware = fetchProps => mockChildren

  const wrapper = mount(<Fetch url="http://localhost">{middleware}</Fetch>);
  const instance = wrapper.instance();

  await instance.promise;
  // Once for initial, once for loading, and once for response
  expect(mockChildren.mock.calls.length).toBe(3);

  // Initial state
  expect(mockChildren.mock.calls[0][0]).toMatchObject({ loading: null, request: {} });

  // Loading...
  expect(mockChildren.mock.calls[1][0]).toMatchObject({ loading: true, request: {} });

  // Data loaded
  expect(mockChildren.mock.calls[2][0]).toMatchObject({ loading: false, data, request: {}, response: {} });

  expect(fetchMock.called('*')).toBe(true);
});
// TODO: Add test for conditional returning based on request.status (ex. 401 returns login, 200 returns `children`)

it('supports multiple interceptors / middlwares', async () => {
  const data = { hello: 'world' };
  fetchMock.once('*', data);

  const mockChildren = jest.fn();
  mockChildren.mockReturnValue(<div />)

  const middleware = fetchProps => fetchProps => mockChildren

  const wrapper = mount(<Fetch url="http://localhost">{middleware}</Fetch>);
  const instance = wrapper.instance();

  await instance.promise;
  // Once for initial, once for loading, and once for response
  expect(mockChildren.mock.calls.length).toBe(3);

  // Initial state
  expect(mockChildren.mock.calls[0][0]).toMatchObject({ loading: null, request: {} });

  // Loading...
  expect(mockChildren.mock.calls[1][0]).toMatchObject({ loading: true, request: {} });

  // Data loaded
  expect(mockChildren.mock.calls[2][0]).toMatchObject({ loading: false, data, request: {}, response: {} });

  expect(fetchMock.called('*')).toBe(true);
});

it('passes changes to children function as data if `onChange` returns a result', async () => {
  const data = { hello: 'world' };
  fetchMock.once('*', data);

  const mockChildren = jest.fn();
  mockChildren.mockReturnValue(<div />)

  const changedData = { hello: 'everyone' };
  const handleOnChange = ({ data }) => changedData;

  const wrapper = mount(<Fetch url="http://localhost" onChange={handleOnChange}>{mockChildren}</Fetch>);
  const instance = wrapper.instance();

  await instance.promise;
  // Once for initial, once for loading, and once for response
  expect(mockChildren.mock.calls.length).toBe(3);

  // Initial state
  expect(mockChildren.mock.calls[0][0]).toMatchObject({ loading: null, request: {} });

  // Loading...
  expect(mockChildren.mock.calls[1][0]).toMatchObject({ loading: true, request: {} });

  // Data loaded
  expect(mockChildren.mock.calls[2][0]).toMatchObject({ loading: false, data: changedData, request: {}, response: {} });

  expect(fetchMock.called('*')).toBe(true);
});

it('does not pass changes to children function as data if `onChange` does not return a result', async () => {
  const data = { hello: 'world' };
  fetchMock.once('*', data);

  const mockChildren = jest.fn();
  mockChildren.mockReturnValue(<div />)

  const handleOnChange = ({ data }) => {};

  const wrapper = mount(<Fetch url="http://localhost" onChange={handleOnChange}>{mockChildren}</Fetch>);
  const instance = wrapper.instance();

  await instance.promise;
  // Once for initial, once for loading, and once for response
  expect(mockChildren.mock.calls.length).toBe(3);

  // Initial state
  expect(mockChildren.mock.calls[0][0]).toMatchObject({ loading: null, request: {} });

  // Loading...
  expect(mockChildren.mock.calls[1][0]).toMatchObject({ loading: true, request: {} });

  // Data loaded
  expect(mockChildren.mock.calls[2][0]).toMatchObject({ loading: false, data, request: {}, response: {} });

  expect(fetchMock.called('*')).toBe(true);
});

// TODO: Having difficulting testing/mocking this
/*it('can use onChange with setState to control rendering instead of child function', async () => {
  const data = { hello: 'world' };
  fetchMock.once('*', data);

  let wrapper = null;

  // TODO: This is being called before `wrapper` is set.
  const mockOnChange = jest.fn(props => {
    console.log('mockOnChange')
    if (wrapper) {
      console.log('mockOnChange, setting state', props)
      wrapper.setState({ loading: props.loading })
    }
  });

  const mockChildren = jest.fn();
  mockChildren.mockReturnValue(<div />);

  console.log('before mount')
  wrapper = mount(
    <Fetch url="http://localhost" onChange={mockOnChange}>
      <div></div>
    </Fetch>
  );
  console.log('after mount')
  const instance = wrapper.instance();
  const promise = instance.promise;

  console.log('before promise resolves')
  await promise;

  expect(mockOnChange.mock.calls.length).toBe(3);
  expect(mockChildren.mock.calls.length).toBe(3);

  // // Initial state
  expect(mockOnChange.mock.calls[0][0]).toMatchObject({ loading: null });

  // // Loading...
  expect(mockOnChange.mock.calls[1][0]).toMatchObject({ loading: true, request: {} });

  // // Data loaded
  expect(mockOnChange.mock.calls[2][0]).toMatchObject({ loading: false, data, request: {}, response: {} });

  expect(fetchMock.called('*')).toBe(true);
});*/

// TODO: onChange is called before render
// TODO: Create test to verify calling "setState" in "onChange" prop is supported

// TODO: Test changing props updates `request` passed
// TODO: Make sure all errors are not swallowed (just fetch-related like CORS issue)