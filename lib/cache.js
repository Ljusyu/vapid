const memory = require('memory-cache');
const Utils = require('./utils');

class Cache extends memory.Cache {
  clearPrefix(prefix) {
    this.keys().forEach((key) => {
      if (Utils.startsWith(key, prefix)) {
        this.del(key);
      }
    });
  }
}

module.exports = new Cache();
