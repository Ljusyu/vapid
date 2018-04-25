const _ = require('lodash');
const checksum = require('md5-file');
const mkdirp = require('mkdirp');
const pluralize = require('pluralize');

const Utils = _;

Object.assign(Utils, {
  checksum: checksum.sync,

  coerceType: (val) => {
    try {
      return JSON.parse(val);
    } catch (err) {
      return val;
    }
  },

  isPlural: pluralize.isPlural,

  mkdirp: mkdirp.sync,

  noop: () => {},

  pluralize,

  singularize: function singularize(str) {
    return this.pluralize(str, 1);
  },
});

module.exports = Utils;
