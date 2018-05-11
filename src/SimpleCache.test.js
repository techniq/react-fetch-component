import { SimpleCache } from './';
import fetchMock from 'fetch-mock';

describe('SimpleCache', () => {
  const URL = 'http://localhost';
  let cache;

  beforeEach(() => {
    cache = new SimpleCache();
  });
  
  describe('set', () => {
    it('keeps the promise in cache when no errors occur', async () => {
      cache.set(URL, Promise.resolve({ data: 'foo' }));

      const promiseBefore = cache.get(URL);
      expect(promiseBefore).toBeDefined();
      expect(promiseBefore).not.toBeNull();

      await fetchMock.flush();

      const promiseAfter = cache.get(URL);
      expect(promiseAfter).toBeDefined();
      expect(promiseAfter).not.toBeNull();
    });

    it('removes the promise from the cache when an error occurs', async () => {
      cache.set(URL, Promise.resolve({ error: 'bar' }));

      const promiseBefore = cache.get(URL);
      expect(promiseBefore).toBeDefined();
      expect(promiseBefore).not.toBeNull();

      await fetchMock.flush();

      const promiseAfter = cache.get(URL);
      expect(promiseAfter).toBeUndefined();
    });
  });
});
