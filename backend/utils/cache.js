const cache = new Map();
const TTL = 3600 * 1000; // 1 hour

export const repoCache = {
  get: (key) => {
    const item = cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      cache.delete(key);
      return null;
    }
    return item.value;
  },
  set: (key, value) => {
    cache.set(key, { value, expiry: Date.now() + TTL });
  }
};
