const cache = require('../lib/cache');

test('#clearPrefix', () => {
  cache.put('a-1', 1);
  cache.put('a-2', 1);
  cache.put('b-1', 1);
  cache.clearPrefix('a-');

  expect(cache.keys()).toEqual(['b-1']);
});
