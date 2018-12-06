import React from 'react';
import { render, Simulate, wait } from 'react-testing-library';
import fetchMock from 'fetch-mock';

fetchMock.config.overwriteRoutes = false;

import Fetch, { SimpleCache } from './';

afterEach(fetchMock.restore);

describe('basic', () => {
  it('sets data on success', async () => {
    const url = 'http://localhost';
    const data = { hello: 'world' };
    fetchMock.once(url, data);

    const mockChildren = jest.fn();
    mockChildren.mockReturnValue(<div />);

    const {} = render(<Fetch url={url}>{mockChildren}</Fetch>);

    // Once for initial, once for loading, and once for response
    await wait(() => expect(mockChildren.mock.calls.length).toBe(3));

    // Initial state
    expect(mockChildren.mock.calls[0][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Loading...
    expect(mockChildren.mock.calls[1][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Data loaded
    expect(mockChildren.mock.calls[2][0]).toMatchObject({
      loading: false,
      data,
      request: {},
      response: {}
    });

    expect(fetchMock.called(url)).toBe(true);
  });

  it('does not call setState if unmounted', async () => {
    const url = 'http://localhost';
    const data = { hello: 'world' };
    fetchMock.once(url, data);

    const mockChildren = jest.fn();
    mockChildren.mockReturnValue(<div />);

    const { unmount } = render(<Fetch url={url}>{mockChildren}</Fetch>);
    unmount();

    // Once for initial and once for loading, but should not be called when the response is returned
    await wait(() => expect(mockChildren.mock.calls.length).toBe(2));

    // Initial state
    expect(mockChildren.mock.calls[0][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Loading...
    expect(mockChildren.mock.calls[1][0]).toMatchObject({
      loading: true,
      request: {}
    });

    expect(fetchMock.called(url)).toBe(true);
  });

  it('does not process empty body', async () => {
    const url = 'http://localhost';
    fetchMock.once(url, { status: 404 });

    const mockChildren = jest.fn();
    mockChildren.mockReturnValue(<div />);

    const {} = render(<Fetch url={url}>{mockChildren}</Fetch>);

    // Once for initial, once for loading, and once for response
    await wait(() => expect(mockChildren.mock.calls.length).toBe(3));

    // Initial state
    expect(mockChildren.mock.calls[0][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Loading...
    expect(mockChildren.mock.calls[1][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Data loaded
    expect(mockChildren.mock.calls[2][0]).toMatchObject({
      loading: false,
      data: undefined,
      error: null,
      request: {},
      response: { status: 404 }
    });

    expect(fetchMock.called(url)).toBe(true);
  });

  it('supports options as function', async () => {
    const url = 'http://localhost';
    const data = { hello: 'world' };
    fetchMock.once(url, data);

    const mockChildren = jest.fn();
    mockChildren.mockReturnValue(<div />);

    const mockOptions = jest.fn();
    const options = { headers: { 'Cache-Control': 'no-cache' } };
    mockOptions.mockReturnValue(options);

    const {} = render(
      <Fetch url={url} options={mockOptions}>
        {mockChildren}
      </Fetch>
    );

    // Once for initial, once for loading, and once for response
    await wait(() => expect(mockChildren.mock.calls.length).toBe(3));

    expect(mockOptions.mock.calls.length).toBe(1);
    expect(fetchMock.calls(url)[0][1]).toMatchObject(options);

    // Initial state
    expect(mockChildren.mock.calls[0][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Loading...
    expect(mockChildren.mock.calls[1][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Data loaded
    expect(mockChildren.mock.calls[2][0]).toMatchObject({
      loading: false,
      data,
      request: {},
      response: {}
    });

    expect(fetchMock.called(url)).toBe(true);
  });
});

describe('fetching', () => {
  it('supports refetching data if "fetch" called', async () => {
    const url = 'http://localhost';
    const error = { Error: 'BOOM!' };
    fetchMock.once(url, { status: 500, body: error });
    const data = { hello: 'world' };
    fetchMock.once(url, data);

    let savedProps = null;

    const mockChildren = jest.fn(props => {
      savedProps = props;
      return <div />;
    });

    const {} = render(<Fetch url={url}>{mockChildren}</Fetch>);

    // Once for initial and once for loading, and once data returned
    await wait(() => expect(mockChildren.mock.calls.length).toBe(3));

    savedProps.fetch();

    // Once for loading second request, and one for data returned
    await wait(() => expect(mockChildren.mock.calls.length).toBe(5));

    // Initial state
    expect(mockChildren.mock.calls[0][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Loading...
    expect(mockChildren.mock.calls[1][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Error returned
    expect(mockChildren.mock.calls[2][0]).toMatchObject({
      loading: false,
      error,
      request: {},
      response: {}
    });

    // Refetching...
    expect(mockChildren.mock.calls[3][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Data returned
    expect(mockChildren.mock.calls[4][0]).toMatchObject({
      loading: false,
      data,
      request: {},
      response: {}
    });

    expect(fetchMock.called(url)).toBe(true);
  });

  it('does not fetch if url prop is undefined', async () => {
    const data = { hello: 'world' };
    fetchMock.once('*', data);

    const mockChildren = jest.fn();
    mockChildren.mockReturnValue(<div />);

    const {} = render(<Fetch>{mockChildren}</Fetch>);

    // Once for initial, once for loading, and once for response
    expect(mockChildren.mock.calls.length).toBe(1);

    // Initial state
    expect(mockChildren.mock.calls[0][0]).toMatchObject({
      loading: true,
      request: {}
    });

    expect(fetchMock.called('*')).toBe(false);
  });

  it('does not fetch if url prop is false', async () => {
    const data = { hello: 'world' };
    fetchMock.once('*', data);

    const mockChildren = jest.fn();
    mockChildren.mockReturnValue(<div />);

    const {} = render(<Fetch url={false}>{mockChildren}</Fetch>);

    // // Once for initial, once for loading, and once for response
    expect(mockChildren.mock.calls.length).toBe(1);

    // // Initial state
    expect(mockChildren.mock.calls[0][0]).toMatchObject({
      loading: true,
      request: {}
    });

    expect(fetchMock.called('*')).toBe(false);
  });

  it('does not re-fetch if url changes to "false"', async () => {
    const url = 'http://localhost/foo';
    const data = { name: 'foo' };
    fetchMock.get(url, data);

    const mockChildren = jest.fn();
    mockChildren.mockReturnValue(<div />);

    // Initial url
    const { rerender } = render(<Fetch url={url}>{mockChildren}</Fetch>);

    // Change url
    rerender(<Fetch url={false}>{mockChildren}</Fetch>);

    expect(mockChildren.mock.calls.length).toBe(3);

    expect(fetchMock.calls(url).length).toBe(1);
  });

  it('does not fetch if url prop is an empty string', async () => {
    const data = { hello: 'world' };
    fetchMock.once('*', data);

    const mockChildren = jest.fn();
    mockChildren.mockReturnValue(<div />);

    const {} = render(<Fetch url="">{mockChildren}</Fetch>);

    // Once for initial, once for loading, and once for response
    expect(mockChildren.mock.calls.length).toBe(1);

    // Initial state
    expect(mockChildren.mock.calls[0][0]).toMatchObject({
      loading: true,
      request: {}
    });

    expect(fetchMock.called('*')).toBe(false);
  });

  it('does not initially fetch if "manual" prop is true/set', async () => {
    const data = { hello: 'world' };
    fetchMock.once('*', data);

    const mockChildren = jest.fn();
    mockChildren.mockReturnValue(<div />);

    const {} = render(
      <Fetch url="http://localhost" manual>
        {mockChildren}
      </Fetch>
    );

    // Once for initial, once for loading, and once for response
    expect(mockChildren.mock.calls.length).toBe(1);

    // Initial state
    expect(mockChildren.mock.calls[0][0]).toMatchObject({
      loading: null,
      request: {}
    });

    expect(fetchMock.called('*')).toBe(false);
  });

  it('does not fetch if "manual" prop is set and url changes', async () => {
    const url1 = 'http://localhost/foo';
    const data1 = { name: 'foo' };
    fetchMock.get(url1, data1);
    const url2 = 'http://localhost/bar';
    const data2 = { name: 'bar' };
    fetchMock.get(url2, data2);

    const mockChildren = jest.fn();
    mockChildren.mockReturnValue(<div />);

    // Initial url
    const { rerender } = render(
      <Fetch url={url1} manual>
        {mockChildren}
      </Fetch>
    );

    // Change url
    rerender(
      <Fetch url={url2} manual>
        {mockChildren}
      </Fetch>
    );

    expect(mockChildren.mock.calls.length).toBe(2);

    expect(fetchMock.calls(url1).length).toBe(0);
    expect(fetchMock.calls(url2).length).toBe(0);
  });

  it('supports manually fetching data when "manual" prop set and "fetch" is called', async () => {
    const url = 'http://localhost';
    const data = { hello: 'world' };
    fetchMock.once(url, data);

    let savedProps = null;

    const mockChildren = jest.fn(props => {
      savedProps = props;
      return <div />;
    });

    const {} = render(
      <Fetch url={url} manual>
        {mockChildren}
      </Fetch>
    );

    expect(fetchMock.called(url)).toBe(false); // no request made
    savedProps.fetch();
    expect(fetchMock.called(url)).toBe(true); // no request made

    // Once for initial and once for loading, but should not be called when the response is returned
    await wait(() => expect(mockChildren.mock.calls.length).toBe(3));

    // Initial state
    expect(mockChildren.mock.calls[0][0]).toMatchObject({
      loading: null,
      request: {}
    });

    // Loading...
    expect(mockChildren.mock.calls[1][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Data returned
    expect(mockChildren.mock.calls[2][0]).toMatchObject({
      loading: false,
      data,
      request: {},
      response: {}
    });

    expect(fetchMock.called(url)).toBe(true);
  });

  it('supports delaying the initial fetch by changing url prop', async () => {
    const url = 'http://localhost';
    const data = { hello: 'world' };
    fetchMock.once(url, data);

    const mockChildren = jest.fn();
    mockChildren.mockReturnValue(<div />);

    // Mount component but should not issue request
    const { rerender } = render(<Fetch>{mockChildren}</Fetch>);
    expect(mockChildren.mock.calls.length).toBe(1);

    // Set url to issue request
    rerender(<Fetch url={url}>{mockChildren}</Fetch>);

    // Once for mount, once for the delayed setting of url, once for loading, and once for response
    await wait(() => expect(mockChildren.mock.calls.length).toBe(4));

    // Initial state
    expect(mockChildren.mock.calls[0][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Setting the url but no fetch issued yet
    expect(mockChildren.mock.calls[1][0]).toMatchObject({ loading: true });

    // Loading...
    expect(mockChildren.mock.calls[2][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Data loaded
    expect(mockChildren.mock.calls[3][0]).toMatchObject({
      loading: false,
      data,
      request: {},
      response: {}
    });

    expect(fetchMock.called(url)).toBe(true);
  });

  it('does not re-fetch if url does not change and component is re-rendered', async () => {
    const url = 'http://localhost';
    const data = { hello: 'world' };
    fetchMock.once(url, data);

    const mockChildren = jest.fn();
    mockChildren.mockReturnValue(<div />);

    // Mount component but should not issue request
    const { rerender } = render(<Fetch url={url}>{mockChildren}</Fetch>);
    await wait(() => expect(mockChildren.mock.calls.length).toBe(3));
    await wait(() => expect(fetchMock.calls(url).length).toBe(1));

    // Set url to issue request
    rerender(<Fetch url={url}>{mockChildren}</Fetch>);

    // Once for mount, once for the delayed setting of url, once for loading, and once for response
    await wait(() => expect(mockChildren.mock.calls.length).toBe(4));

    // Initial state
    expect(mockChildren.mock.calls[0][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Setting the url but no fetch issued yet
    expect(mockChildren.mock.calls[1][0]).toMatchObject({ loading: true });

    // Data loaded
    expect(mockChildren.mock.calls[2][0]).toMatchObject({
      loading: false,
      data,
      request: {},
      response: {}
    });

    // Re-render but no fetch
    expect(mockChildren.mock.calls[3][0]).toMatchObject({
      loading: false,
      data,
      request: {},
      response: {}
    });

    expect(fetchMock.called(url)).toBe(true);
  });

  it('supports passing options to "fetch" function but keep original url (undefined / null)', async () => {
    const url = 'http://localhost';

    const data1 = { foo: 1 };
    fetchMock.getOnce(url, data1);

    const data2 = { bar: 2 };
    fetchMock.postOnce(url, data2);

    let savedProps = null;

    const mockChildren = jest.fn(props => {
      savedProps = props;
      return <div />;
    });

    const {} = render(<Fetch url={url}>{mockChildren}</Fetch>);

    await wait(() => expect(mockChildren.mock.calls.length).toBe(3));
    savedProps.fetch(null, { method: 'post' });

    // 1x initial, 2x loading, 2x data
    await wait(() => expect(mockChildren.mock.calls.length).toBe(5));

    // Initial state
    expect(mockChildren.mock.calls[0][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Loading...
    expect(mockChildren.mock.calls[1][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Data returned
    expect(mockChildren.mock.calls[2][0]).toMatchObject({
      loading: false,
      data: data1,
      request: {},
      response: {}
    });

    // Loading...
    expect(mockChildren.mock.calls[3][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Data returned
    expect(mockChildren.mock.calls[4][0]).toMatchObject({
      loading: false,
      data: data2,
      request: {},
      response: {}
    });

    expect(fetchMock.called(url)).toBe(true);
  });

  it('supports passing url to "fetch" function', async () => {
    const url1 = 'http://localhost/1';
    const data1 = { foo: 1 };
    fetchMock.once(url1, data1);

    const url2 = 'http://localhost/2';
    const data2 = { bar: 2 };
    fetchMock.once(url2, data2);

    let savedProps = null;

    const mockChildren = jest.fn(props => {
      savedProps = props;
      return <div />;
    });

    const {} = render(<Fetch url={url1}>{mockChildren}</Fetch>);

    await wait(() => expect(mockChildren.mock.calls.length).toBe(3));
    expect(fetchMock.called(url1)).toBe(true);
    savedProps.fetch(url2);

    // 1x initial, 2x loading, 2x data
    await wait(() => expect(mockChildren.mock.calls.length).toBe(5));

    // Initial state
    expect(mockChildren.mock.calls[0][0]).toMatchObject({
      loading: true,
      request: { url: url1 }
    });

    // Loading...
    expect(mockChildren.mock.calls[1][0]).toMatchObject({
      loading: true,
      request: { url: url1 }
    });

    // Data returned
    expect(mockChildren.mock.calls[2][0]).toMatchObject({
      loading: false,
      data: data1,
      request: { url: url1 },
      response: {}
    });

    // Loading...
    expect(mockChildren.mock.calls[3][0]).toMatchObject({
      loading: true,
      request: { url: url2 }
    });

    // Data returned
    expect(mockChildren.mock.calls[4][0]).toMatchObject({
      loading: false,
      data: data2,
      request: { url: url2 },
      response: {}
    });

    expect(fetchMock.called(url2)).toBe(true);
  });

  it('ignores/discards slow responses if later fetch is returned first (out of order)', async () => {
    const url = 'http://localhost';
    const responseData1 = { response: 1 };
    const response1 = new Promise((resolve, reject) =>
      setTimeout(() => resolve(responseData1), 300)
    );
    fetchMock.once(url, response1);

    const responseData2 = { response: 2 };
    const response2 = new Promise((resolve, reject) =>
      setTimeout(() => resolve(responseData2), 100)
    );
    fetchMock.once(url, response2);

    const responseData3 = { response: 3 };
    const response3 = new Promise((resolve, reject) =>
      setTimeout(() => resolve(responseData3), 100)
    );
    fetchMock.once(url, response3);

    let savedProps = null;

    const mockChildren = jest.fn(props => {
      savedProps = props;
      return <div />;
    });

    const {} = render(<Fetch url={url}>{mockChildren}</Fetch>);

    // Fetch request #2
    savedProps.fetch();

    // Fetch request #3
    savedProps.fetch();

    await Promise.all([response1, response2, response3]);

    // Would have been 5 if request 1 was not ignored
    expect(mockChildren.mock.calls.length).toBe(6);

    // Initial state
    expect(mockChildren.mock.calls[0][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Loading request 1
    expect(mockChildren.mock.calls[1][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Loading request 2 (before request 1 returns)
    expect(mockChildren.mock.calls[2][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Loading request 3 (before request 1 returns)
    expect(mockChildren.mock.calls[3][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Request 2 returns first
    expect(mockChildren.mock.calls[4][0]).toMatchObject({
      loading: false,
      data: responseData2,
      request: {},
      response: {}
    });

    // Request 3 returns first
    expect(mockChildren.mock.calls[5][0]).toMatchObject({
      loading: false,
      data: responseData3,
      request: {},
      response: {}
    });

    // Request 1's response was ignored

    expect(fetchMock.called(url)).toBe(true);
  });

  it('supports custom fetch function passed into props', async () => {
    const url = 'http://localhost';
    const data = { hello: 'world' };
    fetchMock.once(url, data);

    const mockChildren = jest.fn();
    mockChildren.mockReturnValue(<div />);

    const mockFetch = jest.fn();
    mockFetch.mockImplementation(fetch);

    const {} = render(
      <Fetch url={url} fetchFunction={mockFetch}>
        {mockChildren}
      </Fetch>
    );
    await wait(() => expect(mockChildren.mock.calls.length).toBe(3));

    expect(mockFetch).toBeCalledWith('http://localhost', undefined);
  });

  it('supports custom fetch function passed into props with custom debouncing', async () => {
    let url = 'http://localhost';
    const data = { hello: 'world' };
    fetchMock.mock(url, data);

    const nonDebouncedFetch = jest.fn().mockImplementation(fetch);

    // See: https://stackoverflow.com/a/35228455/191902 or https://github.com/bjoerge/debounce-promise
    function debouncePromise(inner, ms = 0) {
      let timer = null;
      let resolves = [];

      return function(...args) {
        // Run the function after a certain amount of time
        clearTimeout(timer);
        timer = setTimeout(() => {
          // Get the result of the inner function, then apply it to the resolve function of
          // each promise that has been created since the last time the inner function was run
          let result = inner(...args);
          resolves.forEach(r => r(result));
          resolves = [];
        }, ms);

        return new Promise(r => resolves.push(r));
      };
    }

    let debouncedMockChildrenSavedProps = null;
    const debouncedMockChildren = jest.fn(props => {
      debouncedMockChildrenSavedProps = props;
      return <div />;
    });
    const debouncedFetchMock = jest.fn().mockImplementation(fetch);
    const debouncedFetch = jest
      .fn()
      .mockImplementation(debouncePromise(debouncedFetchMock, 10));
    const {} = render(
      <Fetch url={url} fetchFunction={debouncedFetch}>
        {debouncedMockChildren}
      </Fetch>
    );
    debouncedMockChildrenSavedProps.fetch();
    debouncedMockChildrenSavedProps.fetch();
    debouncedMockChildrenSavedProps.fetch();

    let nonDebouncedMockChildrenSavedProps = null;
    const nonDebouncedMockChildren = jest.fn(props => {
      nonDebouncedMockChildrenSavedProps = props;
      return <div />;
    });
    const {} = render(
      <Fetch url={url} fetchFunction={nonDebouncedFetch}>
        {nonDebouncedMockChildren}
      </Fetch>
    );
    nonDebouncedMockChildrenSavedProps.fetch();
    nonDebouncedMockChildrenSavedProps.fetch();
    nonDebouncedMockChildrenSavedProps.fetch();

    await wait(() => expect(nonDebouncedFetch).toHaveBeenCalledTimes(4));
    await wait(() => expect(nonDebouncedMockChildren).toHaveBeenCalledTimes(9));

    // Initial state
    expect(nonDebouncedMockChildren.mock.calls[0][0]).toMatchObject({
      loading: true,
      request: {}
    });
    // Loading request 1
    expect(nonDebouncedMockChildren.mock.calls[1][0]).toMatchObject({
      loading: true,
      request: {}
    });
    // Loading request 2
    expect(nonDebouncedMockChildren.mock.calls[2][0]).toMatchObject({
      loading: true,
      request: {}
    });
    // Loading request 3
    expect(nonDebouncedMockChildren.mock.calls[3][0]).toMatchObject({
      loading: true,
      request: {}
    });
    // Loading request 4
    expect(nonDebouncedMockChildren.mock.calls[4][0]).toMatchObject({
      loading: true,
      request: {}
    });
    // Data loaded request 1
    expect(nonDebouncedMockChildren.mock.calls[5][0]).toMatchObject({
      loading: false,
      data,
      request: {},
      response: {}
    });
    // Data loaded request 2
    expect(nonDebouncedMockChildren.mock.calls[6][0]).toMatchObject({
      loading: false,
      data,
      request: {},
      response: {}
    });
    // Data loaded request 3
    expect(nonDebouncedMockChildren.mock.calls[7][0]).toMatchObject({
      loading: false,
      data,
      request: {},
      response: {}
    });
    // Data loaded request 4
    expect(nonDebouncedMockChildren.mock.calls[8][0]).toMatchObject({
      loading: false,
      data,
      request: {},
      response: {}
    });

    await wait(() => expect(debouncedFetch).toHaveBeenCalledTimes(4));
    await wait(() => expect(debouncedFetchMock).toHaveBeenCalledTimes(1));
    await wait(() => expect(debouncedMockChildren).toHaveBeenCalledTimes(9));

    // TODO: Find way to check data returned(not just the existence of the `data` key.  i.e.  `data: {}`)
    // TODO: Determine why there are 3 data loaded states instead of 4 (and would be nice if there was only 1)
    // Initial state
    expect(debouncedMockChildren.mock.calls[0][0]).toMatchObject({
      loading: true,
      request: {}
    });
    // Loading request 1
    expect(debouncedMockChildren.mock.calls[1][0]).toMatchObject({
      loading: true,
      request: {}
    });
    // Loading request 2
    expect(debouncedMockChildren.mock.calls[2][0]).toMatchObject({
      loading: true,
      request: {}
    });
    // Loading request 3
    expect(debouncedMockChildren.mock.calls[3][0]).toMatchObject({
      loading: true,
      request: {}
    });
    // Loading request 4
    expect(debouncedMockChildren.mock.calls[4][0]).toMatchObject({
      loading: true,
      request: {}
    });
    // Data loaded request 1
    expect(debouncedMockChildren.mock.calls[5][0]).toMatchObject({
      loading: false,
      data: {},
      request: {},
      response: {}
    });
    // Data loaded request 2, should be the same as in data 1...
    expect(debouncedMockChildren.mock.calls[6][0]).toMatchObject({
      loading: false,
      data: {},
      request: {},
      response: {}
    });
    // Data loaded request 3 and 4(?) should be the same as in data 1...
    expect(debouncedMockChildren.mock.calls[7][0]).toMatchObject({
      loading: false,
      data: {},
      request: {},
      response: {}
    });
  });
});

describe('body passing', () => {
  it('handles default (auto) with json response', async () => {
    const url = 'http://localhost';
    const data = { hello: 'world' };
    fetchMock.once(url, data);

    const mockChildren = jest.fn();
    mockChildren.mockReturnValue(<div />);

    const {} = render(<Fetch url={url}>{mockChildren}</Fetch>);

    // Once for initial, once for loading, and once for response
    await wait(() => expect(mockChildren.mock.calls.length).toBe(3));

    // Initial state
    expect(mockChildren.mock.calls[0][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Loading...
    expect(mockChildren.mock.calls[1][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Data loaded
    expect(mockChildren.mock.calls[2][0]).toMatchObject({
      loading: false,
      data,
      request: {},
      response: {}
    });

    expect(fetchMock.called(url)).toBe(true);
  });

  it('handles default (auto) with html response', async () => {
    const url = 'http://localhost';
    const data = '<html />';
    fetchMock.once(url, {
      body: data,
      headers: { 'content-type': 'text/html' }
    });

    const mockChildren = jest.fn();
    mockChildren.mockReturnValue(<div />);

    const {} = render(<Fetch url={url}>{mockChildren}</Fetch>);

    // Once for initial, once for loading, and once for response
    await wait(() => expect(mockChildren.mock.calls.length).toBe(3));

    // Initial state
    expect(mockChildren.mock.calls[0][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Loading...
    expect(mockChildren.mock.calls[1][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Data loaded
    expect(mockChildren.mock.calls[2][0]).toMatchObject({
      loading: false,
      data,
      request: {},
      response: {}
    });

    expect(fetchMock.called(url)).toBe(true);
  });

  it('supports "as" as a function for custom body parsing', async () => {
    const url = 'http://localhost';
    const data = { foo: 'foo' };
    fetchMock.once(url, { body: data });

    const mockChildren = jest.fn();
    mockChildren.mockReturnValue(<div />);

    const {} = render(
      <Fetch url={url} as={res => res.text()}>
        {mockChildren}
      </Fetch>
    );

    // Once for initial, once for loading, and once for response
    await wait(() => expect(mockChildren.mock.calls.length).toBe(3));

    // Initial state
    expect(mockChildren.mock.calls[0][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Loading...
    expect(mockChildren.mock.calls[1][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Data loaded
    expect(mockChildren.mock.calls[2][0]).toMatchObject({
      loading: false,
      data: JSON.stringify(data),
      request: {},
      response: {}
    });

    expect(fetchMock.called(url)).toBe(true);
  });

  it('supports "as" as an object with simple name for custom body parsing', async () => {
    const url = 'http://localhost';
    const date = new Date();
    const data = { someDate: date.toISOString() };
    fetchMock.once(url, { body: data });

    const mockChildren = jest.fn();
    mockChildren.mockReturnValue(<div />);

    const {} = render(
      <Fetch
        url={url}
        as={{ json: async res => JSON.parse(await res.text(), reviver) }}
      >
        {mockChildren}
      </Fetch>
    );

    // Once for initial, once for loading, and once for response
    await wait(() => expect(mockChildren.mock.calls.length).toBe(3));

    // Initial state
    expect(mockChildren.mock.calls[0][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Loading...
    expect(mockChildren.mock.calls[1][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Data loaded
    expect(mockChildren.mock.calls[2][0]).toMatchObject({
      loading: false,
      data: { someDate: date },
      request: {},
      response: {}
    });

    expect(fetchMock.called(url)).toBe(true);
  });

  it('supports "as" as an object with Content-Type for custom body parsing', async () => {
    const url = 'http://localhost';
    const date = new Date();
    const data = { someDate: date.toISOString() };
    fetchMock.once(url, { body: data });

    const mockChildren = jest.fn();
    mockChildren.mockReturnValue(<div />);

    const {} = render(
      <Fetch
        url={url}
        as={{
          'application/json': async res => JSON.parse(await res.text(), reviver)
        }}
      >
        {mockChildren}
      </Fetch>
    );

    // Once for initial, once for loading, and once for response
    await wait(() => expect(mockChildren.mock.calls.length).toBe(3));

    // Initial state
    expect(mockChildren.mock.calls[0][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Loading...
    expect(mockChildren.mock.calls[1][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Data loaded
    expect(mockChildren.mock.calls[2][0]).toMatchObject({
      loading: false,
      data: { someDate: date },
      request: {},
      response: {}
    });

    expect(fetchMock.called(url)).toBe(true);
  });
});

describe('error handling', () => {
  it('sets error on failure', async () => {
    const url = 'http://localhost';
    const error = { Error: 'BOOM!' };
    fetchMock.once(url, { status: 500, body: error });

    const mockChildren = jest.fn().mockReturnValue(<div />);

    const {} = render(<Fetch url={url}>{mockChildren}</Fetch>);

    // Once for initial, once for loading, and once for response
    await wait(() => expect(mockChildren.mock.calls.length).toBe(3));

    // Initial state
    expect(mockChildren.mock.calls[0][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Loading...
    expect(mockChildren.mock.calls[1][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Error returned
    expect(mockChildren.mock.calls[2][0]).toMatchObject({
      loading: false,
      error,
      request: {},
      response: {}
    });

    expect(fetchMock.called(url)).toBe(true);
  });

  // TODO: failing after upgrading fetch-mock from 5.12 to 6.3
  it.skip('sets error if exception during request (ex. CORS issue)', async () => {
    const url = 'http://localhost';
    const error = new TypeError('Failed to fetch');
    fetchMock.once(url, { status: 500, throws: error });

    const mockChildren = jest.fn();
    mockChildren.mockReturnValue(<div />);

    const {} = render(<Fetch url={url}>{mockChildren}</Fetch>);

    try {
      await Promise.all(instance.promises);
      fail('Promise should have rejected');
    } catch (e) {
      expect(e).not.toBeNull();
    }
    // TODO: Use the following once jest 0.20 is released:
    // https://facebook.github.io/jest/docs/expect.html#rejects
    // await expect(instance.promise).rejects.toEqual('Failed to fetch');

    // Once for initial, once for loading, and once for response
    await wait(() => expect(mockChildren.mock.calls.length).toBe(3));

    // Initial state
    expect(mockChildren.mock.calls[0][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Loading...
    expect(mockChildren.mock.calls[1][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Error returned
    expect(mockChildren.mock.calls[2][0]).toMatchObject({
      loading: false,
      error,
      request: {}
    });

    expect(fetchMock.called(url)).toBe(true);
  });

  it('clears error after successful response', async () => {
    const url = 'http://localhost';
    const error = { Error: 'BOOM!' };
    fetchMock.once(url, { status: 500, body: error });
    const data = { hello: 'world' };
    fetchMock.once(url, data);

    let savedProps = null;

    const mockChildren = jest.fn(props => {
      savedProps = props;
      return <div />;
    });

    const {} = render(<Fetch url={url}>{mockChildren}</Fetch>);

    await wait(() => expect(mockChildren.mock.calls.length).toBe(3));
    savedProps.fetch();

    // Once for initial and once for loading, but should not be called when the response is returned
    await wait(() => expect(mockChildren.mock.calls.length).toBe(5));

    // Initial state
    expect(mockChildren.mock.calls[0][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Loading...
    expect(mockChildren.mock.calls[1][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Error returned
    expect(mockChildren.mock.calls[2][0]).toMatchObject({
      loading: false,
      error,
      request: {},
      response: {}
    });

    // Refetching...
    expect(mockChildren.mock.calls[3][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Data returned
    expect(mockChildren.mock.calls[4][0]).toMatchObject({
      loading: false,
      data,
      request: {},
      response: {}
    });
    expect(mockChildren.mock.calls[4][0].error).toBeUndefined();

    expect(fetchMock.called(url)).toBe(true);
  });
});

describe('cache', () => {
  it('returns cached result if set', async () => {
    const url1 = 'http://localhost/foo';
    const data1 = { name: 'foo' };
    fetchMock.get(url1, data1);
    const url2 = 'http://localhost/bar';
    const data2 = { name: 'bar' };
    fetchMock.get(url2, data2);

    const mockChildren = jest.fn();
    mockChildren.mockReturnValue(<div />);

    // First request
    const { rerender } = render(
      <Fetch url={url1} cache>
        {mockChildren}
      </Fetch>
    );
    await wait(() => expect(mockChildren.mock.calls.length).toBe(3));

    // Second request
    rerender(
      <Fetch url={url2} cache>
        {mockChildren}
      </Fetch>
    );
    await wait(() => expect(mockChildren.mock.calls.length).toBe(6));

    // Third, should be pulled from cache
    rerender(
      <Fetch url={url1} cache>
        {mockChildren}
      </Fetch>
    );

    // TODO: not sure why 8 rerendered, would expect 7 (initial + 3x loading + 3x data)
    await wait(() => expect(mockChildren.mock.calls.length).toBe(8));

    // Initial state
    expect(mockChildren.mock.calls[0][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Loading first request
    expect(mockChildren.mock.calls[1][0]).toMatchObject({
      loading: true,
      request: { url: url1 }
    });

    // First request data
    expect(mockChildren.mock.calls[2][0]).toMatchObject({
      loading: false,
      data: data1,
      request: { url: url1 },
      response: {}
    });

    // TODO: Not sure
    expect(mockChildren.mock.calls[3][0]).toMatchObject({
      loading: false,
      request: { url: url1 }
    });

    // Loading second request
    expect(mockChildren.mock.calls[4][0]).toMatchObject({
      loading: true,
      request: { url: url2 }
    });

    // Second request data
    expect(mockChildren.mock.calls[5][0]).toMatchObject({
      loading: false,
      data: data2,
      request: { url: url2 },
      response: {}
    });

    // TODO: Not sure
    expect(mockChildren.mock.calls[6][0]).toMatchObject({
      loading: false,
      data: data2,
      request: { url: url2 },
      response: {}
    });

    // Third request data (from cache)
    expect(mockChildren.mock.calls[7][0]).toMatchObject({
      loading: false,
      data: data1,
      request: { url: url1 },
      response: {}
    });
  });

  it('cache not shared between instances by default', async () => {
    const url = 'http://localhost/foo';
    const data = { name: 'foo' };
    fetchMock.get(url, data);

    // First request/instance
    const mockChildren1 = jest.fn();
    mockChildren1.mockReturnValue(<div />);
    const {} = render(
      <Fetch url={url} cache>
        {mockChildren1}
      </Fetch>
    );

    // Second request/instance
    const mockChildren2 = jest.fn();
    mockChildren2.mockReturnValue(<div />);
    const {} = render(
      <Fetch url={url} cache>
        {mockChildren2}
      </Fetch>
    );

    // Should be called by both instances
    await wait(() => expect(fetchMock.calls(url).length).toBe(2));

    // Instance1
    await wait(() => expect(mockChildren1.mock.calls.length).toBe(3));
    expect(mockChildren1.mock.calls[0][0]).toMatchObject({
      loading: true,
      request: {}
    });
    expect(mockChildren1.mock.calls[1][0]).toMatchObject({
      loading: true,
      request: { url }
    });
    expect(mockChildren1.mock.calls[2][0]).toMatchObject({
      loading: false,
      data,
      request: { url },
      response: {}
    });

    // Instance2
    await wait(() => expect(mockChildren2.mock.calls.length).toBe(3));
    expect(mockChildren2.mock.calls[0][0]).toMatchObject({
      loading: true,
      request: {}
    });
    expect(mockChildren1.mock.calls[1][0]).toMatchObject({
      loading: true,
      request: { url }
    });
    expect(mockChildren2.mock.calls[2][0]).toMatchObject({
      loading: false,
      data,
      request: { url },
      response: {}
    });
  });

  it('should support passing a shared cache to multiple instances', async () => {
    const url = 'http://localhost/foo';
    const data = { name: 'foo' };
    const sharedCache = new SimpleCache();
    fetchMock.get(url, data);

    // First request/instance
    const mockChildren1 = jest.fn();
    mockChildren1.mockReturnValue(<div />);
    const {} = render(
      <Fetch url={url} cache={sharedCache}>
        {mockChildren1}
      </Fetch>
    );

    // Second request/instance
    const mockChildren2 = jest.fn();
    mockChildren2.mockReturnValue(<div />);
    const {} = render(
      <Fetch url={url} cache={sharedCache}>
        {mockChildren2}
      </Fetch>
    );

    // Should only be called by the first instance
    await wait(() => expect(fetchMock.calls(url).length).toBe(1));

    // Instance1
    await wait(() => expect(mockChildren1.mock.calls.length).toBe(3));
    expect(mockChildren1.mock.calls[0][0]).toMatchObject({
      loading: true,
      request: {}
    });
    expect(mockChildren1.mock.calls[1][0]).toMatchObject({
      loading: true,
      request: { url }
    });
    expect(mockChildren1.mock.calls[2][0]).toMatchObject({
      loading: false,
      data,
      request: { url },
      response: {}
    });

    // Instance2
    await wait(() => expect(mockChildren2.mock.calls.length).toBe(2));
    expect(mockChildren2.mock.calls[0][0]).toMatchObject({
      loading: true,
      request: {}
    });
    expect(mockChildren2.mock.calls[1][0]).toMatchObject({
      loading: false,
      data,
      request: { url },
      response: {}
    });
  });
});

describe('children', () => {
  it('supports no children (fire and forget)', async () => {
    const url = 'http://localhost';
    const data = { hello: 'world' };
    fetchMock.once(url, data);

    const mockChildren = jest.fn();
    mockChildren.mockReturnValue(<div />);

    const {} = render(<Fetch url={url} />);

    await wait(() => expect(fetchMock.called(url)).toBe(true));
  });

  it('supports children as single DOM element', async () => {
    const url = 'http://localhost';
    const data = { hello: 'world' };
    fetchMock.once(url, data);

    const { getByText } = render(
      <Fetch url={url}>
        <div>foo</div>
      </Fetch>
    );
    await wait();
    // Once for initial, once for loading, and once for response
    expect(getByText('foo').textContent).toEqual('foo');

    expect(fetchMock.called(url)).toBe(true);
  });
});

describe('onChange', () => {
  it('supports onChange prop', async () => {
    const url = 'http://localhost';
    const data = { hello: 'world' };
    fetchMock.once(url, data);

    const mockOnChange = jest.fn();

    const {} = render(<Fetch url={url} onChange={mockOnChange} />);

    await wait(() => expect(mockOnChange.mock.calls.length).toBe(3));

    // // Initial state
    expect(mockOnChange.mock.calls[0][0]).toMatchObject({ loading: true });

    // // Loading...
    expect(mockOnChange.mock.calls[1][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // // Data loaded
    expect(mockOnChange.mock.calls[2][0]).toMatchObject({
      loading: false,
      data,
      request: {},
      response: {}
    });

    expect(fetchMock.called(url)).toBe(true);
  });

  it('onChange is still called even if unmounted (useful for POST with redirect)', async () => {
    // TODO: Update docs to indicate the user is responsible for not calling `setState` if the component is unmounted
    const url = 'http://localhost';
    const data = { hello: 'world' };
    fetchMock.once(url, data);

    const mockOnChange = jest.fn();

    const { unmount } = render(<Fetch url={url} onChange={mockOnChange} />);
    unmount();

    await wait(() => expect(fetchMock.called(url)).toBe(true));

    // // Initial state
    expect(mockOnChange.mock.calls[0][0]).toMatchObject({ loading: true });

    // // Loading...
    expect(mockOnChange.mock.calls[1][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // // Data loaded
    expect(mockOnChange.mock.calls[2][0]).toMatchObject({
      loading: false,
      data,
      request: {},
      response: {}
    });
  });
});

describe('onDataChange', () => {
  it('passes updated data to children function if `onDataChange` is set and does not return undefined', async () => {
    const url = 'http://localhost';
    const data = { hello: 'world' };
    fetchMock.once(url, data);

    const mockChildren = jest.fn();
    mockChildren.mockReturnValue(<div />);

    const changedData = { hello: 'everyone' };
    const handleOnDataChange = data => changedData;

    const {} = render(
      <Fetch url={url} onDataChange={handleOnDataChange}>
        {mockChildren}
      </Fetch>
    );

    // Once for initial, once for loading, and once for response
    await wait(() => expect(mockChildren.mock.calls.length).toBe(3));

    // Initial state
    expect(mockChildren.mock.calls[0][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Loading...
    expect(mockChildren.mock.calls[1][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Data loaded
    expect(mockChildren.mock.calls[2][0]).toMatchObject({
      loading: false,
      data: changedData,
      request: {},
      response: {}
    });

    expect(fetchMock.called(url)).toBe(true);
  });

  it('passes updated data to `onChange` function if `onDataChange` is set and does not return undefined', async () => {
    const url = 'http://localhost';
    const data = { hello: 'world' };
    fetchMock.once(url, data);

    const mockChildren = jest.fn();
    mockChildren.mockReturnValue(<div />);

    const changedData = { hello: 'everyone' };
    const handleOnDataChange = data => changedData;

    const mockOnChange = jest.fn();

    const {} = render(
      <Fetch
        url={url}
        onDataChange={handleOnDataChange}
        onChange={mockOnChange}
      >
        {mockChildren}
      </Fetch>
    );

    // Once for initial, once for loading, and once for response
    await wait(() => expect(mockOnChange.mock.calls.length).toBe(3));

    // Initial state
    expect(mockOnChange.mock.calls[0][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Loading...
    expect(mockOnChange.mock.calls[1][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Data loaded
    expect(mockOnChange.mock.calls[2][0]).toMatchObject({
      loading: false,
      data: changedData,
      request: {},
      response: {}
    });

    expect(fetchMock.called(url)).toBe(true);
  });

  it('does not pass changes to children function if `onDataChange` does not return a result', async () => {
    const url = 'http://localhost';
    const data = { hello: 'world' };
    fetchMock.once(url, data);

    const mockChildren = jest.fn();
    mockChildren.mockReturnValue(<div />);

    const handleOnDataChange = data => {};

    const {} = render(
      <Fetch url={url} onDataChange={handleOnDataChange}>
        {mockChildren}
      </Fetch>
    );

    // Once for initial, once for loading, and once for response
    await wait(() => expect(mockChildren.mock.calls.length).toBe(3));

    // Initial state
    expect(mockChildren.mock.calls[0][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Loading...
    expect(mockChildren.mock.calls[1][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Data loaded
    expect(mockChildren.mock.calls[2][0]).toMatchObject({
      loading: false,
      data,
      request: {},
      response: {}
    });

    expect(fetchMock.called(url)).toBe(true);
  });

  it('passes updated data to children function if `onDataChange` is set and returns a falsy value (ex. 0)', async () => {
    const url = 'http://localhost';
    const data = { hello: 'world' };
    fetchMock.once(url, data);

    const mockChildren = jest.fn();
    mockChildren.mockReturnValue(<div />);

    const changedData = 0;
    const handleOnDataChange = data => changedData;

    const {} = render(
      <Fetch url={url} onDataChange={handleOnDataChange}>
        {mockChildren}
      </Fetch>
    );

    // Once for initial, once for loading, and once for response
    await wait(() => expect(mockChildren.mock.calls.length).toBe(3));

    // Initial state
    expect(mockChildren.mock.calls[0][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Loading...
    expect(mockChildren.mock.calls[1][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Data loaded
    expect(mockChildren.mock.calls[2][0]).toMatchObject({
      loading: false,
      data: changedData,
      request: {},
      response: {}
    });

    expect(fetchMock.called(url)).toBe(true);
  });

  it('supports modifying data using "onDataChange" and subsequent fetchs', async () => {
    const url = 'http://localhost';
    const responseData1 = { value: 1 };
    fetchMock.once(url, responseData1);

    const responseData2 = { value: 2 };
    fetchMock.once(url, responseData2);

    const responseData3 = { value: 3 };
    fetchMock.once(url, responseData3);

    let savedProps = null;

    const mockChildren = jest.fn(props => {
      savedProps = props;
      return <div />;
    });

    const handleOnDataChange = data => data.value;

    const {} = render(
      <Fetch url={url} onDataChange={handleOnDataChange}>
        {mockChildren}
      </Fetch>
    );
    await wait(() => expect(mockChildren.mock.calls.length).toBe(3));

    // Fetch request #2
    savedProps.fetch();
    await wait(() => expect(mockChildren.mock.calls.length).toBe(5));

    // Fetch request #3
    savedProps.fetch();

    await wait(() => expect(mockChildren.mock.calls.length).toBe(7));

    // Initial state
    expect(mockChildren.mock.calls[0][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Loading request 1
    expect(mockChildren.mock.calls[1][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Request 1 returned
    expect(mockChildren.mock.calls[2][0]).toMatchObject({
      loading: false,
      data: responseData1.value,
      request: {},
      response: {}
    });

    // Loading request 2
    expect(mockChildren.mock.calls[3][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Request 2 returned
    expect(mockChildren.mock.calls[4][0]).toMatchObject({
      loading: false,
      data: responseData2.value,
      request: {},
      response: {}
    });

    // Loading request 3
    expect(mockChildren.mock.calls[5][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Request 2 returned
    expect(mockChildren.mock.calls[6][0]).toMatchObject({
      loading: false,
      data: responseData3.value,
      request: {},
      response: {}
    });

    expect(fetchMock.called(url)).toBe(true);
  });

  it('supports appending data using "onDataChange" and subsequent fetchs', async () => {
    const url = 'http://localhost';
    const responseData1 = { foo: 1 };
    fetchMock.once(url, responseData1);

    const responseData2 = { bar: 2 };
    fetchMock.once(url, responseData2);

    const responseData3 = { baz: 3 };
    fetchMock.once(url, responseData3);

    let savedProps = null;

    const mockChildren = jest.fn(props => {
      savedProps = props;
      return <div />;
    });

    const handleOnDataChange = (newData, currentData = []) => [
      ...currentData,
      newData
    ];

    const {} = render(
      <Fetch url={url} onDataChange={handleOnDataChange}>
        {mockChildren}
      </Fetch>
    );
    await wait(() => expect(mockChildren.mock.calls.length).toBe(3));

    // Fetch request #2
    savedProps.fetch();
    await wait(() => expect(mockChildren.mock.calls.length).toBe(5));

    // Fetch request #3
    savedProps.fetch();
    await wait(() => expect(mockChildren.mock.calls.length).toBe(7));

    // Initial state
    expect(mockChildren.mock.calls[0][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Loading request 1
    expect(mockChildren.mock.calls[1][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Request 1 returned
    expect(mockChildren.mock.calls[2][0]).toMatchObject({
      loading: false,
      data: [responseData1],
      request: {},
      response: {}
    });

    // Loading request 2
    expect(mockChildren.mock.calls[3][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Request 2 returned
    expect(mockChildren.mock.calls[4][0]).toMatchObject({
      loading: false,
      data: [responseData1, responseData2],
      request: {},
      response: {}
    });

    // Loading request 3
    expect(mockChildren.mock.calls[5][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Request 2 returned
    expect(mockChildren.mock.calls[6][0]).toMatchObject({
      loading: false,
      data: [responseData1, responseData2, responseData3],
      request: {},
      response: {}
    });

    expect(fetchMock.called(url)).toBe(true);
  });

  it('supports concatenating data using "onDataChange" and subsequent fetchs', async () => {
    const url = 'http://localhost';
    const responseData1 = [1, 2, 3];
    fetchMock.once(url, responseData1);

    const responseData2 = [4, 5, 6];
    fetchMock.once(url, responseData2);

    const responseData3 = [7, 8, 9];
    fetchMock.once(url, responseData3);

    let savedProps = null;

    const mockChildren = jest.fn(props => {
      savedProps = props;
      return <div />;
    });

    const handleOnDataChange = (newData, currentData = []) => [
      ...currentData,
      ...newData
    ];

    const {} = render(
      <Fetch url={url} onDataChange={handleOnDataChange}>
        {mockChildren}
      </Fetch>
    );
    await wait(() => expect(mockChildren.mock.calls.length).toBe(3));

    // Fetch request #2
    savedProps.fetch();
    await wait(() => expect(mockChildren.mock.calls.length).toBe(5));

    // Fetch request #3
    savedProps.fetch();
    await wait(() => expect(mockChildren.mock.calls.length).toBe(7));

    // Initial state
    expect(mockChildren.mock.calls[0][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Loading request 1
    expect(mockChildren.mock.calls[1][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Request 1 returned
    expect(mockChildren.mock.calls[2][0]).toMatchObject({
      loading: false,
      data: responseData1,
      request: {},
      response: {}
    });

    // Loading request 2
    expect(mockChildren.mock.calls[3][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Request 2 returned
    expect(mockChildren.mock.calls[4][0]).toMatchObject({
      loading: false,
      data: [...responseData1, ...responseData2],
      request: {},
      response: {}
    });

    // Loading request 3
    expect(mockChildren.mock.calls[5][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Request 3 returned
    expect(mockChildren.mock.calls[6][0]).toMatchObject({
      loading: false,
      data: [...responseData1, ...responseData2, ...responseData3],
      request: {},
      response: {}
    });

    expect(fetchMock.called(url)).toBe(true);
  });

  it('supports clearing data before "onDataChange" is called', async () => {
    const url = 'http://localhost';
    const responseData1 = [1, 2, 3];
    fetchMock.once(url, responseData1);

    const responseData2 = [4, 5, 6];
    fetchMock.once(url, responseData2);

    const responseData3 = [7, 8, 9];
    fetchMock.once(url, responseData3);

    let savedProps = null;

    const mockChildren = jest.fn(props => {
      savedProps = props;
      return <div />;
    });

    const handleOnDataChange = (newData, currentData = []) => [
      ...currentData,
      ...newData
    ];

    const {} = render(
      <Fetch url={url} onDataChange={handleOnDataChange}>
        {mockChildren}
      </Fetch>
    );
    await wait(() => expect(mockChildren.mock.calls.length).toBe(3));

    // Fetch request #2
    savedProps.fetch();
    await wait(() => expect(mockChildren.mock.calls.length).toBe(5));

    // Fetch request #3
    savedProps.fetch(url, null, { ignorePreviousData: true });
    await wait(() => expect(mockChildren.mock.calls.length).toBe(7));

    // Initial state
    expect(mockChildren.mock.calls[0][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Loading request 1
    expect(mockChildren.mock.calls[1][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Request 1 returned
    expect(mockChildren.mock.calls[2][0]).toMatchObject({
      loading: false,
      data: responseData1,
      request: {},
      response: {}
    });

    // Loading request 2
    expect(mockChildren.mock.calls[3][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Request 2 returned
    expect(mockChildren.mock.calls[4][0]).toMatchObject({
      loading: false,
      data: [...responseData1, ...responseData2],
      request: {},
      response: {}
    });

    // Loading request 3
    expect(mockChildren.mock.calls[5][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Request 3 returned
    expect(mockChildren.mock.calls[6][0]).toMatchObject({
      loading: false,
      data: responseData3,
      request: {},
      response: {}
    });

    expect(fetchMock.called(url)).toBe(true);
  });

  it('supports clearing data', async () => {
    const url = 'http://localhost';
    const responseData1 = [1, 2, 3];
    fetchMock.once(url, responseData1);

    const responseData2 = [4, 5, 6];
    fetchMock.once(url, responseData2);

    const responseData3 = [7, 8, 9];
    fetchMock.once(url, responseData3);

    const responseData4 = [10, 11, 12];
    fetchMock.once(url, responseData4);

    const responseData5 = [13, 14, 15];
    fetchMock.once(url, responseData5);

    let savedProps = null;

    const mockChildren = jest.fn(props => {
      savedProps = props;
      return <div />;
    });

    const handleOnDataChange = (newData, currentData = []) => [
      ...currentData,
      ...newData
    ];

    const {} = render(
      <Fetch url={url} onDataChange={handleOnDataChange}>
        {mockChildren}
      </Fetch>
    );
    await wait(() => expect(mockChildren.mock.calls.length).toBe(3));

    // Fetch request #2
    savedProps.fetch();
    await wait(() => expect(mockChildren.mock.calls.length).toBe(5));

    // Fetch request #3
    savedProps.fetch();
    await wait(() => expect(mockChildren.mock.calls.length).toBe(7));

    savedProps.clearData();
    await wait(() => expect(mockChildren.mock.calls.length).toBe(8));

    // Fetch request #4
    savedProps.fetch();
    await wait(() => expect(mockChildren.mock.calls.length).toBe(10));

    // Fetch request #5
    savedProps.fetch();
    await wait(() => expect(mockChildren.mock.calls.length).toBe(12));

    // Initial state
    expect(mockChildren.mock.calls[0][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Loading request 1
    expect(mockChildren.mock.calls[1][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Request 1 returned
    expect(mockChildren.mock.calls[2][0]).toMatchObject({
      loading: false,
      data: responseData1,
      request: {},
      response: {}
    });

    // Loading request 2
    expect(mockChildren.mock.calls[3][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Request 2 returned
    expect(mockChildren.mock.calls[4][0]).toMatchObject({
      loading: false,
      data: [...responseData1, ...responseData2],
      request: {},
      response: {}
    });

    // Loading request 3
    expect(mockChildren.mock.calls[5][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Request 3 returned
    expect(mockChildren.mock.calls[6][0]).toMatchObject({
      loading: false,
      data: [...responseData1, ...responseData2, ...responseData3],
      request: {},
      response: {}
    });

    // Data cleared
    expect(mockChildren.mock.calls[7][0]).toMatchObject({
      loading: false,
      data: undefined,
      request: {},
      response: {}
    });

    // Loading request 4
    expect(mockChildren.mock.calls[8][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Request 4 returned
    expect(mockChildren.mock.calls[9][0]).toMatchObject({
      loading: false,
      data: [...responseData4],
      request: {},
      response: {}
    });

    // Loading request 5
    expect(mockChildren.mock.calls[10][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Request 5 returned
    expect(mockChildren.mock.calls[11][0]).toMatchObject({
      loading: false,
      data: [...responseData4, ...responseData5],
      request: {},
      response: {}
    });

    expect(fetchMock.called(url)).toBe(true);
  });
});

describe('context', () => {
  it('deeply nested consumer', async () => {
    const url = 'http://localhost';
    const data = { hello: 'world' };
    fetchMock.once(url, data);

    const mockChildren = jest.fn();
    mockChildren.mockReturnValue(<div />);

    const Listener = () => <Fetch.Consumer>{mockChildren}</Fetch.Consumer>;

    const {} = render(
      <Fetch url={url}>
        <div>
          <div>
            <div>
              <Listener />
            </div>
          </div>
        </div>
      </Fetch>
    );

    // Once for initial, once for loading, and once for response
    await wait(() => expect(mockChildren.mock.calls.length).toBe(3));

    // Initial state
    expect(mockChildren.mock.calls[0][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Loading...
    expect(mockChildren.mock.calls[1][0]).toMatchObject({
      loading: true,
      request: {}
    });

    // Data loaded
    expect(mockChildren.mock.calls[2][0]).toMatchObject({
      loading: false,
      data,
      request: {},
      response: {}
    });

    expect(fetchMock.called(url)).toBe(true);
  });
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
    <Fetch url='http://localhost' onChange={mockOnChange}>
      <div></div>
    </Fetch>
  );
  console.log('after mount')
  const instance = wrapper.instance();
  const promises = instance.promises;

  console.log('before promise resolves')
  await Promise.all(promises);

  expect(mockOnChange.mock.calls.length).toBe(3);
  expect(mockChildren.mock.calls.length).toBe(3);

  // // Initial state
  expect(mockOnChange.mock.calls[0][0]).toMatchObject({ loading: true });

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

// Restore ISO-8601 date strings as `Date` objects when parsing JSON
const DATETIME_FORMAT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/; // yyyy-mm-ddThh:mm:ssZ
function reviver(key, value) {
  if (typeof value === 'string' && DATETIME_FORMAT.test(value)) {
    // datetime in UTC
    return new Date(value);
  }

  return value;
}
