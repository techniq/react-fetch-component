import { SimpleCache } from './';

describe('SimpleCache', () => {
  const URL = 'http://localhost';
  let cache;

  beforeEach(() => {
    cache = new SimpleCache();
  });
  
  describe('set', () => {
    it('keeps the promise in cache when no errors occur', async () => {
      const spy = jest.spyOn(cache, 'remove');

      await cache.set(URL, Promise.resolve({ data: 'foo' }));

      const promise = cache.get(URL);
      expect(promise).toBeDefined();
      expect(promise).not.toBeNull();
      expect(spy).not.toHaveBeenCalled();
    });

    it('removes the promise from the cache when an error occurs', async () => {
      const spy = jest.spyOn(cache, 'remove');

      await cache.set(URL, Promise.resolve({ error: 'bar' }));

      const promise = cache.get(URL);
      expect(promise).toBeUndefined();
      expect(spy).toHaveBeenCalled();
    });
  });
});
