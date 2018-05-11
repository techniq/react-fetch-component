export default class SimpleCache {
  cache = {};

  get(url) {
    return this.cache[url];
  }

  set(url, promise) {
    this.cache[url] = promise;

    promise.then(({ error }) => {
      if (error) {
        this.remove(url);
      }
    });
  }

  remove(url) {
    delete this.cache[url];
  }

  clear() {
    // TODO: Wait for all outstanding promises to resolve?
    //   `Promise.all(Object.values(cache)).then(() => this.cache = {})` (untested)
    this.cache = {};
  }
}
