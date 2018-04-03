const memory = require('memory-cache')

// Extending this, so it's easier to update down the road
// e.g. At some point, we might want to selectively clear the cache
class Cache extends memory.Cache {
}

module.exports = new Cache